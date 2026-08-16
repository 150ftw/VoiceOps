import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { message, history = [], repo_full_name = '150ftw/MaisoneGlobal', project_name = 'MaisoneGlobal' } = body;

    if (!message || typeof message !== 'string' || !message.trim()) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    const trimmedMsg = message.trim();
    const apiKey = process.env.NVIDIA_API_KEY || process.env.OPENAI_API_KEY || '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';
    const baseUrl = process.env.NVIDIA_BASE_URL || 'https://integrate.api.nvidia.com/v1';
    const model = process.env.NVIDIA_MODEL || 'meta/llama-3.1-70b-instruct';

    // System prompt with rich DevOps context
    const systemPrompt = `You are VoiceOps AI, a world-class autonomous DevOps and Full-Stack AI Engineer paired with developer Shivam Sharma.
You are currently investigating and assisting with the software repository: "${repo_full_name}" (Project: ${project_name}).

Repository Context:
- Active branch: main
- Tech stack: Modern Web Application (HTML5, JavaScript/TypeScript, CSS3, Package ecosystem)
- Status: Live and indexed in Supabase pgvector memory.

Guidelines:
1. Answer the user's question directly, conversationally, and with deep technical precision.
2. If they ask about specific files (e.g. index.html, app.js, package.json, Dockerfile), explain the structure, syntax, key components, and functions in detail.
3. If they ask about CI/CD pipelines or GitHub Actions, analyze workflow triggers, automated tests, and deployment steps with helpful YAML examples.
4. If they ask how to run or test the project, provide clean terminal commands.
5. Use clean GitHub markdown formatting with code blocks, bold highlights, and bullet points.
6. Keep your tone confident, helpful, and concise.`;

    const messages: any[] = [
      { role: 'system', content: systemPrompt },
    ];

    // Append recent history
    if (Array.isArray(history)) {
      for (const h of history.slice(-8)) {
        if (h.content) {
          messages.push({
            role: h.sender_type === 'user' || h.role === 'user' ? 'user' : 'assistant',
            content: h.content,
          });
        }
      }
    }

    messages.push({ role: 'user', content: trimmedMsg });

    // Call LLM API
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: model,
        messages: messages,
        max_tokens: 1024,
        temperature: 0.3,
      }),
      signal: AbortSignal.timeout(15000), // 15s timeout
    });

    if (response.ok) {
      const data = await response.json();
      const answer = data?.choices?.[0]?.message?.content;
      if (answer && answer.trim()) {
        return NextResponse.json({ content: answer.trim() });
      }
    }

    // Fallback if API returned non-200
    const errText = await response.text().catch(() => 'API call failed');
    console.warn('NVIDIA NIM API response error, falling back:', errText);
    return NextResponse.json({
      content: `### 💡 Repository Analysis: \`${repo_full_name}\`\n\nRegarding **"${trimmedMsg}"** in \`${repo_full_name}\`:\n\n• **Active Branch:** Tracking \`main\` branch.\n• **Codebase Structure:** Includes core application entry points (\`index.html\`, \`app.js\`, \`styles.css\`, \`package.json\`).\n• **CI/CD Automation:** You can ask me to inspect workflow definitions, generate Pull Requests, or check deployment build logs.`,
    });
  } catch (err: any) {
    console.error('Chat API route error:', err);
    return NextResponse.json({
      content: `### 💡 Repository Analysis: \`150ftw/MaisoneGlobal\`\n\nRegarding your query:\n\n• **Branch:** Tracking \`main\`\n• **Live Capabilities:** File inspection (\`index.html\`, \`app.js\`, \`package.json\`), CI/CD pipeline triggers, and commit diff analysis are available.`,
    });
  }
}
