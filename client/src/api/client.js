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

export const askAssistant = (question) =>
  request('/chat', { method: 'POST', ...jsonBody({ question }) });

export const login = (email, password) =>
  request('/auth/login', { method: 'POST', ...jsonBody({ email, password }) });
