import base64
import uuid
from typing import Any, Dict, List, Optional
from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.logging import logger
from app.github.client import GitHubClient
from app.models.document import Document, DocumentChunk
from app.rag.chunker import TextChunker
from app.rag.embeddings import get_embedding_provider


class RepoIngestionService:
    """
    Ingests and indexes an entire GitHub repository into Supabase pgvector.
    Allows VoiceOps AI to answer any question about the codebase, architecture,
    dependencies, APIs, schemas, configurations, and CI/CD pipelines.
    """

    KEY_FILE_PATTERNS = [
        "readme.md",
        "readme",
        "package.json",
        "requirements.txt",
        "pyproject.toml",
        "dockerfile",
        "docker-compose.yml",
        "docker-compose.yaml",
        ".env.example",
        "tsconfig.json",
        "cargo.toml",
        "go.mod",
        "gemfile",
        "pom.xml",
    ]

    KEY_EXTENSIONS = [
        ".md", ".txt", ".json", ".yaml", ".yml", ".py", ".ts", ".tsx",
        ".js", ".jsx", ".sql", ".rs", ".go", ".sh", ".env.example"
    ]

    @staticmethod
    async def ingest_repository(
        db: AsyncSession,
        project_id: uuid.UUID,
        repo_full_name: str,
        token: Optional[str] = None,
        default_branch: str = "main",
    ) -> Dict[str, Any]:
        """
        Scan repository files, parse code & documentation, compute embeddings,
        and persist into Supabase pgvector chunks for RAG queries.
        """
        if not repo_full_name:
            return {"success": False, "error": "No repository name provided"}

        logger.info("Starting repository ingestion", repo=repo_full_name, project_id=str(project_id))
        embedder = get_embedding_provider()
        chunker = TextChunker(chunk_size=700, chunk_overlap=100)

        ingested_files = []
        chunks_created = 0

        try:
            files_to_read: List[Dict[str, Any]] = []

            # 1. Fetch file tree from GitHub API if live token is available
            if token and token != "ghp_demo_mock_access_token_voiceops":
                owner, repo = repo_full_name.split("/", 1)
                client = GitHubClient(token=token)

                try:
                    tree_data = await client.get_tree(token, owner, repo, tree_sha=default_branch, recursive=True)
                    tree = tree_data.get("tree", [])

                    # Prioritize key files, manifests, docs, workflows, and source files
                    for item in tree:
                        if item.get("type") == "blob":
                            path = item.get("path", "")
                            lower_path = path.lower()
                            filename = lower_path.split("/")[-1]

                            is_key_file = any(filename == p or filename.startswith(p) for p in RepoIngestionService.KEY_FILE_PATTERNS)
                            is_workflow = ".github/workflows/" in lower_path
                            is_supported_code = any(lower_path.endswith(ext) for ext in RepoIngestionService.KEY_EXTENSIONS)

                            if is_key_file or is_workflow or (is_supported_code and len(files_to_read) < 25):
                                files_to_read.append({"path": path, "size": item.get("size", 0)})
                except Exception as tree_err:
                    logger.warning("Could not fetch recursive tree, falling back to key files", error=str(tree_err))
                    files_to_read = [
                        {"path": "README.md"},
                        {"path": "package.json"},
                        {"path": "Dockerfile"},
                        {"path": "requirements.txt"},
                        {"path": ".github/workflows/deploy.yml"},
                    ]
            else:
                # Sandbox Mock Mode Repository Structure
                files_to_read = [
                    {"path": "README.md", "mock_content": f"# {repo_full_name}\n\nFull-stack digital DevOps microservice application repository.\n\n## Architecture\n- Frontend: React / Next.js with Tailwind CSS\n- Backend: FastAPI (Python) asynchronous REST API\n- Database: PostgreSQL with Supabase pgvector\n- CI/CD: GitHub Actions automated Docker build & test pipelines."},
                    {"path": "Dockerfile", "mock_content": "FROM python:3.11-slim\nWORKDIR /app\nCOPY requirements.txt .\nRUN pip install --no-cache-dir -r requirements.txt\nCOPY . .\nCMD [\"uvicorn\", \"app.main:app\", \"--host\", \"0.0.0.0\", \"--port\", \"8000\"]"},
                    {"path": "requirements.txt", "mock_content": "fastapi==0.111.0\nuvicorn==0.30.1\nsqlalchemy==2.0.30\nasyncpg==0.29.0\npydantic==2.7.4\nbcrypt>=4.0.0\npytest==8.2.2"},
                    {"path": ".github/workflows/deploy.yml", "mock_content": "name: CI/CD Pipeline\non:\n  push:\n    branches: [main]\njobs:\n  build-and-test:\n    runs-on: ubuntu-latest\n    steps:\n      - uses: actions/checkout@v4\n      - name: Run Tests\n        run: pytest\n      - name: Build Docker Image\n        run: docker build -t app:latest ."},
                ]

            # 2. Read each file and store as Document in Supabase
            for file_info in files_to_read:
                path = file_info["path"]
                content = file_info.get("mock_content")

                if not content and token and token != "ghp_demo_mock_access_token_voiceops":
                    try:
                        owner, repo = repo_full_name.split("/", 1)
                        client = GitHubClient(token=token)
                        res = await client.get_file_content(token, owner, repo, path)
                        if res.get("encoding") == "base64" and res.get("content"):
                            content = base64.b64decode(res["content"]).decode("utf-8", errors="replace")
                    except Exception:
                        continue

                if not content:
                    continue

                # Remove existing document for this path if any
                existing_docs = (
                    await db.execute(
                        select(Document).where(
                            Document.project_id == project_id,
                            Document.filename == path,
                        )
                    )
                ).scalars().all()

                for ed in existing_docs:
                    await db.execute(delete(DocumentChunk).where(DocumentChunk.document_id == ed.id))
                    await db.delete(ed)

                doc = Document(
                    project_id=project_id,
                    title=f"{path} ({repo_full_name})",
                    filename=path,
                    file_type=path.rsplit(".", 1)[-1] if "." in path else "txt",
                    file_size=len(content.encode("utf-8")),
                    storage_path=f"github://{repo_full_name}/{path}",
                    status="indexed",
                )
                db.add(doc)
                await db.flush()

                # Chunk and compute embeddings
                sections = [{"heading": path, "content": content}]
                chunk_dicts = chunker.chunk_sections(sections, doc.title)

                if chunk_dicts:
                    texts_to_embed = [c["content"] for c in chunk_dicts]
                    embeddings = await embedder.embed_texts(texts_to_embed)

                    for c_dict, emb in zip(chunk_dicts, embeddings):
                        db_chunk = DocumentChunk(
                            document_id=doc.id,
                            project_id=project_id,
                            chunk_index=c_dict["chunk_index"],
                            content=c_dict["content"],
                            metadata_json={
                                "repo": repo_full_name,
                                "path": path,
                                "title": doc.title,
                                "section": c_dict.get("heading") or path,
                            },
                            embedding=emb,
                        )
                        db.add(db_chunk)
                        chunks_created += 1

                ingested_files.append(path)

            await db.commit()
            logger.info("Repository ingestion completed", repo=repo_full_name, files=len(ingested_files), chunks=chunks_created)

            return {
                "success": True,
                "repo": repo_full_name,
                "files_indexed": len(ingested_files),
                "chunks_created": chunks_created,
                "file_list": ingested_files,
            }

        except Exception as e:
            logger.error("Repository ingestion error", error=str(e), repo=repo_full_name)
            return {"success": False, "error": str(e)}
