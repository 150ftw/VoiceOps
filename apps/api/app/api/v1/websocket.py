import asyncio
import base64
import json
import uuid
from typing import Any, Dict, Optional
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, status
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.agents.approval_manager import ApprovalManager
from app.agents.orchestrator import AgentOrchestrator
from app.core.database import AsyncSessionLocal
from app.core.logging import logger
from app.core.security import decode_token
from app.models.conversation import Conversation
from app.models.project import Project
from app.models.user import User
from app.services.github_service import GitHubService
from app.voice.stt import get_stt_provider
from app.voice.tts import get_tts_provider

router = APIRouter(tags=["WebSocket Real-Time Voice & Agent"])


class ConnectionManager:
    """Manages active WebSockets and async task cancellation for interruptions."""

    def __init__(self):
        self.active_tasks: Dict[str, asyncio.Task] = {}

    def set_task(self, session_key: str, task: asyncio.Task):
        self.cancel_task(session_key)
        self.active_tasks[session_key] = task

    def cancel_task(self, session_key: str):
        if session_key in self.active_tasks:
            task = self.active_tasks.pop(session_key)
            if not task.done():
                task.cancel()
                logger.info("Cancelled active agent/TTS task on interruption", session_key=session_key)


conn_manager = ConnectionManager()


@router.websocket("/ws/v1/conversations/{conversation_id}")
async def conversation_websocket(
    websocket: WebSocket,
    conversation_id: uuid.UUID,
    token: Optional[str] = None,
):
    await websocket.accept()
    session_id = f"{conversation_id}_{uuid.uuid4().hex[:6]}"
    logger.info("WebSocket connected", conversation_id=str(conversation_id), session_id=session_id)

    # Validate Auth token
    user_id = None
    if token:
        payload = decode_token(token)
        if payload and payload.get("sub"):
            try:
                user_id = uuid.UUID(payload["sub"])
            except Exception:
                pass

    async def send_json(event_type: str, data: Dict[str, Any]):
        try:
            await websocket.send_text(json.dumps({"type": event_type, **data}))
        except Exception as e:
            logger.debug("Failed to send WS message", error=str(e))

    stt_provider = get_stt_provider()
    tts_provider = get_tts_provider()
    orchestrator = AgentOrchestrator()
    audio_buffer = bytearray()

    try:
        while True:
            raw_text = await websocket.receive_text()
            try:
                msg = json.loads(raw_text)
            except Exception:
                continue

            msg_type = msg.get("type")

            # ------------------------------------------------------------------
            # 1. USER INTERRUPTION
            # ------------------------------------------------------------------
            if msg_type == "user.interrupt":
                logger.info("Received user interrupt signal", session_id=session_id)
                conn_manager.cancel_task(session_id)
                audio_buffer.clear()
                await send_json("agent.state.changed", {"state": "idle"})
                continue

            # ------------------------------------------------------------------
            # 2. AUDIO STREAMING & FINALIZATION (Voice STT)
            # ------------------------------------------------------------------
            if msg_type == "user.audio.chunk":
                audio_base64 = msg.get("data")
                if audio_base64:
                    try:
                        chunk_bytes = base64.b64decode(audio_base64)
                        audio_buffer.extend(chunk_bytes)
                    except Exception as e:
                        logger.warning("Failed to decode audio chunk", error=str(e))
                continue

            if msg_type == "user.audio.final":
                user_text = ""
                if len(audio_buffer) > 0:
                    try:
                        transcription = await stt_provider.transcribe_audio_bytes(bytes(audio_buffer))
                        audio_buffer.clear()
                        if transcription and transcription.strip():
                            user_text = transcription.strip()
                            await send_json("user.transcript.final", {"text": user_text})
                    except Exception as stt_err:
                        logger.error("STT Error on final audio", error=str(stt_err))
                        audio_buffer.clear()
                        await send_json("agent.error", {"code": "STT_ERROR", "message": "Voice transcription failed"})
                        continue
                if not user_text:
                    continue
                # Set as content and proceed to reasoning turn
                msg_type = "user.text.message"
                msg["content"] = user_text

            # ------------------------------------------------------------------
            # 3. TEXT MESSAGE & AGENT REASONING
            # ------------------------------------------------------------------
            if msg_type == "user.text.message":
                user_text = msg.get("content", "").strip()
                if not user_text:
                    continue

                async def run_agent_turn(text_to_process: str):
                    async with AsyncSessionLocal() as db:
                        try:
                            # Callback forwarding orchestrator events to WebSocket
                            async def event_cb(ev_type: str, payload: Dict[str, Any]):
                                await send_json(ev_type, payload)

                            agent_result = await orchestrator.process_user_turn(
                                db=db,
                                conversation_id=conversation_id,
                                user_message=text_to_process,
                                event_callback=event_cb,
                            )

                            final_text = agent_result.get("content", "")
                            # Synthesize TTS voice playback
                            if final_text:
                                await send_json("agent.state.changed", {"state": "speaking"})
                                audio_b64 = await tts_provider.synthesize_speech_base64(final_text)
                                if audio_b64:
                                    await send_json("agent.audio.chunk", {"data": audio_b64})
                                await send_json("agent.state.changed", {"state": "idle"})

                        except asyncio.CancelledError:
                            logger.info("Agent turn cancelled by user interrupt", session_id=session_id)
                            await send_json("agent.state.changed", {"state": "idle"})
                        except Exception as e:
                            logger.error("Agent execution error", error=str(e))
                            await send_json("agent.error", {"code": "AGENT_ERROR", "message": str(e)})
                            await send_json("agent.state.changed", {"state": "idle"})

                task = asyncio.create_task(run_agent_turn(user_text))
                conn_manager.set_task(session_id, task)

            # ------------------------------------------------------------------
            # 4. APPROVAL RESPONSE (Approve / Reject)
            # ------------------------------------------------------------------
            if msg_type == "user.approval.response":
                approval_id_str = msg.get("approval_id")
                decision = msg.get("decision", "rejected")

                if approval_id_str:
                    async def run_approval():
                        async with AsyncSessionLocal() as db:
                            try:
                                approval_id = uuid.UUID(approval_id_str)
                                stmt_app = select(Conversation).where(Conversation.id == conversation_id)
                                res_conv = await db.execute(stmt_app)
                                conv = res_conv.scalar_one_or_none()
                                
                                token = None
                                if conv:
                                    token = await GitHubService.get_project_github_token(db, conv.project_id)

                                exec_ctx = {
                                    "db": db,
                                    "github_token": token,
                                    "user_id": user_id,
                                }

                                res = await ApprovalManager.resolve_approval(
                                    db=db,
                                    approval_id=approval_id,
                                    user_id=user_id or uuid.uuid4(),
                                    decision=decision,
                                    execution_context=exec_ctx,
                                    )
                                await send_json("agent.approval.resolved", res)

                                if decision == "approved" and res.get("execution_result"):
                                    res_msg = f"Action successfully executed: {res.get('execution_result')}"
                                else:
                                    res_msg = f"Action was {decision}."

                                await send_json("agent.response.completed", {"text": res_msg})

                            except Exception as app_err:
                                logger.error("Approval resolution error", error=str(app_err))
                                await send_json("agent.error", {"code": "APPROVAL_ERROR", "message": str(app_err)})

                    task = asyncio.create_task(run_approval())
                    conn_manager.set_task(session_id, task)

    except WebSocketDisconnect:
        logger.info("WebSocket disconnected", session_id=session_id)
        conn_manager.cancel_task(session_id)
    except Exception as e:
        logger.error("WebSocket unhandled error", error=str(e))
        conn_manager.cancel_task(session_id)
