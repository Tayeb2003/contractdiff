// Default to same-origin (empty) so the dev server's `/api` proxy works. In
// production VITE_API_URL is set to the worker root URL. API_PREFIX below adds
// the `/api` path segment; do NOT also put `/api` here or requests become
// `/api/api/...`.
const API_BASE = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL) || '';
const API_PREFIX = '/api';

function getToken(): string | null {
  return localStorage.getItem('token');
}

async function request(path: string, options: RequestInit = {}): Promise<any> {
  const token = getToken();
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }
  const fullPath = path.startsWith('/') ? `${API_PREFIX}${path}` : `${API_PREFIX}/${path}`;
  const res = await fetch(`${API_BASE}${fullPath}`, { ...options, headers });
  if (!res.ok) {
    let message = '';
    try {
      const data = await res.json();
      message = data?.error || data?.message || '';
    } catch {
      message = res.statusText || '';
    }
    throw new Error(message || `Request failed (HTTP ${res.status})`);
  }
  return res.json();
}

export const api = {
  auth: {
    signup: (email: string, password: string, name: string) =>
      request('/auth/signup', { method: 'POST', body: JSON.stringify({ email, password, name }) }),
    login: (email: string, password: string) =>
      request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
    me: () => request('/auth/me'),
    getKey: () => request('/auth/key'),
    setKey: (apiKey: string, provider?: string) =>
      request('/auth/key', { method: 'PUT', body: JSON.stringify({ apiKey, provider }) }),
    forgotPassword: (email: string) =>
      request('/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email }) }),
    resetPassword: (token: string, password: string) =>
      request('/auth/reset-password', { method: 'POST', body: JSON.stringify({ token, password }) }),
  },
  documents: {
    upload: (file: File) => {
      const form = new FormData();
      form.append('file', file);
      return request('/documents/upload', { method: 'POST', body: form });
    },
    paste: (title: string, content: string) =>
      request('/documents/paste', { method: 'POST', body: JSON.stringify({ title, content }) }),
    list: () => request('/documents'),
    delete: (id: string) => request(`/documents/${id}`, { method: 'DELETE' }),
  },
  analyses: {
    create: (docAId: string, docBId: string) =>
      request('/analyses/create', { method: 'POST', body: JSON.stringify({ docAId, docBId }) }),
    list: () => request('/analyses'),
    get: (id: string) => request(`/analyses/${id}`),
    delete: (id: string) => request(`/analyses/${id}`, { method: 'DELETE' }),
  },
};
