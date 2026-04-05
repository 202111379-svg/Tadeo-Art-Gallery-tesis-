import { getEnvironments } from './get-environments';

const { VITE_CLOUDINARY_URL } = getEnvironments();

/**
 * Sube un archivo a Cloudinary (plan gratuito) y retorna la URL pública.
 * Requiere:
 *   - VITE_CLOUDINARY_URL en .env  →  https://api.cloudinary.com/v1_1/<cloud_name>/image/upload
 *   - Upload preset "react-gallery" creado en Cloudinary como Unsigned
 */
export const fileUpload = async (file: File): Promise<string> => {
  if (!VITE_CLOUDINARY_URL) {
    throw new Error(
      'VITE_CLOUDINARY_URL no está configurado en el archivo .env'
    );
  }

  const formData = new FormData();
  formData.append('upload_preset', 'react-gallery');
  formData.append('file', file);

  const resp = await fetch(VITE_CLOUDINARY_URL, {
    method: 'POST',
    body: formData,
  });

  if (!resp.ok) {
    const errBody = await resp.json().catch(() => ({}));
    throw new Error(
      errBody?.error?.message ?? `Error al subir imagen (${resp.status})`
    );
  }

  const data = await resp.json();
  return data.secure_url as string;
};
