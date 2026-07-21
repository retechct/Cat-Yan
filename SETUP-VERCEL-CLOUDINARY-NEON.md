# Configuracion segura para publicar BEAULYX

## 1. Cambia las claves expuestas

Como las claves aparecieron en capturas, crea claves nuevas antes de publicar:

- Cloudinary: genera una API Key nueva o rota la actual.
- Neon: usa `Reset password` para generar una nueva cadena `DATABASE_URL`.

No pegues secretos en el codigo React ni en archivos que subas a GitHub.

## 2. Variables necesarias

En local van en `.env.local`.
En Vercel van en `Settings > Environment Variables`.

```env
ADMIN_PASSWORD=
ADMIN_SESSION_SECRET=
DATABASE_URL=
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
CLOUDINARY_FOLDER=beaulyx/productos
```

Para llenar `.env.local` sin pegar claves en el chat, ejecuta:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\setup-env-local.ps1
```

`ADMIN_PASSWORD` es la clave para entrar al dashboard cuando la pagina este en Vercel.

`ADMIN_SESSION_SECRET` debe ser una cadena larga aleatoria. Puedes crear una con:

```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## 3. Como queda conectado

- La pagina publica lee el catalogo desde Neon si `DATABASE_URL` existe.
- El dashboard en Vercel pide `ADMIN_PASSWORD`.
- Al guardar cambios desde el dashboard, el catalogo completo se guarda en Neon.
- Al subir fotos desde el dashboard con sesion iniciada, las imagenes se suben a Cloudinary.
- En local, si no hay Vercel Functions activas, el dashboard sigue funcionando con `localStorage`.

## 4. Archivos importantes

- `.env.local`: claves privadas locales, no se sube.
- `.env.example`: plantilla de variables sin secretos.
- `api/catalog.js`: lectura y guardado del catalogo en Neon.
- `api/cloudinary-signature.js`: firma segura para subir imagenes a Cloudinary.
- `api/admin-login.js`: login privado del dashboard.

## 5. Antes de publicar

Ejecuta:

```powershell
npm.cmd run seed:neon
npm.cmd run build
```

`seed:neon` sube a Neon el catalogo base que esta en `src/data/productos.js`.

## 6. Conectar con Vercel

Opcion recomendada:

1. Sube el proyecto a GitHub.
2. Entra a Vercel.
3. Crea un proyecto nuevo e importa el repositorio.
4. Vercel debe detectar Create React App.
5. Confirma:
   - Build Command: `npm run build`
   - Output Directory: `build`
6. En `Settings > Environment Variables`, agrega los mismos nombres y valores de `.env.local`.
7. Haz deploy.

Despues del primer deploy:

1. Abre la URL publica.
2. Ve a `https://tu-dominio.vercel.app/#admin`.
3. Ingresa la clave `ADMIN_PASSWORD`.
4. Agrega o edita un producto.
5. Sube una foto.
6. Guarda y vuelve al catalogo publico para verificar.

## 7. Probar que las variables llegaron

En Vercel, abre:

```text
https://tu-dominio.vercel.app/api/health
```

Debe responder con:

```json
{
  "admin": true,
  "database": true,
  "cloudinary": true
}
```

Si alguno sale `false`, falta esa variable en Vercel. Si todos salen `true`, las variables existen; la prueba real de Neon ocurre al entrar al dashboard y guardar el catalogo.
