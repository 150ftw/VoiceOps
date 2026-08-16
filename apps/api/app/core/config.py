import os
from typing import List, Optional, Union
from pydantic import AnyHttpUrl, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # Application
    APP_NAME: str = "VoiceOps"
    ENVIRONMENT: str = "development"
    DEBUG: bool = True
    LOG_LEVEL: str = "INFO"
    APP_URL: str = "http://localhost:3000"
    API_URL: str = "http://localhost:8000"

    # Security
    JWT_SECRET: str = "super-secret-jwt-key-change-this-in-production-min-32-chars"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    ENCRYPTION_KEY: str = "QZNoMijl7DfEoGT67yFY6OFxtouxMUB4rfoLNLZO5zk="
    APPROVAL_TOKEN_EXPIRE_MINUTES: int = 15

    # CORS
    CORS_ORIGINS: Union[str, List[str]] = "http://localhost:3000,http://127.0.0.1:3000"

    @field_validator("CORS_ORIGINS", mode="before")
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip() for i in v.split(",") if i.strip()]
        elif isinstance(v, (list, str)):
            return v
        raise ValueError(v)

    # Database (PostgreSQL / Supabase / SQLite)
    DATABASE_URL: str = "postgresql+asyncpg://voiceops:voiceops_secure_password@localhost:5432/voiceops_db"
    USE_SQLITE_FALLBACK: bool = False

    # Supabase Managed Database & Auth Configuration
    SUPABASE_URL: str = ""
    SUPABASE_ANON_KEY: str = ""
    SUPABASE_SERVICE_ROLE_KEY: str = ""
    SUPABASE_DB_PASSWORD: str = ""

    # Redis
    REDIS_URL: str = "redis://localhost:6379/0"

    # AI Providers
    DEFAULT_LLM_PROVIDER: str = "openai"
    OPENAI_API_KEY: str = ""
    OPENAI_MODEL: str = "gpt-4o"
    OPENAI_EMBEDDING_MODEL: str = "text-embedding-3-small"

    GEMINI_API_KEY: str = ""
    GEMINI_MODEL: str = "gemini-1.5-pro"

    ANTHROPIC_API_KEY: str = ""
    ANTHROPIC_MODEL: str = "claude-3-5-sonnet-20241022"

    # Voice (STT & TTS)
    STT_PROVIDER: str = "openai"
    DEEPGRAM_API_KEY: str = ""
    TTS_PROVIDER: str = "openai"
    ELEVENLABS_API_KEY: str = ""
    ELEVENLABS_VOICE_ID: str = "21m00Tcm4TlvDq8ikWAM"

    # GitHub OAuth & Integration
    GITHUB_CLIENT_ID: str = ""
    GITHUB_CLIENT_SECRET: str = ""
    GITHUB_REDIRECT_URI: str = "http://localhost:3000/callback/github"
    GITHUB_WEBHOOK_SECRET: str = ""

    # Document RAG
    DOCUMENT_UPLOAD_DIR: str = "./uploads"
    MAX_DOCUMENT_SIZE_MB: int = 25
    EMBEDDING_DIMENSION: int = 1536
    RAG_SIMILARITY_TOP_K: int = 5
    RAG_SIMILARITY_THRESHOLD: float = 0.70

    # Rate Limiting
    RATE_LIMIT_PER_MINUTE_AUTH: int = 10
    RATE_LIMIT_PER_MINUTE_AGENT: int = 30
    RATE_LIMIT_PER_MINUTE_VOICE: int = 60

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )


settings = Settings()
