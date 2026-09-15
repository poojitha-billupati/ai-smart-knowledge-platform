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
 * Streams an answer token by token over SSE, calling onMeta once up front
 * with { sources, grounded } and onToken for each fragment. Falls back to
 * the buffered /chat endpoint if the stream can't be opened.
 */
export async function streamAssistant(question, history, { onMeta, onToken, signal }) {
  const res = await fetch(`${API_BASE}/api/chat/stream`, {
    method: 'POST',
    signal,
    ...jsonBody({ question, history }),
  });

  if (!res.ok || !res.body) {
    const { answer, sources, grounded, card } = await askAssistant(question, history);
    onMeta?.({ sources: sources ?? [], grounded, card: card ?? null });
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
      if (event === 'meta') onMeta?.(data);
      else if (event === 'token') onToken?.(data);
      else if (event === 'error') throw new Error(data.message);
    }
  }
}

export const login = (email, password) =>
  request('/auth/login', { method: 'POST', ...jsonBody({ email, password }) });

/** Uploads an image file to the server's own storage; resolves to its new /images/... path. */
export async function uploadImage(file) {
  const token = getToken();
  const body = new FormData();
  body.append('image', file);

  // No Content-Type header here on purpose — the browser sets it (with the
  // multipart boundary) itself, only when it doesn't see one already set.
  const res = await fetch(`${API_BASE}/api/uploads`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body,
  });

  const responseBody = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(responseBody.error || `Upload failed: ${res.status}`);
  return responseBody.imageUrl;
}
