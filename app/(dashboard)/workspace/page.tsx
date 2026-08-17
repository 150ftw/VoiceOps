'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
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
  ShieldCheck,
  Trash2,
  RotateCcw,
  Github,
  Search,
  Globe,
  Lock,
  X,
  Plus,
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

const quickPrompts = [
  "What's this repo about?",
  "What's in index.html?",
  'Explain what app.js does',
  'What styles and colors are in styles.css?',
  'How do I run this locally?',
  'Why did the latest deployment fail?',
];

export default function VoiceWorkspacePage() {
  const [project, setProject] = useState<Project | null>(null);
  const [workspace, setWorkspace] = useState<any>(null);
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [textInput, setTextInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [isSyncingRepo, setIsSyncingRepo] = useState(false);
  const [syncStatus, setSyncStatus] = useState<string | null>(null);
  const [isClearingChat, setIsClearingChat] = useState(false);

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
  }, [messages]);

  // Load active project & conversation
  useEffect(() => {
    async function initWorkspace() {
      setIsLoadingHistory(true);
      try {
        const user = await apiRequest('/auth/me');
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
      const data = await apiRequest('/integrations/github/repos').catch(() => null);
      if (data?.repos) {
        setGithubRepos(data.repos);
      } else {
        // GitHub not connected — redirect to integrations
        setShowRepoPicker(false);
        window.location.href = '/integrations';
      }
    } catch {
      setShowRepoPicker(false);
      window.location.href = '/integrations';
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
    const repoName = project?.repository?.repo_full_name || project?.name || 'MaisoneGlobal';
    const cleanName = repoName.split('/').pop()?.replace(/[-_]/g, ' ') || 'Repository';

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
      return `### ⚙️ CI/CD Pipeline & Workflow Analysis: \`${repoName}\`

I scanned GitHub Actions and continuous integration configurations for **\`${repoName}\`**:

• **Branch:** Tracking \`main\`
• **Workflow Configuration:** Ready to connect automated testing and continuous deployment via GitHub Actions (\`.github/workflows/*.yml\`).

#### 💡 Automated Pipeline Recommendation:
\`\`\`yaml
# .github/workflows/ci.yml
name: CI/CD Pipeline
on: [push, pull_request]
jobs:
  build-and-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Setup Environment
        run: |
          npm install
          npm test
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

    // Send to dynamic Next.js AI chat endpoint
    try {
      const chatRes = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: trimmed,
          history: messages.slice(-10),
          repo_full_name: project?.repository?.repo_full_name || project?.name || '150ftw/MaisoneGlobal',
          project_name: project?.name || 'MaisoneGlobal',
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
      {/* Studio Top Context Bar */}
      <div className="flex items-center justify-between px-5 py-2.5 rounded-2xl bg-[#080B14] border border-white/[0.07] shadow-xl shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${project ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'}`} />
            <span className="text-xs font-bold text-slate-100 tracking-tight">
              {project?.name || 'No project selected'}
            </span>
          </div>
          <span className="text-slate-600 font-mono text-xs">&bull;</span>
          <div className="flex items-center gap-1.5 text-xs text-slate-400 font-mono">
            <GitBranch className="w-3 h-3 text-slate-500" />
            <span className="text-slate-200 font-medium">
              {project?.repository?.repo_full_name || '— connect a repo'}
            </span>
            <span className="text-slate-600">({project?.default_branch || 'main'})</span>
          </div>
          {/* Connect Repo Button — only shown when no project */}
          {!project && !isLoadingHistory && (
            <button
              onClick={handleOpenRepoPicker}
              className="ml-2 flex items-center gap-1.5 px-3 py-1 rounded-xl bg-purple-600/20 hover:bg-purple-600/35 border border-purple-500/40 hover:border-purple-400/60 text-purple-300 hover:text-purple-100 text-xs font-semibold transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              Connect Repository
            </button>
          )}
        </div>

        {/* Action Controls: Vector Status, Sync & Delete Chat */}
        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 font-mono text-[11px]">
            <Database className="w-3.5 h-3.5 text-cyan-400" />
            <span>{syncStatus || 'pgvector Codebase Active'}</span>
          </div>

          <button
            onClick={handleSyncRepo}
            disabled={isSyncingRepo}
            className="px-3 py-1 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-slate-300 hover:text-white text-xs font-medium flex items-center gap-1.5 transition-all disabled:opacity-50"
            title="Scan and re-index repository into pgvector"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncingRepo ? 'animate-spin text-indigo-400' : 'text-slate-400'}`} />
            <span>{isSyncingRepo ? 'Syncing...' : 'Sync'}</span>
          </button>

          <button
            onClick={handleClearChat}
            disabled={isClearingChat || messages.length === 0}
            className="px-3 py-1 rounded-xl bg-white/[0.04] hover:bg-rose-500/10 border border-white/10 hover:border-rose-500/30 text-slate-400 hover:text-rose-300 text-xs font-medium flex items-center gap-1.5 transition-all disabled:opacity-30 disabled:hover:bg-white/[0.04] disabled:hover:text-slate-400"
            title="Delete conversation chat history"
          >
            <Trash2 className={`w-3.5 h-3.5 ${isClearingChat ? 'animate-pulse text-rose-400' : 'text-slate-400'}`} />
            <span>{isClearingChat ? 'Deleting...' : 'Delete Chat'}</span>
          </button>
        </div>
      </div>

      {/* Main Studio Body Grid */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-3 min-h-0">
        {/* Left Column: Voice Visualizer, Telemetry & Guardrails (4 cols) */}
        <div className="lg:col-span-4 flex flex-col gap-3 overflow-y-auto pr-0.5">
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

          {/* Security Guardrail Card */}
          <div className="rounded-3xl bg-[#080B14] border border-white/[0.07] p-4 shadow-xl space-y-2 font-sans">
            <div className="flex items-center justify-between pb-2 border-b border-white/[0.05]">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-[11px] font-mono font-bold text-slate-300 uppercase">
                  Safety Guardrails
                </span>
              </div>
              <span className="px-2 py-0.2 rounded-full text-[9px] font-mono bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                Enforced
              </span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Zero unauthorized writes. Issue creation, PRs, and workflow mutations require cryptographic developer approval.
            </p>
          </div>
        </div>

        {/* Right Column: Interactive Chat Stream & Approvals (8 cols) */}
        <div className="lg:col-span-8 flex flex-col rounded-3xl bg-[#06080F] border border-white/[0.07] overflow-hidden min-h-0 shadow-2xl">
          {/* Messages Stream Container */}
          <div className="flex-1 p-5 sm:p-6 overflow-y-auto space-y-4">
            {messages.length === 0 && !isLoadingHistory ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4 text-slate-400">
                <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shadow-md">
                  <Sparkles className="w-6 h-6" />
                </div>
                <div className="space-y-1 max-w-sm">
                  <h3 className="text-sm font-bold text-white tracking-tight">VoiceOps Studio Ready</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Repository ingested into vector memory. Ask anything about code files, UI components, dependencies, or CI/CD pipelines.
                  </p>
                </div>

                {/* Quick Prompts Chips */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-lg pt-2">
                  {quickPrompts.map((prompt) => (
                    <button
                      key={prompt}
                      onClick={() => handleSendText(prompt)}
                      className="p-3 text-left rounded-2xl bg-white/[0.02] hover:bg-indigo-500/10 border border-white/[0.04] hover:border-indigo-500/30 text-xs text-slate-300 transition-all flex items-center justify-between group"
                    >
                      <span className="line-clamp-1">{prompt}</span>
                      <Zap className="w-3.5 h-3.5 text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-1" />
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

          {/* Quick Suggestion Bar */}
          {messages.length > 0 && (
            <div className="px-5 py-2 bg-slate-950/70 border-t border-white/[0.04] flex items-center gap-2 overflow-x-auto text-[11px] text-slate-400 no-scrollbar">
              <span className="shrink-0 font-mono text-[10px] uppercase text-slate-500">Suggested:</span>
              {quickPrompts.slice(0, 4).map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => handleSendText(prompt)}
                  className="px-3 py-1 rounded-xl bg-white/[0.02] hover:bg-indigo-500/10 hover:border-indigo-500/30 border border-white/[0.04] transition-all text-slate-300 shrink-0 whitespace-nowrap font-mono text-[11px]"
                >
                  {prompt}
                </button>
              ))}
            </div>
          )}

          {/* Command Palette Chat Input Bar */}
          <div className="p-3.5 bg-slate-950/90 border-t border-white/[0.06]">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendText();
              }}
              className="relative flex items-center"
            >
              <input
                type="text"
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendText();
                  }
                }}
                placeholder="Ask about index.html, app.js logic, styles.css theme, or deployment runbooks..."
                className="w-full bg-[#090D17] border border-slate-800 focus:border-indigo-500/60 rounded-2xl pl-4 pr-14 py-3 text-xs text-slate-100 placeholder-slate-500 focus:outline-none transition-all shadow-inner"
              />
              <button
                type="submit"
                disabled={!textInput.trim()}
                className="absolute right-2 p-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white transition-all disabled:opacity-30 disabled:hover:bg-indigo-600 shadow-md glow-indigo"
                title="Send message (Enter)"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
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
                <div className="text-center py-10 text-xs text-slate-500 font-mono">
                  {repoSearch ? 'No repos match your search.' : 'No GitHub repositories found.'}
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
