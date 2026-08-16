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
  }
}

export function clearAuthToken() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('voiceops_token');
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
  const url = path.startsWith('http') ? path : `${getApiBaseUrl()}${normalizedPath}`;

  const response = await fetch(url, {
    ...options,
    headers,
    credentials: 'include', // send refresh token cookies
  });

  if (response.status === 401 && typeof window !== 'undefined' && !path.includes('/auth/login')) {
    // Session expired
    clearAuthToken();
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
