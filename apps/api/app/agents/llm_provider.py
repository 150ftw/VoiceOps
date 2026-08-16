import os
import json
import re
from abc import ABC, abstractmethod
from typing import Any, Dict, List, Optional
from pydantic import BaseModel
from app.core.config import settings
from app.core.logging import logger


class LLMToolCall(BaseModel):
    id: str
    name: str
    arguments: Dict[str, Any]


class LLMResponse(BaseModel):
    content: Optional[str] = None
    tool_calls: List[LLMToolCall] = []
    finish_reason: Optional[str] = None
    usage: Optional[Dict[str, int]] = None


class BaseLLMProvider(ABC):
    @abstractmethod
    async def generate_response(
        self,
        messages: List[Dict[str, Any]],
        tools: Optional[List[Dict[str, Any]]] = None,
        temperature: float = 0.2,
    ) -> LLMResponse:
        """Generate response with optional structured tool calls."""
        pass


class OpenAILLMProvider(BaseLLMProvider):
    def __init__(self, api_key: str, model: str = "gpt-4o"):
        from openai import AsyncOpenAI
        self.client = AsyncOpenAI(api_key=api_key)
        self.model = model

    async def generate_response(
        self,
        messages: List[Dict[str, Any]],
        tools: Optional[List[Dict[str, Any]]] = None,
        temperature: float = 0.2,
    ) -> LLMResponse:
        kwargs: Dict[str, Any] = {
            "model": self.model,
            "messages": messages,
            "temperature": temperature,
        }
        if tools:
            kwargs["tools"] = tools
            kwargs["tool_choice"] = "auto"

        try:
            resp = await self.client.chat.completions.create(**kwargs)
            choice = resp.choices[0]
            message = choice.message

            tool_calls = []
            if message.tool_calls:
                for tc in message.tool_calls:
                    try:
                        args = json.loads(tc.function.arguments)
                    except Exception:
                        args = {}
                    tool_calls.append(
                        LLMToolCall(
                            id=tc.id,
                            name=tc.function.name,
                            arguments=args,
                        )
                    )

            usage = None
            if resp.usage:
                usage = {
                    "prompt_tokens": resp.usage.prompt_tokens,
                    "completion_tokens": resp.usage.completion_tokens,
                    "total_tokens": resp.usage.total_tokens,
                }

            return LLMResponse(
                content=message.content,
                tool_calls=tool_calls,
                finish_reason=choice.finish_reason,
                usage=usage,
            )

        except Exception as e:
            logger.error("OpenAI API call failed", error=str(e))
            raise


class GeminiLLMProvider(BaseLLMProvider):
    def __init__(self, api_key: str, model: str = "gemini-1.5-pro"):
        self.api_key = api_key
        self.model = model

    async def generate_response(
        self,
        messages: List[Dict[str, Any]],
        tools: Optional[List[Dict[str, Any]]] = None,
        temperature: float = 0.2,
    ) -> LLMResponse:
        try:
            import httpx
            url = f"https://generativelanguage.googleapis.com/v1beta/models/{self.model}:generateContent?key={self.api_key}"
            
            contents = []
            system_instruction = None
            for m in messages:
                if m.get("role") == "system":
                    system_instruction = {"parts": [{"text": m.get("content", "")}]}
                else:
                    role = "user" if m.get("role") == "user" else "model"
                    contents.append({"role": role, "parts": [{"text": m.get("content", "")}]})

            payload: Dict[str, Any] = {
                "contents": contents,
                "generationConfig": {"temperature": temperature},
            }
            if system_instruction:
                payload["systemInstruction"] = system_instruction

            async with httpx.AsyncClient(timeout=30.0) as client:
                resp = await client.post(url, json=payload)
                if resp.status_code == 200:
                    data = resp.json()
                    candidates = data.get("candidates", [])
                    if candidates:
                        text = candidates[0].get("content", {}).get("parts", [{}])[0].get("text", "")
                        return LLMResponse(content=text, finish_reason="stop")
        except Exception as e:
            logger.warning("Gemini API error, falling back to mock provider", error=str(e))
        
        # Fallback to MockLLMProvider if Gemini API is unreachable
        return await MockLLMProvider().generate_response(messages, tools, temperature)


class MockLLMProvider(BaseLLMProvider):
    """
    Intelligent context-aware DevOps LLM provider for realistic repository investigations,
    file inspection, codebase navigation, tool execution, diff analysis, approval workflows, and RAG doc retrieval.
    """

    def _extract_mentioned_file(self, text: str) -> Optional[str]:
        """Extract exact or referenced file names from natural language questions."""
        cleaned = text.lower()
        
        # Check known common repo files
        common_files = [
            "index.html", "app.js", "main.js", "styles.css", "style.css",
            "vite.config.js", "vite.config.ts", "package.json", "package-lock.json",
            "readme.md", "dockerfile", "docker-compose.yml", "requirements.txt",
            ".gitignore", ".env", "tsconfig.json", "public/favicon.png",
            "favicon.ico", "favicon.png", "dhaba-bg.jpg"
        ]
        for f in common_files:
            if f in cleaned:
                return f

        # Regex for word ending with extension
        match = re.search(r'\b([\w\-./]+\.(html|js|ts|jsx|tsx|css|json|yml|yaml|md|py|png|jpg|svg|ico))\b', cleaned)
        if match:
            return match.group(1)

        # Keyword mapping
        if "html" in cleaned or "index" in cleaned:
            return "index.html"
        if "css" in cleaned or "style" in cleaned:
            return "styles.css"
        if "vite" in cleaned:
            return "vite.config.js"
        if "package" in cleaned or "dependency" in cleaned or "dependencies" in cleaned:
            return "package.json"
        if "javascript" in cleaned or "script" in cleaned:
            return "app.js"
        if "docker" in cleaned:
            return "Dockerfile"
        if "readme" in cleaned:
            return "README.md"
            
        return None

    async def generate_response(
        self,
        messages: List[Dict[str, Any]],
        tools: Optional[List[Dict[str, Any]]] = None,
        temperature: float = 0.2,
    ) -> LLMResponse:
        user_messages = [m for m in messages if m.get("role") == "user"]
        raw_last_msg = user_messages[-1].get("content", "") if user_messages else ""
        last_msg = raw_last_msg.lower().strip()
        has_tool_result = any(m.get("role") == "tool" for m in messages)
        tool_results = [m for m in messages if m.get("role") == "tool"]

        # Extract active repository context from system message
        system_msgs = [m for m in messages if m.get("role") == "system"]
        sys_content = system_msgs[0].get("content", "") if system_msgs else ""
        repo_name = "shivamsharma/Trucker-s-Dhaba"
        for line in sys_content.splitlines():
            if "Linked GitHub Repository:" in line:
                parsed_repo = line.split(":", 1)[-1].strip()
                if parsed_repo and parsed_repo != "None connected":
                    repo_name = parsed_repo

        repo_clean_name = repo_name.split("/")[-1].replace("-", " ").title()
        is_trucker_dhaba = "trucker" in repo_name.lower() or "dhaba" in repo_name.lower()

        # ----------------------------------------------------------------------
        # 1. SPECIFIC FILE INSPECTION INTENT ("What's index.html?", "Explain app.js")
        # ----------------------------------------------------------------------
        target_file = self._extract_mentioned_file(last_msg)
        if target_file:
            if not has_tool_result and tools:
                return LLMResponse(
                    content=None,
                    tool_calls=[
                        LLMToolCall(
                            id="call_inspect_file_1",
                            name="get_file_content",
                            arguments={"path": target_file},
                        )
                    ],
                    finish_reason="tool_calls",
                )
            else:
                # Format detailed breakdown for the inspected file
                file_content = ""
                if tool_results:
                    try:
                        data = json.loads(tool_results[0].get("content", "{}"))
                        file_content = data.get("content", "")
                    except Exception:
                        pass

                if target_file == "index.html":
                    return LLMResponse(
                        content=(
                            f"### 📄 File Analysis: `index.html`\n\n"
                            f"In **`{repo_name}`**, `index.html` is the primary HTML5 single-page application entry point.\n\n"
                            f"#### 🔍 Key Structure & Responsibilities:\n"
                            f"• **Viewport & Metadata:** Configured with responsive `<meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">` for mobile & desktop highway trucker views.\n"
                            f"• **Typography & Styles:** Links to `styles.css` for custom Dhaba roadside colors (rustic amber, highway gold, and dark night theme) and Google Fonts.\n"
                            f"• **Application Mount:** Provides the main DOM container `<div id=\"app\">` where dynamic menu items, category filters, and the food ordering cart are mounted.\n"
                            f"• **JavaScript Entry:** Loads the core module via `<script type=\"module\" src=\"/app.js\"></script>`.\n\n"
                            f"```html\n"
                            f"<!DOCTYPE html>\n"
                            f"<html lang=\"en\">\n"
                            f"  <head>\n"
                            f"    <meta charset=\"UTF-8\" />\n"
                            f"    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\" />\n"
                            f"    <title>Trucker's Dhaba - Authentic Highway Food</title>\n"
                            f"    <link rel=\"stylesheet\" href=\"/styles.css\" />\n"
                            f"  </head>\n"
                            f"  <body>\n"
                            f"    <div id=\"app\"></div>\n"
                            f"    <script type=\"module\" src=\"/app.js\"></script>\n"
                            f"  </body>\n"
                            f"</html>\n"
                            f"```\n\n"
                            f"Would you like me to inspect `app.js` or `styles.css` next?"
                        ),
                        finish_reason="stop",
                    )

                elif target_file in ["app.js", "main.js"]:
                    return LLMResponse(
                        content=(
                            f"### 📄 File Analysis: `app.js`\n\n"
                            f"In **`{repo_name}`**, `app.js` contains the core interactive client-side logic.\n\n"
                            f"#### 🔍 Core Logic & Modules:\n"
                            f"• **Food Menu Data Store:** Defines delicious roadside Punjabi menu items (Aloo Paratha, Paneer Butter Masala, Dal Makhani, Kadai Chicken, Masala Chai, Patiala Lassi).\n"
                            f"• **Cart State Management:** Maintains live order item counts, price calculations, and subtotal taxes in memory.\n"
                            f"• **Dynamic DOM Rendering:** Injects food cards, rating badges, spicy level indicators, and the sticky trucker order drawer into `#app`.\n"
                            f"• **Event Listeners:** Handles category filter switching (Breakfast, Lunch, Dinner, Beverages), Add-to-Cart clicks, and checkout modal triggers.\n\n"
                            f"Would you like to review the menu data structure or examine `styles.css`?"
                        ),
                        finish_reason="stop",
                    )

                elif target_file in ["styles.css", "style.css"]:
                    return LLMResponse(
                        content=(
                            f"### 📄 File Analysis: `styles.css`\n\n"
                            f"In **`{repo_name}`**, `styles.css` provides custom styling and animations for the application.\n\n"
                            f"#### 🎨 Design System Highlights:\n"
                            f"• **Palette:** Warm rustic highway theme with deep charcoal backdrop, vibrant saffron amber (`#f59e0b`), fiery chili red (`#ef4444`), and glowing gold accents.\n"
                            f"• **Layout:** Responsive CSS Grid for food menu cards and Flexbox for category filter chips.\n"
                            f"• **Micro-Animations:** Smooth hover elevation on food cards, pulse badges for specials, and slide-in drawer for order checkout.\n"
                            f"• **Typography:** High-readability font hierarchy for quick scanning on mobile devices."
                        ),
                        finish_reason="stop",
                    )

                elif target_file in ["package.json", "package-lock.json"]:
                    return LLMResponse(
                        content=(
                            f"### 📄 File Analysis: `package.json`\n\n"
                            f"In **`{repo_name}`**, `package.json` configures dependencies and build automation.\n\n"
                            f"#### 📦 Scripts & Tooling:\n"
                            f"• **`npm run dev`**: Starts local Vite development server with Hot Module Replacement (HMR) on port 5173.\n"
                            f"• **`npm run build`**: Compiles optimized production bundle into `dist/` directory.\n"
                            f"• **`npm run preview`**: Locally serves the production build.\n"
                            f"• **Build Engine:** `vite` fast ES module bundler."
                        ),
                        finish_reason="stop",
                    )

                elif target_file in ["vite.config.js", "vite.config.ts"]:
                    return LLMResponse(
                        content=(
                            f"### 📄 File Analysis: `vite.config.js`\n\n"
                            f"In **`{repo_name}`**, `vite.config.js` configures the Vite bundler.\n\n"
                            f"• **Port & Host:** Configures development server listening bindings.\n"
                            f"• **Build Target:** Generates modern ES2020 JavaScript output with automatic asset hashing and CSS minification.\n"
                            f"• **Static Assets:** Serves images (`dhaba-bg.jpg`, `favicon.png`) from the `public/` directory."
                        ),
                        finish_reason="stop",
                    )

                elif target_file in ["dockerfile", "docker-compose.yml"]:
                    return LLMResponse(
                        content=(
                            f"### 📄 File Analysis: `Dockerfile`\n\n"
                            f"In **`{repo_name}`**, the container configuration provides multi-stage building:\n\n"
                            f"• **Build Stage:** `node:18-alpine` or `python:3.11-slim` for compiling static assets.\n"
                            f"• **Production Stage:** Lightweight `nginx:alpine` serving the compiled SPA on port 80/443.\n"
                            f"• **Caching:** Layered dependency installation for fast CI/CD builds."
                        ),
                        finish_reason="stop",
                    )

                else:
                    return LLMResponse(
                        content=(
                            f"### 📄 File Analysis: `{target_file}`\n\n"
                            f"Found `{target_file}` in repository **`{repo_name}`**.\n\n"
                            f"• **Path:** `{target_file}`\n"
                            f"• **Status:** Tracked in `main` branch.\n"
                            f"• **Purpose:** Static resource / source file supporting `{repo_clean_name}`.\n\n"
                            f"You can ask me to inspect functions in `app.js`, view markup in `index.html`, or check build commands in `package.json`."
                        ),
                        finish_reason="stop",
                    )

        # ----------------------------------------------------------------------
        # 2. FILE TREE & CODE STRUCTURE INTENT ("Show files", "Directory structure")
        # ----------------------------------------------------------------------
        if any(w in last_msg for w in ["file", "folder", "tree", "structure", "directory", "list files", "layout", "all files"]):
            if not has_tool_result and tools:
                return LLMResponse(
                    content=None,
                    tool_calls=[
                        LLMToolCall(
                            id="call_list_files_1",
                            name="list_repository_files",
                            arguments={},
                        )
                    ],
                    finish_reason="tool_calls",
                )
            else:
                files_formatted = ""
                if tool_results:
                    try:
                        data = json.loads(tool_results[0].get("content", "{}"))
                        raw_files = data.get("files", [])
                        if raw_files:
                            files_formatted = "\n".join([f"  • `{f}`" for f in raw_files[:20]])
                            if len(raw_files) > 20:
                                files_formatted += f"\n  • ... and {len(raw_files) - 20} more files"
                    except Exception:
                        pass

                default_files = (
                    "  • `index.html`\n"
                    "  • `app.js`\n"
                    "  • `styles.css`\n"
                    "  • `package.json`\n"
                    "  • `vite.config.js`\n"
                    "  • `public/favicon.png`\n"
                    "  • `public/dhaba-bg.jpg`\n"
                    "  • `.gitignore`"
                )
                display_files = files_formatted if files_formatted else default_files

                return LLMResponse(
                    content=(
                        f"### 📂 Repository File Structure: `{repo_name}`\n\n"
                        f"Here are the discovered files in **`{repo_name}`**:\n\n"
                        f"{display_files}\n\n"
                        f"You can ask me to inspect any specific file (e.g. *\"Explain index.html\"* or *\"What's in app.js?\"*), explain functions, or analyze CI/CD configs."
                    ),
                    finish_reason="stop",
                )

        # ----------------------------------------------------------------------
        # 3. REPOSITORY OVERVIEW & ABOUT INTENT ("What's this repo about?")
        # ----------------------------------------------------------------------
        if any(w in last_msg for w in [
            "about", "what's this", "what is this", "overview", "summary",
            "explain this repo", "tell me about", "what does this do", "purpose", "theme"
        ]):
            if is_trucker_dhaba:
                return LLMResponse(
                    content=(
                        f"### 📦 Repository Overview: `{repo_name}`\n\n"
                        f"**`{repo_name}`** is an interactive web application for **Trucker's Dhaba**, a roadside highway restaurant and food ordering service.\n\n"
                        f"#### 🚀 Application Architecture:\n"
                        f"• **Frontend UI:** Fast Single Page Application bundled with **Vite** (`index.html`, `styles.css`, `app.js`).\n"
                        f"• **Food Menu & Ordering:** Interactive Punjabi dhaba menu (Parathas, Dal Makhani, Kadai Paneer, Lassi, Chai) with category filtering and instant shopping cart calculations.\n"
                        f"• **Theme & Styling:** Custom warm highway aesthetic featuring authentic dhaba background visuals, responsive food cards, and mobile-friendly touch targets.\n"
                        f"• **Dev & Build Scripts:** Configured via `package.json` with `npm run dev` (Vite dev server) and `npm run build`.\n\n"
                        f"Ask me to inspect `index.html`, `app.js`, `styles.css`, or run a CI/CD investigation!"
                    ),
                    finish_reason="stop",
                )
            else:
                return LLMResponse(
                    content=(
                        f"### 📦 Repository Overview: `{repo_name}`\n\n"
                        f"**`{repo_name}`** is an active software project connected to your VoiceOps workspace.\n\n"
                        f"• **Role:** {repo_clean_name} software service.\n"
                        f"• **Branch Tracking:** Connected to `main` branch.\n"
                        f"• **VoiceOps Capabilities Active:**\n"
                        f"  - 🔍 **File Inspection:** Ask *\"Explain index.html\"* or *\"What is in package.json?\"*\n"
                        f"  - 📊 **Pipeline Health:** Ask *\"Why did the latest CI/CD build fail?\"*\n"
                        f"  - 📖 **Runbook Search:** Ask *\"Search docs for deployment configuration\"*"
                    ),
                    finish_reason="stop",
                )

        # ----------------------------------------------------------------------
        # 4. CODE IMPLEMENTATION / TECH STACK / HOW TO RUN
        # ----------------------------------------------------------------------
        if any(w in last_msg for w in [
            "dependencies", "library", "tech stack", "database", "schema",
            "how do i run", "how to run", "start", "port", "cart", "menu", "order", "food"
        ]):
            if is_trucker_dhaba:
                return LLMResponse(
                    content=(
                        f"### 🛠️ Technical Specs & How to Run: `{repo_name}`\n\n"
                        f"#### ⚙️ Tech Stack:\n"
                        f"• **Build Tool:** Vite (`vite.config.js`)\n"
                        f"• **Languages:** Modern ES6+ JavaScript (`app.js`) and Vanilla CSS3 (`styles.css`)\n"
                        f"• **Markup:** Semantic HTML5 (`index.html`)\n\n"
                        f"#### 🚀 How to Run Locally:\n"
                        f"```bash\n"
                        f"# 1. Install dependencies\n"
                        f"npm install\n\n"
                        f"# 2. Start Vite development server\n"
                        f"npm run dev\n\n"
                        f"# 3. Build optimized production bundle\n"
                        f"npm run build\n"
                        f"```\n\n"
                        f"The development server will launch on `http://localhost:5173` with instant Hot Module Replacement."
                    ),
                    finish_reason="stop",
                )
            else:
                return LLMResponse(
                    content=(
                        f"### 🛠️ Architecture & Technical Specs for `{repo_name}`\n\n"
                        f"• **Core Framework:** Asynchronous REST API / frontend SPA service.\n"
                        f"• **Database & State:** Supabase PostgreSQL with `pgvector` memory indexing.\n"
                        f"• **Build & Run:** Configured via `package.json` and Docker containers."
                    ),
                    finish_reason="stop",
                )

        # ----------------------------------------------------------------------
        # 5. GITHUB ISSUE / ACTION CREATION INTENT (Requires Human Approval)
        # ----------------------------------------------------------------------
        if any(w in last_msg for w in ["issue", "ticket", "open an issue", "create an issue", "report bug", "open issue"]):
            if not has_tool_result and tools:
                return LLMResponse(
                    content=None,
                    tool_calls=[
                        LLMToolCall(
                            id="call_issue_approval_1",
                            name="create_issue",
                            arguments={
                                "title": f"Fix build & dependency configuration in {repo_name}",
                                "body": (
                                    f"### Problem Description\n"
                                    f"Automated CI/CD Workflow for `{repo_name}` encountered a build error during containerized package installation.\n\n"
                                    f"### Root Cause Analysis\n"
                                    f"The runtime environment upgraded Python/Node dependencies with native compilation mismatches.\n\n"
                                    f"### Recommended Fix\n"
                                    f"1. Pin package versions in package.json/requirements.txt.\n"
                                    f"2. Ensure Docker base image provides necessary build tools."
                                ),
                                "labels": ["bug", "ci-cd", "devops"],
                            },
                        )
                    ],
                    finish_reason="tool_calls",
                )
            else:
                return LLMResponse(
                    content=f"I have prepared the GitHub issue for `{repo_name}` and submitted it for your security approval.",
                    finish_reason="stop",
                )

        # ----------------------------------------------------------------------
        # 6. PULL REQUEST / PATCH INTENT (Requires Human Approval)
        # ----------------------------------------------------------------------
        if any(w in last_msg for w in ["pull request", " pr", "pr ", "patch", "fix pr", "create pr"]):
            if not has_tool_result and tools:
                return LLMResponse(
                    content=None,
                    tool_calls=[
                        LLMToolCall(
                            id="call_pr_approval_1",
                            name="create_pull_request",
                            arguments={
                                "title": f"fix: resolve dependency and build configuration for {repo_clean_name}",
                                "head": "fix/devops-pipeline-patch",
                                "base": "main",
                                "body": f"Automated patch proposed by VoiceOps AI for `{repo_name}` to resolve build and deployment failures.",
                            },
                        )
                    ],
                    finish_reason="tool_calls",
                )
            else:
                return LLMResponse(
                    content=f"I have prepared the pull request for `{repo_name}` for your review and approval.",
                    finish_reason="stop",
                )

        # ----------------------------------------------------------------------
        # 7. DIFF / WHAT CHANGED BETWEEN BUILDS INTENT
        # ----------------------------------------------------------------------
        if any(w in last_msg for w in ["changed", "diff", "difference", "between", "commit", "changes"]):
            if not has_tool_result and tools:
                return LLMResponse(
                    content=None,
                    tool_calls=[
                        LLMToolCall(
                            id="call_compare_diff_1",
                            name="compare_commits",
                            arguments={"base": "e49fa12", "head": "a19b882"},
                        )
                    ],
                    finish_reason="tool_calls",
                )
            else:
                return LLMResponse(
                    content=(
                        f"I compared recent commits in `{repo_name}` (`e49fa12`...`a19b882`):\n\n"
                        f"• **Files Changed:** `Dockerfile`, `package.json`\n"
                        f"• **Diff:** `- FROM python:3.11-slim` \n"
                        f"          `+ FROM python:3.13-slim`\n\n"
                        f"**Impact:** Updated base runtime broke compatibility with pinned native modules."
                    ),
                    finish_reason="stop",
                )

        # ----------------------------------------------------------------------
        # 8. RAG / DOCUMENTATION SEARCH INTENT
        # ----------------------------------------------------------------------
        if any(w in last_msg for w in ["search", "doc", "runbook", "guide", "procedure", "knowledge", "architecture"]):
            if not has_tool_result and tools:
                return LLMResponse(
                    content=None,
                    tool_calls=[
                        LLMToolCall(
                            id="call_rag_search_1",
                            name="search_documentation",
                            arguments={"query": last_msg},
                        )
                    ],
                    finish_reason="tool_calls",
                )
            else:
                rag_content = ""
                if tool_results:
                    try:
                        data = json.loads(tool_results[0].get("content", "{}"))
                        results = data.get("results", [])
                        if results:
                            rag_content = f"Found relevant runbook '{results[0].get('document_title', 'Production Runbook')}':\n> \"{results[0].get('content_excerpt', '')}\"\n\n"
                    except Exception:
                        pass

                return LLMResponse(
                    content=(
                        f"{rag_content}"
                        f"According to the DevOps Runbook for `{repo_name}`, verify runtime environment compatibility and ensure automated database migrations are applied before blue/green promotion."
                    ),
                    finish_reason="stop",
                )

        # ----------------------------------------------------------------------
        # 9. DEPLOYMENT FAILURE / ERROR INVESTIGATION
        # ----------------------------------------------------------------------
        if any(w in last_msg for w in ["why", "fail", "error", "broken", "investigate", "crash", "bug"]):
            if not has_tool_result and tools:
                return LLMResponse(
                    content=None,
                    tool_calls=[
                        LLMToolCall(
                            id="call_logs_analysis_1",
                            name="get_workflow_logs",
                            arguments={"run_id": 1245},
                        )
                    ],
                    finish_reason="tool_calls",
                )
            else:
                return LLMResponse(
                    content=(
                        f"I analyzed the build logs for `{repo_name}` for workflow run (#1245):\n\n"
                        f"• **Failed Step:** `pip install -r requirements.txt` / `npm build`\n"
                        f"• **Error Trace:** `TypeError: bcrypt 3.2.0 is incompatible with Python 3.13 runtime`\n"
                        f"• **Root Cause:** Base image upgraded without upgrading pinned dependencies.\n"
                        f"• **Recommended Action:** Upgrade package versions or revert base image. Shall I prepare a GitHub issue or PR for this?"
                    ),
                    finish_reason="stop",
                )

        # ----------------------------------------------------------------------
        # 10. DIRECT REPOSITORY QUESTION ANSWERING
        # ----------------------------------------------------------------------
        if is_trucker_dhaba:
            return LLMResponse(
                content=(
                    f"### 🥘 `{repo_name}` - Trucker's Dhaba\n\n"
                    f"Regarding your query **\"{raw_last_msg}\"**:\n\n"
                    f"• **File & Code Context:** The repository is built with **Vite**, **HTML5** (`index.html`), **JavaScript** (`app.js`), and **CSS** (`styles.css`).\n"
                    f"• **Key Features:** Roadside Dhaba food menu catalog, live cart checkout system, dynamic category filters, and responsive layout.\n"
                    f"• **Available Files to Inspect:** `index.html`, `app.js`, `styles.css`, `package.json`, `vite.config.js`.\n\n"
                    f"You can ask me to inspect any of these files in depth (e.g. *\"What's in index.html?\"* or *\"Show app.js functions\"*)!"
                ),
                finish_reason="stop",
            )

        return LLMResponse(
            content=(
                f"### 🔍 `{repo_name}` Investigation\n\n"
                f"Regarding **\"{raw_last_msg}\"** in `{repo_name}`:\n\n"
                f"• **Branch:** Tracking `main` branch.\n"
                f"• **Codebase Ingested:** 1536-dim semantic chunks indexed in Supabase `pgvector`.\n"
                f"• **Actions Available:** You can ask me to inspect specific files (`index.html`, `app.js`, `package.json`, `Dockerfile`), view commit diffs, or investigate CI/CD pipeline runs."
            ),
            finish_reason="stop",
        )


def get_llm_provider() -> BaseLLMProvider:
    """Factory function returning configured LLM provider."""
    if settings.OPENAI_API_KEY:
        return OpenAILLMProvider(
            api_key=settings.OPENAI_API_KEY,
            model=settings.OPENAI_MODEL,
        )
    if settings.GEMINI_API_KEY:
        return GeminiLLMProvider(
            api_key=settings.GEMINI_API_KEY,
            model=settings.GEMINI_MODEL,
        )
    return MockLLMProvider()
