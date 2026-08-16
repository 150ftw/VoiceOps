from abc import ABC, abstractmethod
import hashlib
import math
from typing import List
import numpy as np
from app.core.config import settings
from app.core.logging import logger


class BaseEmbeddingProvider(ABC):
    @abstractmethod
    async def embed_texts(self, texts: List[str]) -> List[List[float]]:
        """Generate embedding vectors for a batch of texts."""
        pass

    @abstractmethod
    async def embed_query(self, query: str) -> List[float]:
        """Generate embedding vector for a single query."""
        pass


class OpenAIEmbeddingProvider(BaseEmbeddingProvider):
    def __init__(self, api_key: str, model: str = "text-embedding-3-small"):
        from openai import AsyncOpenAI
        self.client = AsyncOpenAI(api_key=api_key)
        self.model = model

    async def embed_texts(self, texts: List[str]) -> List[List[float]]:
        if not texts:
            return []
        try:
            # Batch size limit for OpenAI is typically 2048 items
            response = await self.client.embeddings.create(
                input=texts,
                model=self.model,
            )
            return [data.embedding for data in response.data]
        except Exception as e:
            logger.error("OpenAI embedding generation failed", error=str(e))
            raise

    async def embed_query(self, query: str) -> List[float]:
        res = await self.embed_texts([query])
        return res[0]


class DeterministicFallbackEmbeddingProvider(BaseEmbeddingProvider):
    """
    Fallback deterministic embedding provider for testing and offline environments.
    Generates 1536-dimensional normalized vectors from SHA-256 tokens.
    """

    def __init__(self, dimension: int = 1536):
        self.dimension = dimension

    def _generate_vector(self, text: str) -> List[float]:
        # Hash text words into float dimensions
        vec = np.zeros(self.dimension, dtype=np.float32)
        words = text.lower().split()
        if not words:
            vec[0] = 1.0
            return vec.tolist()

        for w in words:
            h = int(hashlib.md5(w.encode()).hexdigest(), 16)
            idx = h % self.dimension
            val = ((h >> 8) % 1000) / 1000.0 - 0.5
            vec[idx] += val

        norm = np.linalg.norm(vec)
        if norm > 0:
            vec = vec / norm
        else:
            vec[0] = 1.0

        return vec.tolist()

    async def embed_texts(self, texts: List[str]) -> List[List[float]]:
        return [self._generate_vector(t) for t in texts]

    async def embed_query(self, query: str) -> List[float]:
        return self._generate_vector(query)


def get_embedding_provider() -> BaseEmbeddingProvider:
    """Factory creating the appropriate embedding provider based on configuration."""
    if settings.OPENAI_API_KEY:
        return OpenAIEmbeddingProvider(
            api_key=settings.OPENAI_API_KEY,
            model=settings.OPENAI_EMBEDDING_MODEL,
        )
    logger.warning("No OPENAI_API_KEY found, using DeterministicFallbackEmbeddingProvider")
    return DeterministicFallbackEmbeddingProvider(dimension=settings.EMBEDDING_DIMENSION)
