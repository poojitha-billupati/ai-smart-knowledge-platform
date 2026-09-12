const TOKEN_KEY = 'auth_token';

export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (token) => localStorage.setItem(TOKEN_KEY, token);
export const clearToken = () => localStorage.removeItem(TOKEN_KEY);

async function request(path, options = {}) {
  const token = getToken();
  const headers = { ...options.headers };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`/api${path}`, { ...options, headers });
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
