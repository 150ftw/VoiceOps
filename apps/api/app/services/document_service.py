import os
import uuid
from typing import List, Optional
from fastapi import HTTPException, UploadFile, status
from sqlalchemy import delete, func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.config import settings
from app.core.logging import logger
from app.models.document import Document, DocumentChunk
from app.rag.chunker import TextChunker
from app.rag.embeddings import get_embedding_provider
from app.rag.parsers import DocumentParser


class DocumentService:
    @staticmethod
    async def list_documents(
        db: AsyncSession, project_id: uuid.UUID
    ) -> List[Document]:
        """List all documents for a project along with their chunk counts."""
        stmt = (
            select(Document)
            .options(selectinload(Document.chunks))
            .where(Document.project_id == project_id)
            .order_by(Document.created_at.desc())
        )
        res = await db.execute(stmt)
        return res.scalars().all()

    @staticmethod
    async def upload_and_process_document(
        db: AsyncSession,
        project_id: uuid.UUID,
        file: UploadFile,
        title: Optional[str] = None,
    ) -> Document:
        """Upload file, persist locally, parse, generate embeddings, and store in pgvector."""
        filename = file.filename or "uploaded_document.txt"
        ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else "txt"

        if ext not in ["md", "markdown", "txt", "pdf"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Unsupported file format '.{ext}'. Supported: .md, .txt, .pdf",
            )

        content_bytes = await file.read()
        file_size = len(content_bytes)

        if file_size > settings.MAX_DOCUMENT_SIZE_MB * 1024 * 1024:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"File exceeds maximum allowed size of {settings.MAX_DOCUMENT_SIZE_MB}MB",
            )

        os.makedirs(settings.DOCUMENT_UPLOAD_DIR, exist_ok=True)
        storage_filename = f"{uuid.uuid4()}_{filename}"
        storage_path = os.path.join(settings.DOCUMENT_UPLOAD_DIR, storage_filename)

        with open(storage_path, "wb") as f:
            f.write(content_bytes)

        doc_title = title.strip() if title else filename

        document = Document(
            project_id=project_id,
            title=doc_title,
            filename=filename,
            file_type=ext if ext != "markdown" else "md",
            file_size=file_size,
            storage_path=storage_path,
            status="processing",
        )
        db.add(document)
        await db.commit()
        await db.refresh(document)

        # Process document indexing
        chunk_count = await DocumentService.index_document(db, document.id, content_bytes)
        await db.refresh(document)
        return document, chunk_count

    @staticmethod
    async def index_document(db: AsyncSession, document_id: uuid.UUID, content_bytes: Optional[bytes] = None):
        """Parse text, generate chunks, compute embeddings, and insert DocumentChunks."""
        stmt = select(Document).where(Document.id == document_id)
        res = await db.execute(stmt)
        doc = res.scalar_one_or_none()
        if not doc:
            return

        try:
            if not content_bytes:
                if os.path.exists(doc.storage_path):
                    with open(doc.storage_path, "rb") as f:
                        content_bytes = f.read()
                else:
                    raise FileNotFoundError(f"Storage file not found: {doc.storage_path}")

            # Parse according to format
            if doc.file_type in ["md", "markdown"]:
                text_content = content_bytes.decode("utf-8", errors="replace")
                sections = DocumentParser.parse_markdown(text_content)
            elif doc.file_type == "pdf":
                sections = DocumentParser.parse_pdf(content_bytes)
            else:
                text_content = content_bytes.decode("utf-8", errors="replace")
                sections = DocumentParser.parse_plain_text(text_content)

            # Chunk sections
            chunker = TextChunker(chunk_size=700, chunk_overlap=100)
            chunks_data = chunker.chunk_sections(sections, doc.title)

            if not chunks_data:
                doc.status = "indexed"
                await db.commit()
                return

            # Generate embeddings
            embedding_provider = get_embedding_provider()
            texts_to_embed = [c["content"] for c in chunks_data]
            embeddings = await embedding_provider.embed_texts(texts_to_embed)

            # Clear existing chunks if re-indexing
            await db.execute(delete(DocumentChunk).where(DocumentChunk.document_id == doc.id))

            for chunk_dict, emb in zip(chunks_data, embeddings):
                db_chunk = DocumentChunk(
                    document_id=doc.id,
                    project_id=doc.project_id,
                    chunk_index=chunk_dict["chunk_index"],
                    content=chunk_dict["content"],
                    metadata_json=chunk_dict["metadata"],
                    embedding=emb,
                )
                db.add(db_chunk)

            doc.status = "indexed"
            doc.error_message = None
            await db.commit()
            logger.info("Document indexed successfully", doc_id=str(doc.id), chunks=len(chunks_data))
            return len(chunks_data)

        except Exception as e:
            logger.error("Failed to index document", error=str(e), doc_id=str(doc.id))
            doc.status = "failed"
            doc.error_message = str(e)
            await db.commit()
            return 0

    @staticmethod
    async def delete_document(db: AsyncSession, document_id: uuid.UUID) -> bool:
        """Delete a document and its stored file and vector chunks."""
        stmt = select(Document).where(Document.id == document_id)
        res = await db.execute(stmt)
        doc = res.scalar_one_or_none()
        if not doc:
            return False

        if os.path.exists(doc.storage_path):
            try:
                os.remove(doc.storage_path)
            except Exception as e:
                logger.warning("Could not delete physical file", path=doc.storage_path, error=str(e))

        await db.delete(doc)
        await db.commit()
        return True
