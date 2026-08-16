import asyncio
import uuid
from typing import Any, Dict
from arq.connections import RedisSettings
from app.core.config import settings
from app.core.database import AsyncSessionLocal
from app.core.logging import logger, setup_logging
from app.services.document_service import DocumentService


async def process_document_task(ctx: Dict[str, Any], document_id_str: str):
    """Background task to index a document asynchronously."""
    setup_logging()
    doc_id = uuid.UUID(document_id_str)
    logger.info("Starting background document indexing task", document_id=document_id_str)
    
    async with AsyncSessionLocal() as db:
        await DocumentService.index_document(db, doc_id)
        
    logger.info("Finished background document indexing task", document_id=document_id_str)


class WorkerSettings:
    """ARQ Worker configuration."""
    redis_settings = RedisSettings.from_dsn(settings.REDIS_URL)
    functions = [process_document_task]
    max_jobs = 10
    job_timeout = 300


if __name__ == "__main__":
    from arq import run_worker
    run_worker(WorkerSettings)
