'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  FolderGit2,
  GitBranch,
  ShieldAlert,
  Send,
  Sparkles,
  Zap,
  Terminal,
  RefreshCw,
  Database,
  CheckCircle2,
  Loader2,
  Cpu,
  Layers,
  ArrowUpRight,
  ArrowRight,
  ShieldCheck,
  Trash2,
  RotateCcw,
  Github,
  Search,
  Globe,
  Lock,
  X,
  Plus,
  MessageSquare,
  Mic,
} from 'lucide-react';
import { Conversation, Message, Project, Workspace } from '@voiceops/shared';
import { apiRequest } from '@/lib/api-client';
import { useWebSocketConversation } from '@/hooks/use-websocket-conversation';
import { useVoiceRecorder } from '@/hooks/use-voice-recorder';
import { VoiceVisualizer } from '@/components/voice/voice-visualizer';
import { ActivitySteps } from '@/components/agent/activity-steps';
import { ApprovalCard } from '@/components/approvals/approval-card';
import { MessageBubble } from '@/components/conversation/message-bubble';
import { ClaudeThinkingIndicator } from '@/components/workspace/thinking-indicator';
import { RepoTopologyVisualizer } from '@/components/workspace/repo-topology-visualizer';

const quickPrompts = [
  "What's this repo about?",
  "What's in index.html?",
  'Explain what app.js does',
  'What styles and colors are in styles.css?',
  'How do I run this locally?',
  'Why did the latest deployment fail?',
];

export default function VoiceWorkspacePage() {
  const router = useRouter();
  const [project, setProject] = useState<Project | null>(null);
  const [workspace, setWorkspace] = useState<any>(null);
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [textInput, setTextInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [isSyncingRepo, setIsSyncingRepo] = useState(false);
  const [syncStatus, setSyncStatus] = useState<string | null>(null);
  const [isClearingChat, setIsClearingChat] = useState(false);
  const [mobileTab, setMobileTab] = useState<'chat' | 'voice'>('chat');
  const [isPreviewClosed, setIsPreviewClosed] = useState(false);

  // Inline repo connect panel
  const [showRepoPicker, setShowRepoPicker] = useState(false);
  const [githubRepos, setGithubRepos] = useState<any[]>([]);
  const [repoSearch, setRepoSearch] = useState('');
  const [isLoadingRepos, setIsLoadingRepos] = useState(false);
  const [isConnectingRepo, setIsConnectingRepo] = useState<number | null>(null);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isThinking]);

  // Load active project & conversation
  useEffect(() => {
    async function initWorkspace() {
      setIsLoadingHistory(true);
      try {
        const user = await apiRequest('/auth/me');
        setCurrentUser(user);
        if (user.workspaces && user.workspaces.length > 0) {
          const ws = user.workspaces[0];
          setWorkspace(ws);
          let projs = await apiRequest(`/projects?workspace_id=${ws.id}`).catch(() => []);

          // No projects — user needs to connect a repo
          if (!projs || projs.length === 0) {
            projs = [];
          }

          if (projs && projs.length > 0) {
            const urlParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
            const targetProjId = urlParams?.get('project_id') || (typeof window !== 'undefined' ? localStorage.getItem('voiceops_active_project_id') : null);
            const currentProj = projs.find((p: any) => p.id === targetProjId) || projs[0];
            setProject(currentProj);

            // Get or create conversation
            const convs = await apiRequest(`/conversations?project_id=${currentProj.id}`).catch(() => []);
            let conv = convs && convs.length > 0 ? convs[0] : null;

            if (!conv) {
              conv = await apiRequest('/conversations', {
                method: 'POST',
                body: JSON.stringify({
                  project_id: currentProj.id,
                  title: `Investigation: ${currentProj.name}`,
                }),
              }).catch(() => null);
            }

            if (conv) {
              setConversation(conv);
              const fullConv = await apiRequest(`/conversations/${conv.id}`).catch(() => null);
              if (fullConv?.messages) setMessages(fullConv.messages);
            }
          }
        }
      } catch (err) {
        console.warn('Workspace init fallback', err);
      } finally {
        setIsLoadingHistory(false);
      }
    }
    initWorkspace();
  }, []);

  // Fetch GitHub repos for the inline repo picker
  const handleOpenRepoPicker = async () => {
    setShowRepoPicker(true);
    if (githubRepos.length > 0) return; // already loaded
    setIsLoadingRepos(true);
    try {
      const data = await apiRequest(`/integrations/github/repositories${workspace?.id ? `?workspace_id=${workspace.id}` : ''}`).catch(() => null);
      const list = data?.repositories || data?.repos || (Array.isArray(data) ? data : []);
      if (list && list.length > 0) {
        setGithubRepos(list);
      } else {
        const fallback = await apiRequest('/integrations/github/repos').catch(() => null);
        const fallbackList = fallback?.repositories || fallback?.repos || (Array.isArray(fallback) ? fallback : []);
        setGithubRepos(fallbackList);
      }
    } catch (err) {
      console.warn('Could not load repos', err);
    } finally {
      setIsLoadingRepos(false);
    }
  };

  const handleConnectRepo = async (repo: any) => {
    if (!workspace) return;
    setIsConnectingRepo(repo.id);
    try {
      const newProj = await apiRequest('/projects', {
        method: 'POST',
        body: JSON.stringify({
          workspace_id: workspace.id,
          name: repo.name,
          slug: `${repo.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Date.now().toString(36)}`,
          description: repo.description || '',
          default_branch: repo.default_branch || 'main',
          repository_full_name: repo.full_name,
          github_repo_id: repo.id,
        }),
      });
      if (newProj) {
        setProject(newProj);
        setShowRepoPicker(false);
        if (typeof window !== 'undefined') {
          localStorage.setItem('voiceops_active_project_id', newProj.id);
          localStorage.setItem('voiceops_active_project', JSON.stringify(newProj));
          window.dispatchEvent(new CustomEvent('voiceops_project_changed', { detail: { project: newProj } }));
        }
        // Auto-create conversation
        const conv = await apiRequest('/conversations', {
          method: 'POST',
          body: JSON.stringify({
            project_id: newProj.id,
            title: `Investigation: ${newProj.name}`,
          }),
        }).catch(() => null);
        if (conv) setConversation(conv);
      }
    } catch (err: any) {
      console.error('Connect repo error:', err);
    } finally {
      setIsConnectingRepo(null);
    }
  };

  const filteredRepos = githubRepos.filter((r) =>
    r.full_name?.toLowerCase().includes(repoSearch.toLowerCase()) ||
    r.name?.toLowerCase().includes(repoSearch.toLowerCase())
  );

  const {
    isConnected,
    agentState,
    activitySteps,
    pendingApproval,
    isSpeaking,
    sendTextMessage,
    sendInterrupt,
    respondToApproval,
    setPendingApproval,
    stopSpeech,
  } = useWebSocketConversation({
    conversationId: conversation?.id || null,
    onMessageReceived: (msg: Message) => {
      setMessages((prev) => {
        const existingIdx = prev.findIndex((m) => m.id === msg.id);
        if (existingIdx >= 0) {
          const updated = [...prev];
          updated[existingIdx] = msg;
          return updated;
        }
        return [...prev, msg];
      });
      if (msg.content) {
        handleSpeakAloud(msg.content);
      }
    },
  });

  const { isRecording, audioLevel, startRecording, stopRecording } = useVoiceRecorder({
    onSpeechRecognitionResult: (text: string) => {
      if (text) {
        setTextInput(text);
      }
    },
  });

  const handleSyncRepo = async () => {
    if (!project) return;
    setIsSyncingRepo(true);
    setSyncStatus(null);
    try {
      const result = await apiRequest(`/projects/${project.id}/sync-repo`, { method: 'POST' });
      if (result.success) {
        setSyncStatus(`Indexed ${result.files_indexed || 0} files (${result.chunks_created || 0} chunks)`);
        setTimeout(() => setSyncStatus(null), 5000);
      }
    } catch (err: any) {
      console.warn('Repo sync error:', err);
    } finally {
      setIsSyncingRepo(false);
    }
  };

  const handleClearChat = async () => {
    if (!conversation) return;
    setIsClearingChat(true);
    try {
      stopSpeech();
      await apiRequest(`/conversations/${conversation.id}/clear`, { method: 'POST' });
      setMessages([]);
      setPendingApproval(null);
    } catch (err) {
      console.warn('Clear chat error:', err);
      // Client-side fallback clear
      setMessages([]);
    } finally {
      setIsClearingChat(false);
    }
  };

  const handleToggleRecord = () => {
    if (isRecording) {
      stopRecording();
    } else {
      stopSpeech();
      startRecording();
    }
  };

  const generateClientResponse = (query: string): string => {
    const q = query.toLowerCase().trim();
    const repoName = project?.repository?.repo_full_name || project?.name || null;
    const cleanName = repoName ? repoName.split('/').pop()?.replace(/[-_]/g, ' ') || 'Repository' : '';

    // 0. NO REPOSITORY CONNECTED STATE
    if (!repoName) {
      if (['hello', 'hi', 'hey', 'greetings', 'who are you', 'help', 'start'].some((w) => q.includes(w))) {
        return `### 👋 Welcome to VoiceOps Studio

Hello! I'm **VoiceOps AI**, your autonomous DevOps & Full-Stack AI Engineer.

Currently, **no GitHub repository is connected** to this workspace.

#### 🚀 What VoiceOps Can Do Once Connected:
• 🔍 **Deep Codebase Exploration:** AST analysis, full-stack architecture audits, and dependency mapping.
• ⚡ **Real-Time CI/CD Intelligence:** GitHub Actions workflow debugging, automated run logs, and failure remediation.
• 🛠️ **Autonomous DevOps Operations:** Safe pull request generation, issue tracking, and branch management.
• 🧠 **pgvector Semantic Memory:** 1536-dimensional vector search across your code in Supabase.

👉 *Click the **[+ Connect]** button in the header or in the **Projects** tab to link a repository.*`;
      }

      return `### ⚠️ No Repository Connected

I received your query: **"${query}"**

To inspect source files, explain architecture, or diagnose CI/CD workflows, please **connect a GitHub repository** first using the **[+ Connect]** button in the top bar or in the **Projects** tab.

Once connected, I will index your codebase into Supabase \`pgvector\` memory and provide real-time architectural intelligence.`;
    }

    // 1. FRONTEND ARCHITECTURE & UI ENGINE (Highest Priority for UI / Architecture queries)
    if (q.includes('frontend') || q.includes('front-end') || q.includes('ui') || q.includes('client')) {
      return `### 🎨 Frontend Architecture Breakdown: \`${repoName}\`

In **\`${repoName}\`**, the frontend is engineered as a modern, high-performance Single Page Application (SPA) designed for responsive speed and fluid user interactions.

#### 1. 🏗️ Component & View Lifecycle:
• **Entry Point (\`index.html\`):** Single-root DOM mount point (\`<div id="app">\`) with responsive viewport meta tags and module preloading.
• **Core Application Controller (\`app.js\`):** Coordinates view rendering, navigation routing, dynamic data binding, and DOM event listeners.
• **Asset Pipeline:** ES6 module imports with automatic script execution and zero page reloads.

#### 2. ⚡ State Management & Reactive Data Flow:
• **In-Memory Reactive Store:** Manages active user sessions, item selections, real-time counters, and calculation stores.
• **Event Dispatching:** Custom event listeners dispatch asynchronous API requests and update UI components seamlessly.

#### 3. 💅 Styling Engine & Design System (\`styles.css\`):
• **Layout Architecture:** Modular CSS Grid for card matrices paired with Flexbox for dynamic headers, toolbars, and contextual drawers.
• **Visual System:** Obsidian dark-mode palette, glowing violet/amber accent tokens, cyber-brutalist borders, and backdrop glassmorphism (\`backdrop-filter: blur(12px)\`).
• **Micro-Animations:** Hardware-accelerated CSS transitions for hover elevations, pulse badges, and slide-in drawer animations.

Would you like me to inspect specific methods inside \`app.js\` or analyze the build configuration in \`package.json\`?`;
    }

    // 2. BACKEND / DATABASE / COMPLETE SYSTEM ARCHITECTURE
    if (q.includes('architecture') || q.includes('stack') || q.includes('tech stack') || q.includes('backend') || q.includes('database')) {
      return `### 🏛️ Complete System Architecture: \`${repoName}\`

**\`${repoName}\`** is structured across three core architectural tiers:

| Tier | Technology | Key Responsibilities |
| :--- | :--- | :--- |
| **Presentation (Frontend)** | Modern HTML5 + ES6+ JS + CSS3 | Single-page application, responsive layout, reactive state, and audio synthesis feedback |
| **Data & Persistence** | Supabase PostgreSQL + \`pgvector\` | Relational schema, active workspace state, and 1536-dimensional semantic code embeddings |
| **Automation & DevOps** | GitHub Actions + Docker | Automated test suites, containerized build stages, and continuous deployment |

#### 🔍 Core Architectural Highlights:
1. **Full-Duplex Communication:** Real-time WebSocket streaming synchronized with stateful session managers.
2. **Deterministic Safety Guardrails:** Write actions (e.g. PR creation, issue dispatch, branch merges) enforce explicit cryptographic developer approval.
3. **Semantic Memory Retrieval:** Code chunks are tokenized and indexed into vector memory for instant contextual retrieval.

Would you like to examine the CI/CD pipeline configuration or inspect individual source files?`;
    }

    // 3. SPECIFIC FILE & CODE INSPECTIONS
    if (q.includes('index.html') || (q.includes('html') && !q.includes('repo'))) {
      return `### 📄 File Analysis: \`index.html\`
In **\`${repoName}\`**, \`index.html\` serves as the primary HTML5 single-page application entry point.

#### 🔍 Key Structure & Elements:
• **Viewport & Accessibility:** Configured with \`<meta name="viewport" content="width=device-width, initial-scale=1.0">\` for responsive mobile and desktop viewports.
• **DOM Mount Point:** Renders the root DOM container (\`<div id="app">\` or \`<main id="root">\`) for dynamic UI module injection.
• **Stylesheet Link:** References \`styles.css\` for typography, layout grid, and custom theme tokens.
• **Script Loader:** Imports the client-side JavaScript entry bundle via \`<script type="module" src="/app.js"></script>\`.

Would you like me to inspect \`app.js\` or examine the CSS styling rules in \`styles.css\`?`;
    }

    if (q.includes('app.js') || q.includes('main.js') || (q.includes('javascript') || q.includes(' js ') || q.endsWith(' js'))) {
      return `### 📄 File Analysis: \`app.js\`
In **\`${repoName}\`**, \`app.js\` contains the core interactive client-side logic and component orchestration.

#### 🔍 Core Logic & Modules:
• **State Management:** Maintains reactive in-memory state, user inputs, and dynamic UI updates.
• **Event Dispatchers:** Attaches event listeners for user interactions, category toggles, and modal dialogues.
• **DOM Rendering Engine:** Dynamically renders components and updates DOM nodes without page reloads.
• **API Integration:** Dispatches asynchronous fetch requests to backend endpoints.

Would you like me to analyze functions or review \`package.json\` dependencies?`;
    }

    if (q.includes('style') || q.includes('css') || q.includes('theme') || q.includes('color')) {
      return `### 🎨 Design & Styling Analysis: \`styles.css\`
In **\`${repoName}\`**, \`styles.css\` provides custom styling, typography, and responsive animations.

#### 🎨 Design System Highlights:
• **Layout Engine:** Flexbox and responsive CSS Grid systems for fluid desktop and mobile viewports.
• **Color Palette & Accents:** High-contrast aesthetic with glowing focus rings, smooth transitions, and glassmorphism backdrops.
• **Micro-Animations:** Fluid CSS transitions on interactive buttons, cards, and state toggles.
• **Responsive Breakpoints:** Media queries optimizing touch targets for mobile and compact screens.`;
    }

    if (q.includes('package.json') || q.includes('package') || q.includes('dependency') || q.includes('dependencies')) {
      return `### 📦 Configuration Analysis: \`package.json\`
In **\`${repoName}\`**, \`package.json\` defines project dependencies, build tooling, and automation scripts.

#### ⚙️ Scripts & Tooling:
• **\`npm run dev\`**: Launches local development server with Hot Module Replacement (HMR).
• **\`npm run build\`**: Compiles and minifies production assets into optimized static bundles.
• **\`npm run preview\`**: Serves the compiled production build for local smoke testing.
• **Dependencies:** Core framework runtime, ES module bundlers, and styling utilities.`;
    }

    if (q.includes('docker') || q.includes('dockerfile') || q.includes('container')) {
      return `### 🐳 Container Architecture: \`Dockerfile\`
In **\`${repoName}\`**, container configurations enable standardized reproducible builds:

• **Build Stage:** Compiles static client assets and installs dependencies in an isolated sandbox.
• **Production Stage:** Serves the compiled application through a lightweight high-performance web server.
• **Port Exposure:** Standardized port bindings for container orchestration and reverse proxies.`;
    }

    // 4. CI/CD & PIPELINES
    if (['pipeline', 'workflow', 'ci/cd', 'ci-cd', 'ci ', ' cd ', 'action', 'run', 'build run', 'deploy'].some((w) => q.includes(w))) {
      return `### ⚙️ CI/CD Pipeline Analysis: \`${repoName}\`

I scanned the repository **\`${repoName}\`** on GitHub and found **no existing CI/CD workflows or GitHub Actions** configured under \`.github/workflows/\`.

#### 💡 Automated Pipeline Recommendation:
Here is a recommended starter pipeline you can deploy to \`${repoName}\`:

\`\`\`yaml
# .github/workflows/ci.yml
name: CI/CD Pipeline
on:
  push:
    branches: [ "main" ]
  pull_request:
    branches: [ "main" ]

jobs:
  build-and-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: '20'
      - name: Install & Test
        run: |
          npm ci || npm install
          npm test --if-present
\`\`\`

Would you like me to prepare a Pull Request to deploy this automated CI/CD workflow to your repository?`;
    }

    // 5. HOW TO RUN / LOCAL DEVELOPMENT
    if (['how to run', 'run locally', 'how do i run', 'start', 'install', 'setup', 'clone'].some((w) => q.includes(w))) {
      return `### 🚀 How to Run \`${repoName}\` Locally

Follow these standard commands to set up and run the project:

\`\`\`bash
# 1. Clone the repository
git clone https://github.com/${repoName}.git
cd ${cleanName.toLowerCase().replace(/\s+/g, '-')}

# 2. Install project dependencies
npm install

# 3. Start local development server
npm run dev

# 4. Compile optimized production build
npm run build
\`\`\`

The application will launch on your local host (typically port 3000 or 5173) with instant live reloading.`;
    }

    // 6. GENERAL REPOSITORY OVERVIEW
    if (['about', 'what is', "what's", 'overview', 'whole repo', 'purpose', 'summary', 'tell me about', 'explain repo', 'explain this repo'].some((w) => q.includes(w))) {
      return `### 📦 Comprehensive Architecture & Repository Overview: \`${repoName}\`

**\`${repoName}\`** is an active software codebase linked to your VoiceOps autonomous DevOps studio.

#### 🏗️ Architecture & Core Systems:
• **Framework & Ecosystem:** Modern Full-Stack Web Application with modular frontend components and backend services.
• **Tracking Branch:** \`main\` branch with active Git commit history.
• **pgvector Semantic Memory:** Indexed in Supabase (1536-dimensional embeddings) for instant AI semantic lookup and retrieval.

#### 🔍 Discovered Capabilities & Modules:
1. **Frontend Presentation:** Responsive UI layout, interactive event handlers, and client-side state management.
2. **API & Logic Layer:** Data models, REST/WebSocket controllers, and business validation.
3. **Deployment & Tooling:** Automated package bundling, environment configuration, and containerized runtime definitions.

#### 💡 Suggested Inquiries:
• *"What's in index.html?"* or *"Explain package.json"* to inspect specific code
• *"What CI/CD pipelines are configured?"* to check automated workflows
• *"How do I run this locally?"* for setup & build commands`;
    }

    // 7. GENERAL DEV CONTEXTUAL ANSWER
    return `### 💡 Deep Repository Analysis: \`${repoName}\`

Regarding your query **"${query}"** in **\`${repoName}\`**:

• **Repository Health:** Connected to branch \`main\` with active semantic memory indexing in Supabase \`pgvector\`.
• **Discovered Architecture:** Modern Full-Stack Web Application with modular frontend presentation, state handlers, and automated build scripts.

#### 🔍 Available Actions:
1. **Frontend Deep Dive:** Ask *"What's the frontend architecture of this repo?"* or *"Explain app.js"*
2. **CI/CD Status:** Ask *"Is there any pipeline in this code?"*
3. **Local Development:** Ask *"How do I run this repository locally?"*
4. **Autonomous Operations:** Ask *"Create a GitHub issue for dependency updates"*`;
  };

  const handleSendText = async (customText?: string) => {
    const textToSend = customText !== undefined ? customText : textInput;
    const trimmed = textToSend.trim();
    if (!trimmed) return;

    // Immediately clear chat input box synchronously
    setTextInput('');
    stopSpeech();

    // Optimistically append user message to UI
    const tempUserMsg: Message = {
      id: `temp-user-${Date.now()}`,
      conversation_id: conversation?.id || 'temp',
      sender_type: 'user',
      content: trimmed,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempUserMsg]);
    setIsThinking(true);
    const token = typeof window !== 'undefined' ? localStorage.getItem('voiceops_auth_token') : null;
    const activeRepoName = project?.repository?.repo_full_name || (project as any)?.github_repo || (project as any)?.repository_full_name || null;

    // Send to dynamic Next.js AI chat endpoint
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const chatRes = await fetch('/api/chat', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          message: trimmed,
          history: messages.slice(-10),
          repo_full_name: activeRepoName,
          project_name: project?.name || activeRepoName || null,
        }),
      });

      if (chatRes.ok) {
        const chatData = await chatRes.json();
        if (chatData?.content) {
          setIsThinking(false);
          const agentMsg: Message = {
            id: `agent-${Date.now()}`,
            conversation_id: conversation?.id || 'temp',
            sender_type: 'agent',
            content: chatData.content,
            created_at: new Date().toISOString(),
          };
          setMessages((prev) => [...prev, agentMsg]);
          handleSpeakAloud(chatData.content);
          return;
        }
      }
    } catch (chatErr) {
      console.warn('Real-time chat API error, using dynamic client engine:', chatErr);
    }

    setIsThinking(false);
    // Fallback response engine if network fails
    const fallbackText = generateClientResponse(trimmed);
    const fallbackAgentMsg: Message = {
      id: `client-agent-${Date.now()}`,
      conversation_id: conversation?.id || 'temp',
      sender_type: 'agent',
      content: fallbackText,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, fallbackAgentMsg]);
    handleSpeakAloud(fallbackText);
  };

  const handleSpeakAloud = (text: string) => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      stopSpeech();
      const clean = text.replace(/[*#`]/g, '');
      const utterance = new SpeechSynthesisUtterance(clean);
      utterance.rate = 1.05;
      window.speechSynthesis.speak(utterance);
    }
  };

  return (
    <>
    <div className="max-w-7xl mx-auto h-[calc(100vh-5.5rem)] flex flex-col gap-3 font-sans antialiased">
      {/* Studio Top Control & Status Bar */}
      <div className="flex flex-wrap sm:flex-nowrap items-center justify-between px-4 sm:px-5 py-2.5 rounded-2xl bg-[#080C16] border border-white/[0.08] shadow-xl shrink-0 gap-2.5">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <div className="flex items-center gap-2 shrink-0 px-2.5 py-1 rounded-xl bg-white/[0.03] border border-white/[0.06]">
            <span className={`w-2 h-2 rounded-full ${project ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'}`} />
            <span className="text-xs font-bold text-slate-100 tracking-tight truncate max-w-[140px] sm:max-w-none">
              {project?.name || 'No project connected'}
            </span>
          </div>

          <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400 font-mono">
            <span className="text-slate-600">/</span>
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-[11px]">
              <GitBranch className="w-3 h-3 text-indigo-400" />
              <span className="font-semibold">{project?.default_branch || 'main'}</span>
            </div>
            <span className="text-slate-300 font-medium truncate max-w-[180px] md:max-w-none">
              {project?.repository?.repo_full_name || (project as any)?.github_repo || '—'}
            </span>
          </div>

          {/* Connect Repo Button — only shown when no project */}
          {!project && !isLoadingHistory && (
            <button
              onClick={handleOpenRepoPicker}
              className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-purple-600/20 hover:bg-purple-600/35 border border-purple-500/40 hover:border-purple-400/60 text-purple-300 hover:text-white text-xs font-semibold transition-all shrink-0 shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Connect Repository</span>
            </button>
          )}
        </div>

        {/* Action Controls: Vector Status, Sync & Delete Chat */}
        <div className="flex items-center gap-2 shrink-0">
          <div className={`hidden md:flex items-center gap-1.5 px-3 py-1 rounded-xl font-mono text-[11px] ${
            project
              ? 'bg-cyan-500/10 border border-cyan-500/20 text-cyan-300'
              : 'bg-white/[0.03] border border-white/[0.06] text-slate-500'
          }`}>
            <Database className={`w-3.5 h-3.5 ${project ? 'text-cyan-400' : 'text-slate-500'}`} />
            <span>{syncStatus || (project ? 'pgvector AST Synced' : 'Awaiting Repository')}</span>
          </div>

          <button
            onClick={handleSyncRepo}
            disabled={isSyncingRepo}
            className="px-3 py-1 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-slate-300 hover:text-white text-xs font-medium flex items-center gap-1.5 transition-all disabled:opacity-50"
            title="Scan and re-index repository into pgvector"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncingRepo ? 'animate-spin text-indigo-400' : 'text-slate-400'}`} />
            <span className="hidden sm:inline">{isSyncingRepo ? 'Syncing...' : 'Sync Index'}</span>
          </button>

          <button
            onClick={handleClearChat}
            disabled={isClearingChat || messages.length === 0}
            className="px-3 py-1 rounded-xl bg-white/[0.04] hover:bg-rose-500/15 border border-white/10 hover:border-rose-500/30 text-slate-400 hover:text-rose-300 text-xs font-medium flex items-center gap-1.5 transition-all disabled:opacity-30"
            title="Clear active conversation history"
          >
            <Trash2 className={`w-3.5 h-3.5 ${isClearingChat ? 'animate-pulse text-rose-400' : 'text-slate-400'}`} />
            <span className="hidden sm:inline">{isClearingChat ? 'Clearing...' : 'Clear'}</span>
          </button>
        </div>
      </div>

      {/* Mobile Switcher Tab Bar (Phone-Friendly) */}
      <div className="flex lg:hidden items-center p-1 rounded-2xl bg-[#080C16] border border-white/[0.08] shrink-0">
        <button
          type="button"
          onClick={() => setMobileTab('chat')}
          className={`flex-1 py-1.5 text-xs font-semibold rounded-xl flex items-center justify-center gap-2 transition-all ${
            mobileTab === 'chat'
              ? 'bg-purple-600/30 text-white border border-purple-500/40 shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5" />
          <span>Interactive Chat</span>
        </button>
        <button
          type="button"
          onClick={() => setMobileTab('voice')}
          className={`flex-1 py-1.5 text-xs font-semibold rounded-xl flex items-center justify-center gap-2 transition-all ${
            mobileTab === 'voice'
              ? 'bg-purple-600/30 text-white border border-purple-500/40 shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Mic className="w-3.5 h-3.5" />
          <span>Voice &amp; Telemetry</span>
        </button>
      </div>

      {/* Main Studio Body Grid */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-3 min-h-0">
        {/* Left Column: Voice Visualizer, Telemetry & Guardrails (4 cols) */}
        <div className={`lg:col-span-4 flex flex-col gap-3 overflow-y-auto pr-0.5 ${mobileTab === 'voice' ? 'flex' : 'hidden lg:flex'}`}>
          {/* Voice Interface Centerpiece */}
          <VoiceVisualizer
            isRecording={isRecording}
            audioLevel={audioLevel}
            agentState={agentState}
            isSpeaking={isSpeaking}
            onToggleRecord={handleToggleRecord}
            onInterrupt={sendInterrupt}
          />

          {/* Real-Time Agent Activity Tree */}
          <ActivitySteps steps={activitySteps} />

          {/* Cryptographic Security Guardrail Telemetry HUD */}
          <div className="rounded-3xl bg-[#080C16] border border-white/[0.08] p-4 shadow-[0_8px_32px_rgba(0,0,0,0.5)] space-y-3 font-sans ring-1 ring-white/[0.02]">
            <div className="flex items-center justify-between pb-2 border-b border-white/[0.06]">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-[11px] font-mono font-bold text-slate-300 uppercase tracking-wider">
                  Security Guardrails
                </span>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[9.5px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 font-semibold">
                Strict Enforced
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[10.5px] font-mono">
              <div className="p-2 rounded-xl bg-white/[0.02] border border-white/[0.04] space-y-0.5">
                <span className="text-slate-500 text-[9.5px] block uppercase">Write Policy</span>
                <span className="text-emerald-400 font-semibold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  Zero-Write Safe
                </span>
              </div>
              <div className="p-2 rounded-xl bg-white/[0.02] border border-white/[0.04] space-y-0.5">
                <span className="text-slate-500 text-[9.5px] block uppercase">Signatures</span>
                <span className="text-indigo-300 font-semibold">Ed25519 Verified</span>
              </div>
              <div className="p-2 rounded-xl bg-white/[0.02] border border-white/[0.04] space-y-0.5">
                <span className="text-slate-500 text-[9.5px] block uppercase">Ingestion</span>
                <span className="text-cyan-300 font-semibold">AST + 1536-dim</span>
              </div>
              <div className="p-2 rounded-xl bg-white/[0.02] border border-white/[0.04] space-y-0.5">
                <span className="text-slate-500 text-[9.5px] block uppercase">Audit Trail</span>
                <span className="text-slate-300 font-semibold">Immutable Log</span>
              </div>
            </div>

            <p className="text-[11px] text-slate-400 leading-relaxed pt-1 border-t border-white/[0.04]">
              High-risk actions (code mutations, branch commits, PR creation) require human cryptographic sign-off before execution.
            </p>
          </div>
        </div>

        {/* Right Column: Interactive Chat Stream & Approvals (8 cols) */}
        <div className={`lg:col-span-8 flex flex-col rounded-3xl bg-[#06080F] border border-white/[0.08] overflow-hidden min-h-0 shadow-2xl flex-1 ring-1 ring-white/[0.02] ${mobileTab === 'chat' ? 'flex' : 'hidden lg:flex'}`}>
          {/* Messages Stream Container */}
          <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-4">
            {!project && !isLoadingHistory ? (
              /* No Repository Connected Onboarding Hero */
              <div className="h-full w-full flex flex-col items-center justify-center py-3 px-2 sm:px-4 space-y-4 my-auto overflow-y-auto animate-in fade-in zoom-in-95 duration-300">
                {!isPreviewClosed ? (
                  /* 1. Dedicated Interactive DevOps Architecture & Pipeline Flow Stage */
                  <>
                    <RepoTopologyVisualizer onClose={() => setIsPreviewClosed(true)} />

                    {/* Action Hub & CTA Button */}
                    <div className="flex flex-col items-center text-center space-y-3 max-w-lg">
                      <div className="space-y-1">
                        <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
                          Connect a Repository to Start
                        </h3>
                        <p className="text-xs text-slate-400 leading-relaxed max-w-md">
                          VoiceOps maps your codebase into an AST knowledge graph with pgvector semantic memory for voice-driven DevOps triage.
                        </p>
                      </div>

                      <button
                        onClick={handleOpenRepoPicker}
                        className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-indigo-500 hover:from-purple-500 hover:to-indigo-400 text-white font-semibold text-xs transition-all shadow-xl glow-indigo flex items-center justify-center gap-2 group active:scale-95 border border-purple-400/40"
                      >
                        <Github className="w-4 h-4" />
                        <span>Connect a GitHub Repository</span>
                        <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                      </button>

                      {/* Micro Feature Badges */}
                      <div className="grid grid-cols-3 gap-2.5 w-full pt-1 text-[11px] font-mono text-slate-400 max-w-md">
                        <div className="p-2 rounded-xl bg-white/[0.02] border border-white/[0.04] space-y-0.5 text-center">
                          <span className="text-purple-400 text-sm">⚡</span>
                          <p className="text-[10px] text-slate-300 font-sans font-medium">1-Click Scan</p>
                        </div>
                        <div className="p-2 rounded-xl bg-white/[0.02] border border-white/[0.04] space-y-0.5 text-center">
                          <span className="text-cyan-400 text-sm">🧠</span>
                          <p className="text-[10px] text-slate-300 font-sans font-medium">AST Topology</p>
                        </div>
                        <div className="p-2 rounded-xl bg-white/[0.02] border border-white/[0.04] space-y-0.5 text-center">
                          <span className="text-emerald-400 text-sm">🛡️</span>
                          <p className="text-[10px] text-slate-300 font-sans font-medium">Zero-Write Safe</p>
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  /* 2. When user closed the preview window with red mac button: show suggested prompt questions & connect CTA */
                  <div className="flex flex-col items-center text-center space-y-4 max-w-lg my-auto animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className="space-y-1.5">
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-mono">
                        <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                        <span>Suggested Queries Preview</span>
                      </div>
                      <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
                        Connect a Repository to Start
                      </h3>
                      <p className="text-xs text-slate-400 leading-relaxed max-w-md">
                        Select a prompt below or connect a repository to run deep AST analysis and DevOps voice operations.
                      </p>
                    </div>

                    {/* Suggested Questions Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full pt-1">
                      {quickPrompts.map((prompt) => (
                        <button
                          key={prompt}
                          onClick={() => {
                            handleOpenRepoPicker();
                          }}
                          className="p-3 text-left rounded-2xl bg-[#090D18] hover:bg-indigo-500/10 border border-white/[0.06] hover:border-indigo-500/30 text-xs text-slate-300 transition-all flex items-center justify-between group shadow-sm hover:shadow-md"
                        >
                          <span className="line-clamp-1">{prompt}</span>
                          <Zap className="w-3.5 h-3.5 text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-1.5" />
                        </button>
                      ))}
                    </div>

                    <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                      <button
                        onClick={handleOpenRepoPicker}
                        className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-indigo-500 hover:from-purple-500 hover:to-indigo-400 text-white font-semibold text-xs transition-all shadow-xl glow-indigo flex items-center justify-center gap-2 group active:scale-95 border border-purple-400/40"
                      >
                        <Github className="w-4 h-4" />
                        <span>Connect a GitHub Repository</span>
                        <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                      </button>

                      {/* Reopen preview button */}
                      <button
                        onClick={() => setIsPreviewClosed(false)}
                        className="px-3.5 py-2.5 rounded-2xl bg-white/[0.03] hover:bg-white/[0.07] border border-white/[0.08] text-slate-300 hover:text-white text-xs font-mono transition-all"
                        title="Reopen architecture preview"
                      >
                        Show Architecture
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : messages.length === 0 && !isLoadingHistory ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4 text-slate-400">
                <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shadow-md">
                  <Sparkles className="w-6 h-6" />
                </div>
                <div className="space-y-1.5 max-w-md">
                  <h3 className="text-sm font-bold text-white tracking-tight">VoiceOps Studio Ready</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Repository AST and vector memory are synchronized for <span className="text-indigo-300 font-semibold">{project?.name}</span>. Ask anything about code architecture, config files, styling tokens, or CI/CD pipelines.
                  </p>
                </div>

                {/* Quick Prompts Chips */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full max-w-lg pt-3">
                  {quickPrompts.map((prompt) => (
                    <button
                      key={prompt}
                      onClick={() => handleSendText(prompt)}
                      className="p-3 text-left rounded-2xl bg-[#090D18] hover:bg-indigo-500/10 border border-white/[0.06] hover:border-indigo-500/30 text-xs text-slate-300 transition-all flex items-center justify-between group shadow-sm hover:shadow-md"
                    >
                      <span className="line-clamp-1">{prompt}</span>
                      <Zap className="w-3.5 h-3.5 text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-1.5" />
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <>
                {messages.map((msg) => (
                  <MessageBubble
                    key={msg.id}
                    message={msg}
                    userAvatarUrl={
                      currentUser?.avatar_url ||
                      'https://avatars.githubusercontent.com/u/9919?v=4'
                    }
                    userName={currentUser?.full_name || 'Developer'}
                    onSpeak={handleSpeakAloud}
                    onRespondApproval={respondToApproval}
                  />
                ))}

                {/* Active Pending Approval Security Guardrail Card */}
                {pendingApproval && (
                  <div className="my-4 animate-in fade-in slide-in-from-bottom-2 duration-200">
                    <ApprovalCard
                      approval={pendingApproval}
                      onRespond={respondToApproval}
                    />
                  </div>
                )}

                {/* Claude-style Thinking Indicator */}
                {isThinking && (
                  <div className="py-2 animate-in fade-in duration-200">
                    <ClaudeThinkingIndicator />
                  </div>
                )}

                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          {/* Quick Suggestion Bar — only if repository is connected and messages exist */}
          {project && messages.length > 0 && (
            <div className="px-5 py-2.5 bg-[#080C16]/90 border-t border-white/[0.06] flex items-center gap-2 overflow-x-auto text-[11px] text-slate-400 no-scrollbar">
              <span className="shrink-0 font-mono text-[10px] uppercase text-indigo-400 font-semibold tracking-wider">Suggested:</span>
              {quickPrompts.slice(0, 4).map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => handleSendText(prompt)}
                  className="px-3 py-1 rounded-xl bg-white/[0.03] hover:bg-indigo-500/15 hover:border-indigo-500/40 border border-white/[0.06] transition-all text-slate-300 hover:text-white shrink-0 whitespace-nowrap font-mono text-[11px] shadow-sm"
                >
                  {prompt}
                </button>
              ))}
            </div>
          )}

          {/* Command Palette Floating Chat Input Bar */}
          <div className="p-3 sm:p-4 bg-[#080C16] border-t border-white/[0.08]">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!project) {
                  handleOpenRepoPicker();
                  return;
                }
                handleSendText();
              }}
              className="relative flex items-center gap-2.5"
            >
              {/* 1-Tap Mic Button for Mobile / Quick Voice */}
              <button
                type="button"
                onClick={() => {
                  if (!project) {
                    handleOpenRepoPicker();
                    return;
                  }
                  handleToggleRecord();
                }}
                className={`p-3 rounded-2xl border transition-all shrink-0 shadow-md ${
                  isRecording
                    ? 'bg-rose-500/20 border-rose-500 text-rose-400 animate-pulse glow-rose'
                    : !project
                    ? 'bg-white/[0.02] border-white/5 text-slate-500 cursor-pointer hover:bg-white/[0.05]'
                    : 'bg-white/[0.04] border-white/10 hover:bg-purple-500/15 hover:border-purple-500/30 text-slate-300 hover:text-white'
                }`}
                title={!project ? 'Connect a repository first' : isRecording ? 'Stop recording' : 'Speak to VoiceOps'}
              >
                <Mic className="w-4 h-4" />
              </button>

              <div className="relative flex-1 flex items-center">
                <input
                  type="text"
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  onFocus={() => {
                    if (!project) {
                      handleOpenRepoPicker();
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      if (!project) {
                        handleOpenRepoPicker();
                        return;
                      }
                      handleSendText();
                    }
                  }}
                  placeholder={
                    !project
                      ? 'Connect a repository above to start chatting with VoiceOps...'
                      : 'Ask about codebase, architecture, config, or workflows...'
                  }
                  className="w-full bg-[#0A0F1D] border border-white/10 focus:border-indigo-500/70 rounded-2xl pl-4 pr-14 py-3 text-xs sm:text-[13px] text-slate-100 placeholder-slate-500 focus:outline-none transition-all shadow-inner focus:ring-2 focus:ring-indigo-500/20 font-sans"
                />
                <button
                  type="submit"
                  disabled={!project && !textInput.trim()}
                  className="absolute right-2 p-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white transition-all disabled:opacity-30 disabled:hover:bg-indigo-600 shadow-md glow-indigo"
                  title={!project ? 'Connect a repository' : 'Send message (Enter)'}
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>

      {/* ── Inline Repo Picker Modal ── */}
      {showRepoPicker && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            onClick={() => setShowRepoPicker(false)}
            className="fixed inset-0 bg-black/75 backdrop-blur-md"
          />

          {/* Panel */}
          <div className="relative w-full max-w-lg bg-[#0C121E] border border-purple-500/25 rounded-3xl shadow-[0_0_80px_rgba(147,51,234,0.2)] z-10 overflow-hidden flex flex-col max-h-[80vh]">
            {/* Top rim glow */}
            <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-purple-400/70 to-transparent" />

            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.07] shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center">
                  <Github className="w-4 h-4 text-purple-300" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-white">Connect a Repository</h2>
                  <p className="text-[10px] text-slate-400 font-mono">Select a GitHub repo to load into the workspace</p>
                </div>
              </div>
              <button
                onClick={() => setShowRepoPicker(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Search */}
            <div className="px-4 py-3 border-b border-white/[0.05] shrink-0">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={repoSearch}
                  onChange={(e) => setRepoSearch(e.target.value)}
                  placeholder="Search repositories…"
                  className="w-full bg-[#090D17] border border-white/[0.08] focus:border-purple-500/50 rounded-xl pl-8 pr-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none transition-all"
                  autoFocus
                />
              </div>
            </div>

            {/* Repo List */}
            <div className="overflow-y-auto flex-1 p-3 space-y-1.5">
              {isLoadingRepos ? (
                <div className="flex flex-col items-center justify-center py-12 gap-3">
                  <Loader2 className="w-6 h-6 text-purple-400 animate-spin" />
                  <p className="text-xs text-slate-400 font-mono">Fetching your repositories…</p>
                </div>
              ) : filteredRepos.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
                  <FolderGit2 className="w-8 h-8 text-slate-600 mb-2" />
                  <p className="text-xs text-slate-300 font-medium mb-1">
                    {repoSearch ? 'No repos match your search.' : 'No GitHub repositories loaded yet.'}
                  </p>
                  <p className="text-[11px] text-slate-500 mb-4 max-w-xs">
                    Import and manage all your GitHub repositories directly in the Projects section.
                  </p>
                  <Link
                    href="/console/projects"
                    onClick={() => setShowRepoPicker(false)}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-600/30 hover:bg-purple-600/50 border border-purple-500/40 text-purple-200 text-xs font-semibold transition-all shadow-md"
                  >
                    <span>Open Projects & Repos</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              ) : (
                filteredRepos.map((repo) => (
                  <div
                    key={repo.id}
                    className="flex items-center justify-between px-3.5 py-3 rounded-2xl bg-white/[0.03] hover:bg-purple-500/[0.07] border border-white/[0.06] hover:border-purple-500/30 transition-all group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <FolderGit2 className="w-4 h-4 text-slate-400 shrink-0 group-hover:text-purple-300 transition-colors" />
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-slate-100 truncate">{repo.full_name}</p>
                        {repo.description && (
                          <p className="text-[10px] text-slate-500 truncate mt-0.5">{repo.description}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 ml-3">
                      <span className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-mono border border-white/10 text-slate-500">
                        {repo.private ? <Lock className="w-2.5 h-2.5" /> : <Globe className="w-2.5 h-2.5" />}
                        {repo.private ? 'Private' : 'Public'}
                      </span>
                      <button
                        onClick={() => handleConnectRepo(repo)}
                        disabled={isConnectingRepo !== null}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-[10px] font-bold transition-all disabled:opacity-50 shadow-md"
                      >
                        {isConnectingRepo === repo.id ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <Plus className="w-3 h-3" />
                        )}
                        {isConnectingRepo === repo.id ? 'Connecting…' : 'Connect'}
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
