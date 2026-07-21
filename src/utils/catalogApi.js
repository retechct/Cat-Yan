export const ADMIN_TOKEN_STORAGE_KEY = 'beaulyx-admin-token';

async function readJson(response) {
  const text = await response.text();
  try {
    return text ? JSON.parse(text) : {};
  } catch {
    throw new Error('Respuesta invalida del servidor');
  }
}

export function isLocalHost() {
  return ['localhost', '127.0.0.1'].includes(window.location.hostname);
}

export async function fetchRemoteCatalog() {
  const response = await fetch('/api/catalog', { cache: 'no-store' });
  const payload = await readJson(response);
  if (!response.ok || payload.empty) return null;
  return payload;
}

export async function saveRemoteCatalog(catalog, token) {
  if (!token) return false;

  const response = await fetch('/api/catalog', {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(catalog),
  });

  if (response.status === 401) {
    const error = new Error('Sesion expirada');
    error.status = 401;
    throw error;
  }

  if (!response.ok) {
    const payload = await readJson(response).catch(() => ({}));
    throw new Error(payload.error || 'No se pudo guardar el catalogo');
  }

  return true;
}

export async function loginAdmin(password) {
  const response = await fetch('/api/admin-login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password }),
  });
  const payload = await readJson(response);

  if (!response.ok) {
    throw new Error(payload.error || 'No se pudo iniciar sesion');
  }

  return payload.token;
}
