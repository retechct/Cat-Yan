async function readJson(response) {
  const text = await response.text();
  try {
    return text ? JSON.parse(text) : {};
  } catch {
    throw new Error('Respuesta invalida de Cloudinary');
  }
}

export async function uploadToCloudinary(dataUrl, token) {
  if (!token) throw new Error('No hay sesion administrativa');

  const signatureResponse = await fetch('/api/cloudinary-signature', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({}),
  });
  const signaturePayload = await readJson(signatureResponse);

  if (!signatureResponse.ok) {
    throw new Error(signaturePayload.error || 'Cloudinary no configurado');
  }

  const form = new FormData();
  form.append('file', dataUrl);
  form.append('api_key', signaturePayload.apiKey);
  form.append('timestamp', signaturePayload.timestamp);
  form.append('folder', signaturePayload.folder);
  form.append('signature', signaturePayload.signature);

  const uploadResponse = await fetch(
    `https://api.cloudinary.com/v1_1/${signaturePayload.cloudName}/image/upload`,
    { method: 'POST', body: form }
  );
  const uploadPayload = await readJson(uploadResponse);

  if (!uploadResponse.ok || !uploadPayload.secure_url) {
    throw new Error(uploadPayload.error?.message || 'No se pudo subir la imagen');
  }

  return uploadPayload.secure_url.replace('/image/upload/', '/image/upload/f_webp,q_auto/');
}
