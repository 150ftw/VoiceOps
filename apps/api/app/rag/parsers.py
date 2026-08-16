import io
import re
from typing import Any, Dict, List, Optional
import pypdf
from app.core.logging import logger


class DocumentParser:
    """Extracts clean text and structural sections from various document formats."""

    @staticmethod
    def parse_markdown(content: str) -> List[Dict[str, Any]]:
        """
        Parse markdown into structured sections by heading hierarchy.
        """
        lines = content.splitlines()
        sections = []
        current_heading = "Overview"
        current_lines = []
        start_line = 1

        heading_pattern = re.compile(r"^(#{1,6})\s+(.+)$")

        for idx, line in enumerate(lines, start=1):
            match = heading_pattern.match(line)
            if match:
                if current_lines:
                    sections.append({
                        "heading": current_heading,
                        "content": "\n".join(current_lines).strip(),
                        "start_line": start_line,
                        "end_line": idx - 1,
                    })
                    current_lines = []
                current_heading = match.group(2).strip()
                start_line = idx
            current_lines.append(line)

        if current_lines:
            sections.append({
                "heading": current_heading,
                "content": "\n".join(current_lines).strip(),
                "start_line": start_line,
                "end_line": len(lines),
            })

        return sections

    @staticmethod
    def parse_plain_text(content: str) -> List[Dict[str, Any]]:
        """Parse plain text into paragraph blocks."""
        paragraphs = re.split(r"\n\s*\n", content)
        sections = []
        line_counter = 1
        for idx, p in enumerate(paragraphs, start=1):
            text = p.strip()
            if text:
                num_lines = text.count("\n") + 1
                sections.append({
                    "heading": f"Section {idx}",
                    "content": text,
                    "start_line": line_counter,
                    "end_line": line_counter + num_lines - 1,
                })
                line_counter += num_lines + 1
        return sections

    @staticmethod
    def parse_pdf(file_bytes: bytes) -> List[Dict[str, Any]]:
        """Extract text from PDF pages."""
        sections = []
        try:
            reader = pypdf.PdfReader(io.BytesIO(file_bytes))
            for page_num, page in enumerate(reader.pages, start=1):
                text = page.extract_text() or ""
                if text.strip():
                    sections.append({
                        "heading": f"Page {page_num}",
                        "content": text.strip(),
                        "start_line": page_num,
                        "end_line": page_num,
                    })
        except Exception as e:
            logger.error("PDF parsing error", error=str(e))
            raise ValueError(f"Failed to read PDF document: {str(e)}")
        return sections
