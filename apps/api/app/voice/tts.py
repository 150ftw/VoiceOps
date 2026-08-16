from abc import ABC, abstractmethod
import base64
from typing import AsyncIterator, Optional
from app.core.config import settings
from app.core.logging import logger


class BaseTTSProvider(ABC):
    @abstractmethod
    async def synthesize_speech_base64(self, text: str) -> Optional[str]:
        """Synthesize text into base64-encoded audio bytes (MP3/PCM)."""
        pass


class OpenAITTSProvider(BaseTTSProvider):
    def __init__(self, api_key: str):
        from openai import AsyncOpenAI
        self.client = AsyncOpenAI(api_key=api_key)

    async def synthesize_speech_base64(self, text: str) -> Optional[str]:
        try:
            # Clean markdown formatting for smoother spoken voice
            clean_text = text.replace("**", "").replace("`", "").replace("##", "").strip()
            if not clean_text:
                return None

            response = await self.client.audio.speech.create(
                model="tts-1",
                voice="alloy",
                input=clean_text[:1000],  # Bound length for fast voice response
            )
            audio_bytes = response.content
            return base64.b64encode(audio_bytes).decode("utf-8")
        except Exception as e:
            logger.error("OpenAI TTS speech synthesis failed", error=str(e))
            return None


class ElevenLabsTTSProvider(BaseTTSProvider):
    def __init__(self, api_key: str, voice_id: str):
        self.api_key = api_key
        self.voice_id = voice_id

    async def synthesize_speech_base64(self, text: str) -> Optional[str]:
        import httpx
        url = f"https://api.elevenlabs.io/v1/text-to-speech/{self.voice_id}"
        headers = {
            "xi-api-key": self.api_key,
            "Content-Type": "application/json",
            "Accept": "audio/mpeg",
        }
        data = {
            "text": text[:1000],
            "model_id": "eleven_monolingual_v1",
            "voice_settings": {"stability": 0.5, "similarity_boost": 0.75},
        }
        try:
            async with httpx.AsyncClient(timeout=15.0) as client:
                resp = await client.post(url, headers=headers, json=data)
                if resp.status_code == 200:
                    return base64.b64encode(resp.content).decode("utf-8")
                logger.error("ElevenLabs error", status=resp.status_code, body=resp.text)
                return None
        except Exception as e:
            logger.error("ElevenLabs request failed", error=str(e))
            return None


class FallbackTTSProvider(BaseTTSProvider):
    async def synthesize_speech_base64(self, text: str) -> Optional[str]:
        # Client will use browser SpeechSynthesis API
        return None


def get_tts_provider() -> BaseTTSProvider:
    if settings.ELEVENLABS_API_KEY:
        return ElevenLabsTTSProvider(
            api_key=settings.ELEVENLABS_API_KEY,
            voice_id=settings.ELEVENLABS_VOICE_ID,
        )
    if settings.OPENAI_API_KEY:
        return OpenAITTSProvider(api_key=settings.OPENAI_API_KEY)
    return FallbackTTSProvider()
