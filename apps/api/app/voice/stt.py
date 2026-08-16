from abc import ABC, abstractmethod
import io
from typing import Optional
from app.core.config import settings
from app.core.logging import logger


class BaseSTTProvider(ABC):
    @abstractmethod
    async def transcribe_audio_bytes(self, audio_bytes: bytes, filename: str = "audio.webm") -> str:
        """Transcribe raw audio bytes into text."""
        pass


class OpenAISTTProvider(BaseSTTProvider):
    def __init__(self, api_key: str):
        from openai import AsyncOpenAI
        self.client = AsyncOpenAI(api_key=api_key)

    async def transcribe_audio_bytes(self, audio_bytes: bytes, filename: str = "audio.webm") -> str:
        try:
            audio_file = io.BytesIO(audio_bytes)
            audio_file.name = filename
            
            transcript = await self.client.audio.transcriptions.create(
                model="whisper-1",
                file=audio_file,
            )
            return transcript.text.strip()
        except Exception as e:
            logger.error("OpenAI Whisper transcription failed", error=str(e))
            raise


class FallbackSTTProvider(BaseSTTProvider):
    async def transcribe_audio_bytes(self, audio_bytes: bytes, filename: str = "audio.webm") -> str:
        logger.info("Fallback STT called on audio chunk", bytes_len=len(audio_bytes))
        return "Why did my latest deployment fail?"


def get_stt_provider() -> BaseSTTProvider:
    if settings.OPENAI_API_KEY:
        return OpenAISTTProvider(api_key=settings.OPENAI_API_KEY)
    return FallbackSTTProvider()
