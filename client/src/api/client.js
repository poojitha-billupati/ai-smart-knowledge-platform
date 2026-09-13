const TOKEN_KEY = 'auth_token';

// In dev, Vite proxies /api and /images to the local server, so a relative
// path works. In production the client (Vercel) and server (Render) are on
// different origins, so VITE_API_BASE_URL points the client at the deployed
// backend explicitly.
const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (token) => localStorage.setItem(TOKEN_KEY, token);
export const clearToken = () => localStorage.removeItem(TOKEN_KEY);

/** Resolves a server-relative path (e.g. an image's "/images/x.webp") against the API origin. */
export const assetUrl = (path) => (path?.startsWith('/') ? `${API_BASE}${path}` : path);

async function request(path, options = {}) {
  const token = getToken();
  const headers = { ...options.headers };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}/api${path}`, { ...options, headers });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed: ${res.status}`);
  }
  if (res.status === 204) return null;
  return res.json();
}

function jsonBody(data) {
  return { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) };
}

export const getInformation = () => request('/information');
export const getEvents = () => request('/events');
export const getImages = () => request('/images');
export const getFaq = () => request('/faq');

export const createRecord = (collection, data) =>
  request(`/${collection}`, { method: 'POST', ...jsonBody(data) });

export const updateRecord = (collection, id, data) =>
  request(`/${collection}/${id}`, { method: 'PUT', ...jsonBody(data) });

export const deleteRecord = (collection, id) =>
  request(`/${collection}/${id}`, { method: 'DELETE' });

export const askAssistant = (question, history = []) =>
  request('/chat', { method: 'POST', ...jsonBody({ question, history }) });

/**
 * Streams an answer token by token over SSE, calling onSources once up front
 * and onToken for each fragment. Falls back to the buffered /chat endpoint if
 * the stream can't be opened.
 */
export async function streamAssistant(question, history, { onSources, onToken, signal }) {
  const res = await fetch(`${API_BASE}/api/chat/stream`, {
    method: 'POST',
    signal,
    ...jsonBody({ question, history }),
  });

  if (!res.ok || !res.body) {
    const { answer, sources } = await askAssistant(question, history);
    onSources?.(sources ?? []);
    onToken?.(answer);
    return;
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    const frames = buffer.split('\n\n');
    buffer = frames.pop() ?? '';

    for (const frame of frames) {
      const event = frame.match(/^event: (.+)$/m)?.[1];
      const raw = frame.match(/^data: ([\s\S]*)$/m)?.[1];
      if (!event || raw === undefined) continue;

      const data = JSON.parse(raw);
      if (event === 'sources') onSources?.(data);
      else if (event === 'token') onToken?.(data);
      else if (event === 'error') throw new Error(data.message);
    }
  }
}

export const login = (email, password) =>
  request('/auth/login', { method: 'POST', ...jsonBody({ email, password }) });
