const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';
const TOKEN_KEY = 'daywell.access_token';

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

export function getToken() {
  return window.localStorage.getItem(TOKEN_KEY);
}

export function saveToken(token) {
  window.localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  window.localStorage.removeItem(TOKEN_KEY);
}

function formatDetail(detail) {
  if (typeof detail === 'string') return detail;
  if (Array.isArray(detail)) {
    return detail.map((item) => item.msg || 'Invalid value').join(' ');
  }
  return 'Something went wrong. Please try again.';
}

async function request(path, { body, form, ...options } = {}) {
  const headers = new Headers(options.headers || {});
  const token = getToken();

  if (token) headers.set('Authorization', `Bearer ${token}`);
  if (form) headers.set('Content-Type', 'application/x-www-form-urlencoded');
  else if (body !== undefined) headers.set('Content-Type', 'application/json');

  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers,
      body: form || (body === undefined ? undefined : JSON.stringify(body)),
    });
  } catch {
    throw new ApiError('Could not reach the API. Check that the FastAPI server is running.', 0);
  }

  if (response.status === 204) return null;

  const data = await response.json().catch(() => null);
  if (!response.ok) {
    if (response.status === 401 && token) clearToken();
    throw new ApiError(
      formatDetail(data?.detail) || `Request failed (${response.status}).`,
      response.status,
    );
  }
  return data;
}

export const authApi = {
  register: (credentials) => request('/api/register', { method: 'POST', body: credentials }),
  login: (credentials) => request('/api/token', {
    method: 'POST',
    form: new URLSearchParams(credentials),
  }),
  me: () => request('/api/me'),
};

export const habitsApi = {
  list: () => request('/api/habits'),
  create: (habit) => request('/api/habits', { method: 'POST', body: habit }),
  update: (id, habit) => request(`/api/habits/${id}`, { method: 'PUT', body: habit }),
  remove: (id) => request(`/api/habits/${id}`, { method: 'DELETE' }),
  checkIn: (id) => request(`/api/habits/${id}/check-in`, { method: 'POST' }),
};

