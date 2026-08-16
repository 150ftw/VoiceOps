import re
from typing import Dict, List, Optional


class LogParser:
    """Parses and compresses CI/CD logs to extract actionable failure diagnostics."""

    ANSI_ESCAPE = re.compile(r"\x1B(?:[@-Z\\-_]|\[[0-?]*[ -/]*[@-~])")
    TIMESTAMP_PREFIX = re.compile(r"^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z?\s*")

    ERROR_PATTERNS = [
        re.compile(r"(error|fatal|fail|exception|traceback|panic|failed with exit code)", re.IGNORECASE),
        re.compile(r"(cannot find module|undefined reference|syntaxerror|typeerror|attributeerror|importerror)", re.IGNORECASE),
        re.compile(r"(pip._vendor|npm ERR!|yarn error|cargo:warning|gradle.*FAILED)", re.IGNORECASE),
        re.compile(r"(docker: Error response from daemon|build failed|process completed with exit code \d+)", re.IGNORECASE),
    ]

    @classmethod
    def clean_log_line(cls, line: str) -> str:
        """Strip ANSI escape sequences and ISO timestamps."""
        line = cls.ANSI_ESCAPE.sub("", line)
        line = cls.TIMESTAMP_PREFIX.sub("", line)
        return line.strip()

    @classmethod
    def extract_failure_summary(cls, raw_logs: str, max_lines: int = 150) -> Dict[str, any]:
        """
        Analyze raw log text, find error sections, extract contextual windows around errors,
        and provide a concise diagnostic summary.
        """
        if not raw_logs:
            return {"error_lines": [], "summary": "No logs available", "total_lines": 0}

        raw_lines = raw_logs.splitlines()
        total_lines = len(raw_lines)
        cleaned_lines = [cls.clean_log_line(line) for line in raw_lines]

        error_indices = []
        for idx, line in enumerate(cleaned_lines):
            for pattern in cls.ERROR_PATTERNS:
                if pattern.search(line):
                    error_indices.append(idx)
                    break

        if not error_indices:
            # Fallback: return tail of the log
            tail = cleaned_lines[-max_lines:] if len(cleaned_lines) > max_lines else cleaned_lines
            return {
                "error_lines": tail,
                "summary": f"No explicit error pattern found. Returning last {len(tail)} lines.",
                "total_lines": total_lines,
            }

        # Collect window around error lines (e.g. 5 lines before, 10 lines after)
        selected_indices = set()
        for err_idx in error_indices:
            start = max(0, err_idx - 5)
            end = min(total_lines, err_idx + 10)
            for i in range(start, end):
                selected_indices.add(i)

        sorted_indices = sorted(list(selected_indices))
        # Keep within max_lines
        if len(sorted_indices) > max_lines:
            sorted_indices = sorted_indices[-max_lines:]

        extracted_lines = []
        last_idx = -1
        for idx in sorted_indices:
            if last_idx != -1 and idx > last_idx + 1:
                extracted_lines.append("... [truncated lines] ...")
            extracted_lines.append(cleaned_lines[idx])
            last_idx = idx

        return {
            "error_lines": extracted_lines,
            "error_count": len(error_indices),
            "summary": f"Found {len(error_indices)} error occurrences in {total_lines} total lines.",
            "total_lines": total_lines,
        }
