from typing import Any, Dict, List


class TextChunker:
    """Chunks structured document sections with sliding window overlap and metadata."""

    def __init__(self, chunk_size: int = 600, chunk_overlap: int = 100):
        self.chunk_size = chunk_size
        self.chunk_overlap = chunk_overlap

    def chunk_sections(
        self, sections: List[Dict[str, Any]], document_title: str
    ) -> List[Dict[str, Any]]:
        """
        Takes structured sections (with headings and line ranges) and creates
        clean, contextualized chunks.
        """
        chunks = []
        chunk_idx = 0

        for sec in sections:
            heading = sec.get("heading", "General")
            text = sec.get("content", "").strip()
            start_line = sec.get("start_line", 1)
            end_line = sec.get("end_line", 1)

            if not text:
                continue

            # Context prefix added to help vector retrieval maintain semantic context
            context_prefix = f"Document: {document_title}\nSection: {heading}\n\n"

            if len(text) <= self.chunk_size:
                chunks.append({
                    "chunk_index": chunk_idx,
                    "content": f"{context_prefix}{text}",
                    "raw_text": text,
                    "metadata": {
                        "heading": heading,
                        "start_line": start_line,
                        "end_line": end_line,
                        "document_title": document_title,
                    },
                })
                chunk_idx += 1
            else:
                # Sliding window chunking
                words = text.split()
                step = max(1, self.chunk_size // 6 - self.chunk_overlap // 6)
                word_chunk_size = self.chunk_size // 6

                for i in range(0, len(words), step):
                    chunk_words = words[i : i + word_chunk_size]
                    if not chunk_words:
                        break
                    chunk_str = " ".join(chunk_words)
                    chunks.append({
                        "chunk_index": chunk_idx,
                        "content": f"{context_prefix}{chunk_str}",
                        "raw_text": chunk_str,
                        "metadata": {
                            "heading": heading,
                            "start_line": start_line,
                            "end_line": end_line,
                            "document_title": document_title,
                            "sub_chunk": True,
                        },
                    })
                    chunk_idx += 1
                    if i + word_chunk_size >= len(words):
                        break

        return chunks
