from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api.v1.approvals import router as approvals_router
from app.api.v1.auth import router as auth_router
from app.api.v1.conversations import router as conversations_router
from app.api.v1.documents import router as documents_router
from app.api.v1.integrations import router as integrations_router
from app.api.v1.observability import router as observability_router
from app.api.v1.projects import router as projects_router
from app.api.v1.websocket import router as websocket_router
from app.api.v1.workspaces import router as workspaces_router
from app.core.config import settings
from app.core.logging import logger, setup_logging
from app.core.database import init_db_schema
from app.core.redis import close_redis_pool, get_redis_pool


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    setup_logging()
    logger.info("Starting VoiceOps API server", environment=settings.ENVIRONMENT)
    try:
        await init_db_schema()
    except Exception as e:
        logger.warning("Database schema initialization skipped", error=str(e))

    try:
        await get_redis_pool()
    except Exception as e:
        logger.warning("Redis initial connection warning", error=str(e))
    yield
    # Shutdown
    logger.info("Shutting down VoiceOps API server")
    await close_redis_pool()


app = FastAPI(
    title=settings.APP_NAME,
    description="Voice-First Agentic DevOps Engineering Platform API",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs" if settings.DEBUG else None,
    redoc_url="/redoc" if settings.DEBUG else None,
)

# Configure CORS
origins = settings.CORS_ORIGINS if isinstance(settings.CORS_ORIGINS, list) else [settings.CORS_ORIGINS]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error("Unhandled server exception", path=request.url.path, error=str(exc))
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"success": False, "error": {"code": "INTERNAL_SERVER_ERROR", "message": "An unexpected error occurred."}},
    )


# Mount API v1 Routers
api_v1_prefix = "/api/v1"
app.include_router(auth_router, prefix=api_v1_prefix)
app.include_router(workspaces_router, prefix=api_v1_prefix)
app.include_router(projects_router, prefix=api_v1_prefix)
app.include_router(integrations_router, prefix=api_v1_prefix)
app.include_router(conversations_router, prefix=api_v1_prefix)
app.include_router(documents_router, prefix=api_v1_prefix)
app.include_router(approvals_router, prefix=api_v1_prefix)
app.include_router(observability_router, prefix=api_v1_prefix)
app.include_router(websocket_router)


@app.get("/")
@app.get("/api")
@app.get("/health")
async def root_health():
    return {
        "status": "ok",
        "app": settings.APP_NAME,
        "version": "1.0.0",
        "message": "VoiceOps API Engine Running"
    }
