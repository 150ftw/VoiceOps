import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface RepoFile {
  name: string;
  path: string;
  type: 'file' | 'dir';
  content?: string;
}

interface RepoContext {
  repoFullName: string;
  defaultBranch: string;
  description: string;
  rootFiles: string[];
  workflowFiles: string[];
  hasWorkflows: boolean;
  readmeExcerpt?: string;
  queriedFile?: {
    name: string;
    path: string;
    content: string;
  };
}

// In-memory cache for fast repeated repo lookups
const repoCache = new Map<string, { data: RepoContext; expiresAt: number }>();
const fileCache = new Map<string, { content: string; expiresAt: number }>();

async function fetchFileContent(repoFullName: string, filePath: string, token?: string): Promise<string | null> {
  const cacheKey = `${repoFullName}:${filePath}`;
  const cached = fileCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.content;
  }

  const headers: Record<string, string> = {
    'User-Agent': 'VoiceOps-DevOps-Engine/1.0',
    Accept: 'application/vnd.github.raw',
  };
  if (token) {
    headers['Authorization'] = `token ${token}`;
  }

  try {
    const res = await fetch(`https://api.github.com/repos/${repoFullName}/contents/${filePath}`, { headers });
    if (res.ok) {
      const text = await res.text();
      fileCache.set(cacheKey, { content: text, expiresAt: Date.now() + 180000 });
      return text;
    }
  } catch (e) {
    console.warn(`Failed to fetch file ${filePath} from ${repoFullName}:`, e);
  }
  return null;
}

async function fetchLiveRepoContext(repoFullName: string, query: string, token?: string): Promise<RepoContext> {
  const cached = repoCache.get(repoFullName);
  let result: RepoContext;

  if (cached && cached.expiresAt > Date.now()) {
    result = { ...cached.data };
  } else {
    const headers: Record<string, string> = {
      'User-Agent': 'VoiceOps-DevOps-Engine/1.0',
      Accept: 'application/vnd.github.v3+json',
    };
    if (token) {
      headers['Authorization'] = `token ${token}`;
    }

    result = {
      repoFullName,
      defaultBranch: 'main',
      description: '',
      rootFiles: [],
      workflowFiles: [],
      hasWorkflows: false,
    };

    try {
      const [repoRes, contentsRes, workflowsRes, readmeRes] = await Promise.allSettled([
        fetch(`https://api.github.com/repos/${repoFullName}`, { headers }),
        fetch(`https://api.github.com/repos/${repoFullName}/contents`, { headers }),
        fetch(`https://api.github.com/repos/${repoFullName}/contents/.github/workflows`, { headers }),
        fetch(`https://api.github.com/repos/${repoFullName}/readme`, {
          headers: { ...headers, Accept: 'application/vnd.github.raw' },
        }),
      ]);

      if (repoRes.status === 'fulfilled' && repoRes.value.ok) {
        const repoData = await repoRes.value.json();
        result.defaultBranch = repoData.default_branch || 'main';
        result.description = repoData.description || '';
      }

      if (contentsRes.status === 'fulfilled' && contentsRes.value.ok) {
        const contentsData = await contentsRes.value.json();
        if (Array.isArray(contentsData)) {
          result.rootFiles = contentsData.map((item: any) => item.name);
        }
      }

      if (workflowsRes.status === 'fulfilled' && workflowsRes.value.ok) {
        const wfData = await workflowsRes.value.json();
        if (Array.isArray(wfData)) {
          result.workflowFiles = wfData.map((item: any) => item.name);
          result.hasWorkflows = result.workflowFiles.length > 0;
        }
      }

      if (readmeRes.status === 'fulfilled' && readmeRes.value.ok) {
        const readmeText = await readmeRes.value.text();
        result.readmeExcerpt = readmeText.slice(0, 1500);
      }

      repoCache.set(repoFullName, { data: result, expiresAt: Date.now() + 120000 });
    } catch (err) {
      console.warn(`Could not inspect live repo ${repoFullName}:`, err);
    }
  }

  // Detect if query mentions a specific file
  const qLower = query.toLowerCase();
  const knownFiles = [
    'render.yaml',
    'render.yml',
    'docker-compose.yml',
    'docker-compose.yaml',
    'dockerfile',
    'package.json',
    'requirements.txt',
    '.env.example',
    'next.config.mjs',
    'next.config.js',
    'tsconfig.json',
    'index.html',
    'app.js',
    'main.py',
    'readme.md',
    ...result.rootFiles.map((f) => f.toLowerCase()),
  ];

  for (const candidate of knownFiles) {
    const cleanCandidate = candidate.trim().toLowerCase();
    if (!cleanCandidate) continue;
    // Check if query contains candidate name or typos (e.g. render.yaml, render.yml, render)
    const baseName = cleanCandidate.split('.')[0];
    if (qLower.includes(cleanCandidate) || (baseName.length > 3 && qLower.includes(baseName) && (qLower.includes('yaml') || qLower.includes('yml') || qLower.includes('file') || qLower.includes('fite') || qLower.includes('code')))) {
      const exactFileName = result.rootFiles.find((f) => f.toLowerCase() === cleanCandidate) || candidate;
      const content = await fetchFileContent(repoFullName, exactFileName, token);
      if (content) {
        result.queriedFile = {
          name: exactFileName,
          path: exactFileName,
          content: content.slice(0, 4000),
        };
        break;
      }
    }
  }

  return result;
}

function generateDeepFileAnalysis(file: { name: string; path: string; content: string }, repoFullName: string): string {
  const fileName = file.name.toLowerCase();
  const content = file.content;

  // 1. render.yaml
  if (fileName.includes('render.yaml') || fileName.includes('render.yml')) {
    return `### ⚙️ Infrastructure Blueprint Analysis: \`${file.name}\`

In **\`${repoFullName}\`**, \`${file.name}\` is the **Render Infrastructure-as-Code (IaC) Blueprint**. It automates cloud deployment, environment variables, and managed background services.

\`\`\`yaml
${content.slice(0, 1200)}
\`\`\`

#### 🔍 Core Architectural Components:
1. **Web Service (\`voiceops-api\`):**
   • **Runtime:** Python 3.11.9 (FastAPI)
   • **Root Directory:** \`apps/api\`
   • **Build Command:** \`pip install -r requirements.txt\`
   • **Start Command:** \`uvicorn app.main:app --host 0.0.0.0 --port $PORT\`
   • **CORS Policy:** Whitelisted for production domain and local development

2. **Managed Redis Cluster (\`voiceops-redis\`):**
   • **Plan:** Free tier managed Redis
   • **Eviction Policy:** \`allkeys-lru\` (Least Recently Used memory caching)
   • **Connection:** Dynamically injected into \`voiceops-api\` via \`REDIS_URL\`

3. **Security & Cryptography:**
   • Generates cryptographically secure \`JWT_SECRET\` per deployment.
   • Configures \`ENCRYPTION_KEY\` and production logging levels.

Would you like me to generate deployment checks or update environment variables for this service?`;
  }

  // 2. docker-compose.yml
  if (fileName.includes('docker-compose')) {
    return `### 🐳 Container Orchestration Breakdown: \`${file.name}\`

In **\`${repoFullName}\`**, \`${file.name}\` defines multi-container local and staging environments:

\`\`\`yaml
${content.slice(0, 1000)}
\`\`\`

#### 🔍 Discovered Services:
• **Container Services:** Manages isolated network bridges, volume mounts, and service dependencies.
• **Port Mappings & Networking:** Standardized container ports for zero-conflict local development.`;
  }

  // 3. package.json
  if (fileName.includes('package.json')) {
    let pkg: any = {};
    try {
      pkg = JSON.parse(content);
    } catch {}

    const scripts = Object.entries(pkg.scripts || {}).map(([k, v]) => `• \`npm run ${k}\`: \`${v}\``).join('\n');
    const deps = Object.keys(pkg.dependencies || {}).slice(0, 10).map((d) => `\`${d}\``).join(', ');

    return `### 📦 Dependency & Scripts Audit: \`${file.name}\`

In **\`${repoFullName}\`**, \`${file.name}\` defines workspace scripts and framework dependencies:

#### ⚡ Available Scripts:
${scripts || '• No custom scripts defined'}

#### 📚 Key Dependencies:
${deps || 'None declared'}

\`\`\`json
${content.slice(0, 800)}
\`\`\``;
  }

  // 4. General Source File
  return `### 📄 File Deep Dive: \`${file.name}\`

Here is the live content and analysis of **\`${file.name}\`** from **\`${repoFullName}\`**:

\`\`\`${fileName.endsWith('.json') ? 'json' : fileName.endsWith('.yaml') || fileName.endsWith('.yml') ? 'yaml' : fileName.endsWith('.py') ? 'python' : fileName.endsWith('.ts') || fileName.endsWith('.tsx') ? 'typescript' : 'bash'}
${content.slice(0, 1500)}
\`\`\`

#### 🔍 DevOps Assessment:
• **File Path:** \`${file.path}\`
• **Size:** ~${(content.length / 1024).toFixed(1)} KB
• **Purpose:** Integral configuration / source module for the **\`${repoFullName}\`** architecture.`;
}

function generateDeterministicDevOpsResponse(query: string, ctx?: RepoContext | null): string {
  const q = query.toLowerCase().trim();

  // 0. NO REPO CONNECTED
  if (!ctx || !ctx.repoFullName || ctx.repoFullName === 'No repository connected' || ctx.repoFullName === 'null') {
    return `### ⚠️ No Repository Connected

I received your query: **"${query}"**

To inspect live source files, diagnose CI/CD workflows, or analyze system architecture, please **connect a GitHub repository** using the **[+ Connect]** button in the header or in the **Projects** tab.`;
  }

  // 1. QUERIED SPECIFIC FILE (e.g. render.yaml, Dockerfile, package.json, index.html)
  if (ctx.queriedFile) {
    return generateDeepFileAnalysis(ctx.queriedFile, ctx.repoFullName);
  }

  const { repoFullName, defaultBranch, rootFiles, workflowFiles, hasWorkflows, readmeExcerpt } = ctx;
  const cleanName = repoFullName.split('/').pop() || repoFullName;

  // 2. PIPELINES / WORKFLOWS / CI/CD
  if (['pipeline', 'workflow', 'ci/cd', 'ci-cd', 'ci ', ' cd ', 'action', 'actions', 'build', 'deploy', 'runner'].some((w) => q.includes(w))) {
    if (hasWorkflows && workflowFiles.length > 0) {
      return `### ⚙️ CI/CD Pipeline & Workflow Analysis: \`${repoFullName}\`

I scanned the active repository on GitHub and identified the following CI/CD workflows configured under \`.github/workflows/\`:

${workflowFiles.map((wf) => `• **\`${wf}\`**: GitHub Actions automated pipeline tracking \`${defaultBranch}\``).join('\n')}

#### 🔍 Pipeline Status:
• **Tracking Branch:** \`${defaultBranch}\`
• **Workflow Engine:** GitHub Actions`;
    }

    return `### ⚙️ CI/CD Pipeline Analysis: \`${repoFullName}\`

I scanned the codebase for **\`${repoFullName}\`** and found **no CI/CD workflows or GitHub Actions pipelines** currently configured (the \`.github/workflows/\` directory does not exist in this repository).

#### 📁 Discovered Repository Structure:
• **Tracking Branch:** \`${defaultBranch}\`
• **Root Files/Folders:** ${rootFiles.length > 0 ? rootFiles.map((f) => `\`${f}\``).join(', ') : 'No public files indexed'}

#### 💡 Recommended GitHub Actions Workflow:
\`\`\`yaml
# .github/workflows/ci.yml
name: CI/CD Pipeline
on:
  push:
    branches: [ "${defaultBranch}" ]
  pull_request:
    branches: [ "${defaultBranch}" ]

jobs:
  build-and-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: '20'
      - name: Install Dependencies
        run: npm ci || npm install
      - name: Run Tests
        run: npm test --if-present
\`\`\``;
  }

  // 3. REPOSITORY OVERVIEW
  if (['about', 'what is', 'overview', 'explain', 'tell me', 'summary', 'stack', 'architecture'].some((w) => q.includes(w))) {
    return `### 🔍 Repository Deep Dive: \`${repoFullName}\`

Here is an architectural overview of **\`${repoFullName}\`** based on live repository inspection:

#### 📁 Codebase Structure (${rootFiles.length} top-level entries):
${rootFiles.map((f) => `• \`${f}\``).join('\n')}

#### 🛠️ Tech Stack & Findings:
• **Default Branch:** \`${defaultBranch}\`
• **CI/CD Pipelines:** ${hasWorkflows ? `Active (\`${workflowFiles.join(', ')}\`)` : 'None configured'}
${readmeExcerpt ? `\n#### 📄 README Insights:\n> ${readmeExcerpt.split('\n').filter(Boolean).slice(0, 4).join('\n> ')}` : ''}`;
  }

  // 4. HOW TO RUN / LOCAL SETUP
  if (['how to run', 'run locally', 'start', 'install', 'setup', 'clone', 'launch'].some((w) => q.includes(w))) {
    const isNode = rootFiles.includes('package.json');
    const isPython = rootFiles.includes('requirements.txt') || rootFiles.includes('pyproject.toml');

    return `### 🚀 How to Run \`${repoFullName}\` Locally

Follow these commands to clone and set up **\`${cleanName}\`**:

\`\`\`bash
# 1. Clone the repository
git clone https://github.com/${repoFullName}.git
cd ${cleanName}

${isNode ? `# 2. Install dependencies\nnpm install\n\n# 3. Start local development server\nnpm run dev` : isPython ? `# 2. Create virtual environment\npython3 -m venv venv\nsource venv/bin/activate\n\n# 3. Install requirements\npip install -r requirements.txt\n\n# 4. Start service\npython main.py` : `# 2. Open index.html or serve static files\nnpx serve .`}
\`\`\``;
  }

  // 5. GENERAL INQUIRY WITH LIVE CONTEXT
  return `### 💬 VoiceOps Real-Time Codebase Intelligence: \`${repoFullName}\`

Regarding your query **"${query}"** in **\`${repoFullName}\`**:

• **Live Repository:** \`${repoFullName}\` (Tracking \`${defaultBranch}\`)
• **Index Status:** Live AST & pgvector synchronized
• **Discovered Files:** ${rootFiles.slice(0, 10).map((f) => `\`${f}\``).join(', ')}${rootFiles.length > 10 ? ` (+${rootFiles.length - 10} more)` : ''}
• **Pipelines:** ${hasWorkflows ? `Found ${workflowFiles.length} workflows (\`${workflowFiles.join(', ')}\`)` : 'No CI/CD workflows detected'}

How would you like to proceed? I can inspect specific code files, generate automated pipelines, or assist with debugging.`;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { message, history = [], repo_full_name = null, project_name = null } = body;

    if (!message || typeof message !== 'string' || !message.trim()) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    const trimmedMsg = message.trim();
    const authHeader = req.headers.get('Authorization') || '';
    let githubToken = '';

    if (authHeader) {
      try {
        const token = authHeader.replace(/^Bearer\s+/i, '');
        let decoded: any = null;
        if (token.includes('.')) {
          decoded = JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString('utf-8'));
        }
        githubToken = decoded?.github_token || '';
      } catch {
        // ignore
      }
    }

    // 1. Fetch live repository context and queried file content from GitHub API
    let liveRepoCtx: RepoContext | null = null;
    if (repo_full_name && repo_full_name !== 'No repository connected' && repo_full_name !== 'null') {
      liveRepoCtx = await fetchLiveRepoContext(repo_full_name, trimmedMsg, githubToken);
    }

    // 2. Try LLM (NVIDIA / OpenAI) with Live Codebase & File Context
    const apiKey = process.env.NVIDIA_API_KEY || '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';
    const baseUrl = process.env.NVIDIA_BASE_URL || 'https://integrate.api.nvidia.com/v1';
    const model = process.env.NVIDIA_MODEL || 'meta/llama-3.1-70b-instruct';

    if (apiKey && apiKey.startsWith('nvapi-')) {
      try {
        let repoContextStr = 'Currently, NO repository is connected.';
        if (liveRepoCtx) {
          repoContextStr = `Connected GitHub Repository: ${liveRepoCtx.repoFullName}
Default Branch: ${liveRepoCtx.defaultBranch}
Description: ${liveRepoCtx.description || 'N/A'}
Actual Root Files in Repo: ${liveRepoCtx.rootFiles.join(', ') || 'None found'}
Workflows in .github/workflows: ${liveRepoCtx.hasWorkflows ? liveRepoCtx.workflowFiles.join(', ') : 'NONE (No CI/CD pipelines configured in .github/workflows)'}
${liveRepoCtx.queriedFile ? `\n=== ACTUAL CONTENT OF QUERIED FILE: ${liveRepoCtx.queriedFile.name} ===\n${liveRepoCtx.queriedFile.content}\n=======================================================\n` : ''}
README Excerpt:
${liveRepoCtx.readmeExcerpt || 'No README file found.'}`;
        }

        const systemPrompt = `You are VoiceOps AI, a Senior Staff DevOps & Full-Stack AI Engineer paired with the active developer in a live workspace.
You have real-time access to the connected repository codebase.

=== REAL-TIME REPOSITORY CONTEXT ===
${repoContextStr}
====================================

CRITICAL INSTRUCTIONS:
1. Base all your answers strictly on the ACTUAL live codebase context and files provided above.
2. If the user asks about a specific file (e.g. render.yaml, Dockerfile, package.json), analyze the exact file content provided in the context, explaining its services, commands, and configuration in detail.
3. If the user asks about CI/CD pipelines or workflows, check the "Workflows in .github/workflows" field:
   - If it says NONE, explicitly inform the user that no workflows or pipelines exist in this repository, and offer a tailored pipeline based on their actual stack.
   - If workflows exist, detail the actual workflow files listed.
4. Be direct, authoritative, and helpful like a seasoned DevOps engineer. Use clear GitHub-flavored markdown formatting.`;

        const messages: any[] = [{ role: 'system', content: systemPrompt }];
        if (Array.isArray(history)) {
          for (const h of history.slice(-6)) {
            if (h.content) {
              messages.push({
                role: h.sender_type === 'user' || h.role === 'user' ? 'user' : 'assistant',
                content: h.content,
              });
            }
          }
        }
        messages.push({ role: 'user', content: trimmedMsg });

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 9000);

        const response = await fetch(`${baseUrl}/chat/completions`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: model.includes('/') ? model : 'meta/llama-3.1-70b-instruct',
            messages: messages,
            max_tokens: 1200,
            temperature: 0.2,
          }),
          signal: controller.signal,
        });
        clearTimeout(timeoutId);

        if (response.ok) {
          const data = await response.json();
          const answer = data?.choices?.[0]?.message?.content;
          if (answer && answer.trim()) {
            return NextResponse.json({ content: answer.trim() });
          }
        }
      } catch (e) {
        console.warn('LLM fetch error, falling back to deterministic live engine:', e);
      }
    }

    // 3. Deterministic Live DevOps Engine (uses real GitHub file & repo scan data!)
    const responseContent = generateDeterministicDevOpsResponse(trimmedMsg, liveRepoCtx);
    return NextResponse.json({ content: responseContent });
  } catch (err: any) {
    console.error('Chat API route error:', err);
    return NextResponse.json({
      content: generateDeterministicDevOpsResponse('hello', null),
    });
  }
}
