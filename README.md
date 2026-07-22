# BEAULYX - Catalogo personal Yanbal

Catalogo independiente para mostrar productos disponibles y armar una consulta por WhatsApp. No procesa compras ni pagos dentro de la pagina.

## Uso local

```powershell
npm install
npm start
```

La pagina local abre en `http://localhost:3000`.

## Administrador

En produccion entra con:

```text
https://tu-dominio.vercel.app/#admin
```

En Vercel el administrador requiere `ADMIN_PASSWORD` y guarda el catalogo en Neon. Las fotos nuevas se suben a Cloudinary con firma privada desde `/api/cloudinary-signature`.

## Variables privadas

Copia los nombres desde `.env.example` y coloca los valores reales solo en `.env.local` y en Vercel:

```env
ADMIN_PASSWORD=
ADMIN_SESSION_SECRET=
DATABASE_URL=
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
CLOUDINARY_FOLDER=beaulyx/productos
```

No subas claves reales a GitHub.

## Comandos utiles

```powershell
npm run validate:catalog
npm run images:webp
npm run build
npm run seed:neon
```

- `validate:catalog` revisa que el catalogo base tenga estructura segura.
- `images:webp` convierte imagenes locales de productos a WebP.
- `build` crea la version de produccion.
- `seed:neon` sube el catalogo base a Neon.

## Despliegue

El proyecto esta preparado para Vercel con Create React App:

- Build Command: `npm run build`
- Output Directory: `build`
- Variables: las mismas de `.env.example`

Despues del deploy revisa:

```text
https://tu-dominio.vercel.app/api/health
```

Debe devolver `admin`, `database` y `cloudinary` en `true`.

## Nota legal

El sitio muestra un catalogo personal administrado por una asesora independiente. No es la pagina oficial de Yanbal ni esta administrado por Yanbal. Las marcas, nombres de productos, logotipos e imagenes oficiales pertenecen a sus respectivos titulares.
