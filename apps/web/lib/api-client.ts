/**
 * VoiceOps REST API Client
 */

const getApiBaseUrl = () => {
  const envUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
  const clean = envUrl.endsWith('/') ? envUrl.slice(0, -1) : envUrl;
  return clean.endsWith('/api/v1') ? clean : `${clean}/api/v1`;
};

export class ApiError extends Error {
  status: number;
  data: any;

  constructor(message: string, status: number, data?: any) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

export function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('voiceops_token');
}

export function setAuthToken(token: string) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('voiceops_token', token);
    // Also write a cookie so the edge middleware can protect dashboard routes
    document.cookie = `voiceops_token=${token}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;
  }
}

export function clearAuthToken() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('voiceops_token');
    // Clear the middleware cookie too
    document.cookie = 'voiceops_token=; path=/; max-age=0; SameSite=Lax';
  }
}

export async function apiRequest<T = any>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getAuthToken();
  const headers = new Headers(options.headers || {});

  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const primaryUrl = path.startsWith('http') ? path : `${getApiBaseUrl()}${normalizedPath}`;
  const fallbackUrl = `/api${normalizedPath}`;

  let response: Response;

  try {
    response = await fetch(primaryUrl, {
      ...options,
      headers,
      credentials: 'include',
    });
  } catch (networkError) {
    // Primary URL failed (e.g. backend offline or cross-origin blocked on hosted frontend)
    // Attempt local Next.js serverless route
    try {
      response = await fetch(fallbackUrl, {
        ...options,
        headers,
      });
    } catch {
      throw networkError;
    }
  }

  if (response.status === 401 && typeof window !== 'undefined' && !path.includes('/auth/login')) {
    // Session expired — clear token and send to login
    clearAuthToken();
    window.location.href = '/login';
    return null as any;
  }

  if (!response.ok) {
    let errorMsg = `Request failed with status ${response.status}`;
    let errorData = null;
    try {
      errorData = await response.json();
      errorMsg = errorData.detail || errorData.error?.message || errorMsg;
    } catch (_) {}
    throw new ApiError(errorMsg, response.status, errorData);
  }

  return response.json();
}
