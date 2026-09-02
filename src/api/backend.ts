const API_URL = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, '');

export async function backendRequest<T>(path: string, body: unknown): Promise<T> {
  if (!API_URL) throw new Error('VITE_API_URL no está configurada.');
  const response = await fetch(requestUrl(path), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(body),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.message ?? payload.errors?.join(' ') ?? 'No se pudo completar la solicitud.');
  return payload as T;
}

export async function backendGet<T>(path: string): Promise<T> {
  if (!API_URL) throw new Error('VITE_API_URL no está configurada.');
  const response = await fetch(requestUrl(path), { headers: authHeaders() });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.message ?? 'No se pudo cargar la información.');
  return payload as T;
}

export async function backendDelete(path: string): Promise<void> {
  if (!API_URL) throw new Error('VITE_API_URL no está configurada.');
  const response = await fetch(requestUrl(path), { method: 'DELETE', headers: authHeaders() });
  if (!response.ok) throw new Error('No se pudo eliminar la información.');
}

function authHeaders(): Record<string, string> {
  const token = localStorage.getItem('fitplanner_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function requestUrl(path: string): string {
  const normalizedPath = API_URL === '/api' && path.startsWith('/api/') ? path.slice(4) : path;
  return `${API_URL}${normalizedPath}`;
}
