//api/client.js
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:4000/api';

// construye headers
export function authHeaders(token) {
  const h = { 'Content-Type': 'application/json' };
  if (token) h['Authorization'] = `Bearer ${token}`;
  return h;
}

// si recibimos 401/403 redirigimos a login
async function handleStatus(res) {
  if (res.status === 401 || res.status === 403) {
    localStorage.removeItem('token');
    // fuerza recarga a /login
    window.location.href = '/login';
    // cortamos la ejecución
    throw new Error('No autorizado – redirigiendo al login');
  }
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Error ${res.status}: ${text}`);
  }
}

export async function post(path, data, token) {
  const res = await fetch(`${API_URL}${path}`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(data)
  });
  await handleStatus(res);
  return res.json();
}


export async function get(path, token) {
  const res = await fetch(`${API_URL}${path}`, {
    headers: authHeaders(token)
 });
  await handleStatus(res);
  return res.json();
}

export async function del(path, token) {
  const res = await fetch(`${API_URL}${path}`, {
    method: 'DELETE',
    headers: authHeaders(token)
  });
  await handleStatus(res);
  return res.json();
}
