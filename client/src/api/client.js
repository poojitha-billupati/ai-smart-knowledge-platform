async function request(path, options) {
  const res = await fetch(`/api${path}`, options);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed: ${res.status}`);
  }
  if (res.status === 204) return null;
  return res.json();
}

export const getInformation = () => request('/information');
export const getEvents = () => request('/events');
export const getImages = () => request('/images');
export const getFaq = () => request('/faq');

export const deleteRecord = (collection, id) =>
  request(`/${collection}/${id}`, { method: 'DELETE' });
