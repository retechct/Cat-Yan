# 🌹 Yanbal · Catálogo de Fragancias

Catálogo digital elegante para compartir por WhatsApp. Diseño oscuro/dorado con botón de pedido directo.

---

## ⚡ Requisitos previos

Antes de empezar, necesitas tener instalado:

1. **Node.js** (versión 16 o superior)
   - Descarga desde: https://nodejs.org
   - Elige la versión "LTS" (la recomendada)
   - Verifica que esté instalado: `node --version`

2. **npm** (viene incluido con Node.js)
   - Verifica: `npm --version`

---

## 🚀 Cómo levantar el proyecto

### Paso 1: Abrir la carpeta del proyecto
```bash
cd yanbal-catalogo
```

### Paso 2: Instalar dependencias (solo la primera vez)
```bash
npm install
```
Esto descarga React y todo lo necesario. Puede tardar 1-2 minutos.

### Paso 3: Iniciar el servidor local
```bash
npm start
```
Se abrirá automáticamente en tu navegador: **http://localhost:3000**

---

## ✏️ Personalización importante

### 1. Cambiar el número de WhatsApp de tu mamá
Abre `src/components/ProductCard.js` y busca esta línea:

```js
const phoneNumber = '51999999999'; // ← Cambiar por el número de WhatsApp de tu mamá
```

Reemplaza `51999999999` con el número real (51 = código de Perú).
Ejemplo: si el número es 987654321 → pon `51987654321`

### 2. Agregar o editar perfumes
Abre `src/data/productos.js` y edita o agrega objetos así:

```js
{
  id: 7,                          // número único
  nombre: "Nombre del perfume",
  categoria: "Mujer",             // Mujer | Hombre | Unisex
  precio: 85.00,
  precioAntes: 99.00,             // null si no hay precio anterior
  stock: 5,                       // 0 = agotado
  ml: "50ml",
  descripcion: "Descripción breve y atractiva.",
  notas: ["Nota1", "Nota2", "Nota3"],
  emoji: "🌸",                    // emoji representativo
  color: "#d4a5a5"               // color de acento (hex)
}
```

---

## 🌐 Publicar en internet (gratis)

Para que tu mamá pueda compartir el link con sus clientas:

### Opción A: Vercel (recomendado, muy fácil)
1. Ve a https://vercel.com y crea cuenta gratis
2. Conecta tu cuenta de GitHub
3. Sube el proyecto a GitHub
4. En Vercel: "New Project" → selecciona tu repo → Deploy
5. ¡Listo! Tendrás un link tipo: `yanbal-catalogo.vercel.app`

### Opción B: Netlify
1. Ve a https://netlify.com
2. Arrastra la carpeta `build` (después de `npm run build`) al panel
3. Obtienes link inmediato

---

## 📁 Estructura del proyecto

```
yanbal-catalogo/
├── public/
│   └── index.html          # HTML base
├── src/
│   ├── components/
│   │   ├── Header.js       # Barra superior con filtros y búsqueda
│   │   ├── Header.css
│   │   ├── ProductCard.js  # Tarjeta de cada perfume
│   │   └── ProductCard.css
│   ├── data/
│   │   └── productos.js    # ← AQUÍ editas los productos
│   ├── styles/
│   │   └── global.css      # Variables de colores y fuentes
│   ├── App.js              # Componente principal
│   └── App.css
└── package.json
```

---

## 🎨 Cambiar colores del tema

Abre `src/styles/global.css` y edita las variables:

```css
:root {
  --oro: #c9a96e;        /* Color dorado principal */
  --negro: #0d0d0d;      /* Fondo oscuro */
  --crema: #f5f0e8;      /* Color de texto */
}
```

---

## 💡 Tips

- El catálogo funciona en **celular** (responsive)
- El botón "Pedir por WhatsApp" arma el mensaje automáticamente
- Cuando `stock: 0` el botón se desactiva y dice "Sin stock"
- Con `stock: 1-3` aparece alerta "¡Solo X disponibles!"

---

Hecho con ❤️ para Yanbal Lima
