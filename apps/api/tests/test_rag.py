import pytest
from app.rag.chunker import TextChunker
from app.rag.embeddings import DeterministicFallbackEmbeddingProvider
from app.rag.parsers import DocumentParser


def test_markdown_parser():
    md = """# Deployment Guide
Overview of deployments.

## Prerequisites
- Docker
- Python 3.11

## Troubleshooting
Check database connection string.
"""
    sections = DocumentParser.parse_markdown(md)
    assert len(sections) == 3
    assert sections[0]["heading"] == "Deployment Guide"
    assert sections[1]["heading"] == "Prerequisites"
    assert sections[2]["heading"] == "Troubleshooting"


def test_text_chunker():
    sections = [
        {
            "heading": "Database Setup",
            "content": "Make sure DATABASE_URL is set in environment variables.",
            "start_line": 1,
            "end_line": 2,
        }
    ]
    chunker = TextChunker(chunk_size=500, chunk_overlap=50)
    chunks = chunker.chunk_sections(sections, document_title="Deploy Runbook")

    assert len(chunks) == 1
    assert "Document: Deploy Runbook" in chunks[0]["content"]
    assert "Section: Database Setup" in chunks[0]["content"]
    assert chunks[0]["metadata"]["heading"] == "Database Setup"


@pytest.mark.asyncio
async def test_deterministic_embeddings():
    provider = DeterministicFallbackEmbeddingProvider(dimension=1536)
    vec1 = await provider.embed_query("deployment failed")
    vec2 = await provider.embed_query("deployment failed")
    vec3 = await provider.embed_query("unrelated topic")

    assert len(vec1) == 1536
    assert vec1 == vec2  # Deterministic
    assert vec1 != vec3
