import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db, get_project_with_access
from app.models.project import Project
from app.models.user import User
from app.schemas.document import DocumentResponse
from app.services.audit_service import AuditService
from app.services.document_service import DocumentService

router = APIRouter(prefix="/documents", tags=["Documents & RAG"])


@router.get("", response_model=List[DocumentResponse])
async def list_documents(
    project_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List all knowledge base documents for a given project."""
    await get_project_with_access(project_id, current_user, db)
    docs = await DocumentService.list_documents(db, project_id)
    results = []
    for d in docs:
        resp = DocumentResponse(
            id=d.id,
            project_id=d.project_id,
            title=d.title,
            filename=d.filename,
            file_type=d.file_type,
            file_size=d.file_size,
            status=d.status,
            error_message=d.error_message,
            chunks_count=len(d.chunks) if d.chunks else 0,
            created_at=d.created_at,
            updated_at=d.updated_at,
        )
        results.append(resp)
    return results


@router.post("/upload", response_model=DocumentResponse, status_code=status.HTTP_201_CREATED)
async def upload_document(
    project_id: uuid.UUID = Form(...),
    title: Optional[str] = Form(None),
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Upload a document (.md, .txt, .pdf) to the knowledge base and trigger indexing."""
    project = await get_project_with_access(project_id, current_user, db)
    doc, chunks_count = await DocumentService.upload_and_process_document(db, project_id, file, title)

    await AuditService.log_action(
        db=db,
        workspace_id=project.workspace_id,
        user_id=current_user.id,
        action="UPLOAD_DOCUMENT",
        resource_type="document",
        resource_id=str(doc.id),
        details={"title": doc.title, "filename": doc.filename, "file_size": doc.file_size},
    )

    return DocumentResponse(
        id=doc.id,
        project_id=doc.project_id,
        title=doc.title,
        filename=doc.filename,
        file_type=doc.file_type,
        file_size=doc.file_size,
        status=doc.status,
        error_message=doc.error_message,
        chunks_count=chunks_count,
        created_at=doc.created_at,
        updated_at=doc.updated_at,
    )


@router.delete("/{document_id}")
async def delete_document(
    document_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete a document and its embedding chunks."""
    from sqlalchemy import select
    from app.models.document import Document

    stmt = select(Document).where(Document.id == document_id)
    res = await db.execute(stmt)
    doc = res.scalar_one_or_none()
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")

    project = await get_project_with_access(doc.project_id, current_user, db)
    success = await DocumentService.delete_document(db, document_id)

    if success:
        await AuditService.log_action(
            db=db,
            workspace_id=project.workspace_id,
            user_id=current_user.id,
            action="DELETE_DOCUMENT",
            resource_type="document",
            resource_id=str(document_id),
            details={"title": doc.title},
        )
    return {"message": "Document deleted successfully"}
