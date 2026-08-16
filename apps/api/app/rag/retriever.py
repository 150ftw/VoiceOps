import uuid
from typing import Any, Dict, List
from sqlalchemy import select, text
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.config import settings
from app.core.logging import logger
from app.models.document import Document, DocumentChunk
from app.rag.embeddings import get_embedding_provider


class RAGRetriever:
    """Retrieves relevant documentation chunks using pgvector cosine distance search."""

    @staticmethod
    async def retrieve_context(
        db: AsyncSession,
        project_id: uuid.UUID,
        query: str,
        top_k: int = 5,
        threshold: float = 0.60,
    ) -> List[Dict[str, Any]]:
        """
        Query vector embeddings in PostgreSQL and return top matching chunks with citations.
        """
        if not query.strip():
            return []

        embedding_provider = get_embedding_provider()
        query_vector = await embedding_provider.embed_query(query)
        vector_str = "[" + ",".join(str(x) for x in query_vector) + "]"

        try:
            # Cosine similarity is 1 - cosine_distance (<=>)
            query_sql = text("""
                SELECT 
                    dc.id AS chunk_id,
                    dc.document_id AS document_id,
                    dc.chunk_index AS chunk_index,
                    dc.content AS content,
                    dc.metadata_json AS metadata,
                    d.title AS document_title,
                    d.filename AS filename,
                    (1 - (dc.embedding <=> CAST(:query_vec AS vector))) AS similarity
                FROM document_chunks dc
                JOIN documents d ON d.id = dc.document_id
                WHERE dc.project_id = :project_id
                ORDER BY similarity DESC
                LIMIT :top_k
            """)

            res = await db.execute(
                query_sql,
                {
                    "query_vec": vector_str,
                    "project_id": str(project_id),
                    "top_k": top_k,
                },
            )
            rows = res.mappings().all()

            results = []
            for row in rows:
                sim = float(row["similarity"])
                if sim >= threshold:
                    results.append({
                        "chunk_id": str(row["chunk_id"]),
                        "document_id": str(row["document_id"]),
                        "document_title": row["document_title"],
                        "filename": row["filename"],
                        "chunk_index": row["chunk_index"],
                        "content": row["content"],
                        "metadata": row["metadata"],
                        "similarity": round(sim, 4),
                    })

            return results

        except Exception as e:
            logger.error("Failed to execute RAG similarity search", error=str(e), project_id=str(project_id))
            return []
