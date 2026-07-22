import React, { useMemo, useRef, useState } from 'react';
import ProductBottleSVG from './ProductBottleSVG';
import { hasReferencePrice, productPriceLabel } from '../utils/pricing';
import { uploadToCloudinary } from '../utils/cloudinaryUpload';
import './AdminPanel.css';

const emptyForm = {
  nombre: '',
  categoria: 'Perfumes',
  segmento: 'Mujer',
  precio: '',
  precioAntes: '',
  stock: '5',
  ml: '50 ml',
  intensidad: 'Fresco',
  descripcion: '',
  notas: '',
  color: '#b76e79',
  imagen: '',
  imagenes: [],
  activo: true,
  destacado: false,
};

function firstCategory(categorias) {
  return categorias[0] || { nombre: 'Perfumes', subcategorias: ['Mujer', 'Hombre', 'Unisex'] };
}

function makeEmptyForm(categorias) {
  const category = firstCategory(categorias);
  return {
    ...emptyForm,
    categoria: category.nombre,
    segmento: category.subcategorias[0] || 'General',
  };
}

function productImages(product) {
  if (Array.isArray(product.imagenes) && product.imagenes.length) return product.imagenes.filter(Boolean);
  return product.imagen ? [product.imagen] : [];
}

function hasTemporaryImages(product) {
  return productImages(product).some((image) => String(image).startsWith('data:'));
}

function productToForm(product, categorias) {
  const imagenes = productImages(product);
  return {
    ...makeEmptyForm(categorias),
    ...product,
    precio: product.precio == null ? '' : String(product.precio),
    precioAntes: product.precioAntes ? String(product.precioAntes) : '',
    stock: String(product.stock),
    notas: product.notas.join(', '),
    imagen: imagenes[0] || '',
    imagenes,
  };
}

function normalizeForm(form) {
  const imagenes = Array.isArray(form.imagenes) ? form.imagenes.filter(Boolean) : [];

  return {
    ...form,
    precio: form.precio === '' || form.precio == null ? null : Number(form.precio),
    precioAntes: form.precioAntes ? Number(form.precioAntes) : null,
    stock: Number(form.stock),
    segmento: form.segmento || 'General',
    notas: form.notas.split(',').map((note) => note.trim()).filter(Boolean),
    imagen: imagenes[0] || '',
    imagenes,
  };
}

function optimizeImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = () => {
      const image = new Image();
      image.onerror = reject;
      image.onload = () => {
        const maxSize = 900;
        const scale = Math.min(1, maxSize / Math.max(image.width, image.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(image.width * scale);
        canvas.height = Math.round(image.height * scale);
        const context = canvas.getContext('2d');
        context.fillStyle = '#ffffff';
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/webp', 0.78));
      };
      image.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

export default function AdminPanel({
  productos,
  categorias,
  onAddProduct,
  onUpdateProduct,
  onDeleteProduct,
  onResetProducts,
  onImportProducts,
  onImportCategories,
  onAddCategory,
  onUpdateCategory,
  onDeleteCategory,
  adminToken,
  onLogout,
  onBack,
}) {
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(() => makeEmptyForm(categorias));
  const [message, setMessage] = useState('');
  const [uploading, setUploading] = useState(false);
  const [categoryForm, setCategoryForm] = useState({ nombre: '', subcategorias: '' });
  const [subcategoryDrafts, setSubcategoryDrafts] = useState({});
  const backupInput = useRef(null);
  const photoInput = useRef(null);
  const isOpen = editingId !== null;
  const formImages = productImages(form);
  const stockTotal = productos.reduce((total, product) => total + Number(product.stock || 0), 0);
  const lowStock = productos.filter((product) => product.stock <= 3).length;
  const catalogValue = productos.reduce((total, product) => total + Number(product.precio || 0) * Number(product.stock || 0), 0);
  const hasPricedProducts = productos.some((product) => hasReferencePrice(product));

  const selectedCategory = useMemo(() => (
    categorias.find((category) => category.nombre === form.categoria) || firstCategory(categorias)
  ), [categorias, form.categoria]);

  const subcategoryOptions = useMemo(() => {
    const base = selectedCategory.subcategorias.length ? selectedCategory.subcategorias : ['General'];
    return base.includes(form.segmento) ? base : [form.segmento, ...base].filter(Boolean);
  }, [form.segmento, selectedCategory]);

  const notify = (text) => { setMessage(text); window.setTimeout(() => setMessage(''), 2600); };
  const closeForm = () => { setEditingId(null); setForm(makeEmptyForm(categorias)); };
  const startCreate = () => { setEditingId('new'); setForm(makeEmptyForm(categorias)); window.scrollTo({ top: 0, behavior: 'smooth' }); };
  const startEdit = (product) => { setEditingId(product.id); setForm(productToForm(product, categorias)); window.scrollTo({ top: 0, behavior: 'smooth' }); };

  const handleChange = ({ target }) => {
    if (target.name === 'categoria') {
      const nextCategory = categorias.find((category) => category.nombre === target.value) || firstCategory(categorias);
      setForm((current) => ({
        ...current,
        categoria: target.value,
        segmento: nextCategory.subcategorias[0] || 'General',
      }));
      return;
    }

    setForm((current) => ({
      ...current,
      [target.name]: target.type === 'checkbox' ? target.checked : target.value,
    }));
  };

  const handlePhoto = async (event) => {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;
    if (files.some((file) => !file.type.startsWith('image/'))) {
      window.alert('Selecciona imagenes JPG, PNG o WebP.');
      return;
    }
    if (files.some((file) => file.size > 10 * 1024 * 1024)) {
      window.alert('Cada imagen debe pesar como maximo 10 MB.');
      return;
    }

    setUploading(true);
    try {
      const optimized = await Promise.all(files.slice(0, 6).map(async (file) => {
        const localImage = await optimizeImage(file);
        if (!adminToken) return localImage;
        return uploadToCloudinary(localImage, adminToken);
      }));
      setForm((current) => {
        const imagenes = [...productImages(current), ...optimized].slice(0, 6);
        return { ...current, imagenes, imagen: imagenes[0] || '' };
      });
      notify(adminToken ? 'Imagenes subidas a Cloudinary.' : 'Imagenes preparadas solo para esta sesion local.');
    } catch (error) {
      window.alert(error.message || 'No se pudo subir una imagen. Revisa Cloudinary e intenta de nuevo.');
    } finally {
      setUploading(false);
      event.target.value = '';
    }
  };

  const removePhoto = (index) => {
    setForm((current) => {
      const imagenes = productImages(current).filter((_, imageIndex) => imageIndex !== index);
      return { ...current, imagenes, imagen: imagenes[0] || '' };
    });
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const product = normalizeForm(form);
    if (adminToken && hasTemporaryImages(product)) {
      window.alert('Hay imagenes temporales sin subir a Cloudinary. Vuelve a subirlas antes de guardar.');
      return;
    }

    if (editingId === 'new') {
      onAddProduct(product);
      notify('Producto publicado.');
    } else {
      onUpdateProduct({ ...product, id: editingId });
      notify('Cambios guardados.');
    }
    closeForm();
  };

  const handleDelete = (product) => {
    if (window.confirm(`Eliminar "${product.nombre}" del catalogo?`)) {
      onDeleteProduct(product.id);
      notify('Producto eliminado.');
    }
  };

  const handleReset = () => {
    if (window.confirm('Esto reemplazara tu catalogo actual por los productos de demostracion.')) {
      onResetProducts();
      closeForm();
      notify('Catalogo restaurado.');
    }
  };

  const handleExport = () => {
    const payload = { version: 2, productos, categorias };
    const url = URL.createObjectURL(new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `catalogo-consulta-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
    notify('Respaldo descargado.');
  };

  const handleImport = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    try {
      const parsed = JSON.parse(await file.text());
      const importedProducts = Array.isArray(parsed) ? parsed : parsed.productos;
      if (!Array.isArray(importedProducts) || !importedProducts.every((item) => item.id != null && item.nombre && (item.precio == null || item.precio === '' || Number.isFinite(Number(item.precio))) && Array.isArray(item.notas))) {
        throw new Error();
      }
      onImportProducts(importedProducts);
      if (!Array.isArray(parsed) && Array.isArray(parsed.categorias)) onImportCategories(parsed.categorias);
      closeForm();
      notify('Catalogo importado.');
    } catch {
      window.alert('Selecciona un respaldo JSON valido de este catalogo.');
    } finally {
      event.target.value = '';
    }
  };

  const handleCategorySubmit = (event) => {
    event.preventDefault();
    const nombre = categoryForm.nombre.trim();
    const subcategorias = categoryForm.subcategorias.split(',').map((item) => item.trim()).filter(Boolean);
    if (!nombre) return;
    onAddCategory({ nombre, subcategorias: subcategorias.length ? subcategorias : ['General'] });
    setCategoryForm({ nombre: '', subcategorias: '' });
    notify('Categoria agregada.');
  };

  const handleSubcategoryAdd = (category) => {
    const value = (subcategoryDrafts[category.nombre] || '').trim();
    if (!value) return;
    onUpdateCategory({ ...category, subcategorias: [...new Set([...category.subcategorias, value])] });
    setSubcategoryDrafts((current) => ({ ...current, [category.nombre]: '' }));
    notify('Subcategoria agregada.');
  };

  const handleSubcategoryRemove = (category, subcategory) => {
    const inUse = productos.some((product) => product.categoria === category.nombre && product.segmento === subcategory);
    if (inUse) {
      window.alert('No puedes eliminar una subcategoria que tiene productos. Cambia esos productos primero.');
      return;
    }
    onUpdateCategory({ ...category, subcategorias: category.subcategorias.filter((item) => item !== subcategory) });
  };

  const handleCategoryDelete = (category) => {
    const inUse = productos.some((product) => product.categoria === category.nombre);
    if (inUse) {
      window.alert('No puedes eliminar una categoria que tiene productos. Cambia esos productos primero.');
      return;
    }
    if (window.confirm(`Eliminar la categoria "${category.nombre}"?`)) onDeleteCategory(category.nombre);
  };

  return (
    <main className="admin-dashboard">
      <aside className="admin-sidebar">
        <div className="admin-brand"><img src="/assets/beaulyx-logo.jpg" alt="" /><div><strong>BEAULYX</strong><small>Administracion</small></div></div>
        <nav aria-label="Navegacion del administrador">
          <button className="active" type="button"><span>01</span> Resumen</button>
          <button type="button" onClick={() => document.getElementById('inventario')?.scrollIntoView()}><span>02</span> Inventario</button>
          <button type="button" onClick={startCreate}><span>03</span> Nuevo producto</button>
          <button type="button" onClick={() => document.getElementById('categorias')?.scrollIntoView()}><span>04</span> Categorias</button>
        </nav>
        <div className="admin-sidebar-bottom">
          <small>CATALOGO PUBLICO</small>
          <button type="button" onClick={onBack}>Volver al catalogo</button>
          {onLogout && <button type="button" onClick={onLogout}>Cerrar sesion</button>}
        </div>
      </aside>

      <section className="admin-workspace">
        {message && <div className="admin-toast" role="status">{message}</div>}
        <header className="admin-topbar"><div><small>PANEL DE CONTROL</small><strong>Catalogo de consulta</strong></div><div className="admin-avatar">BX</div></header>

        <div className="admin-content">
          <div className="admin-heading">
            <div><p>BEAULYX</p><h1>Resumen del catalogo</h1><span>Gestiona productos, categorias, stock y fotos para consulta por WhatsApp.</span></div>
            <button className="admin-primary" type="button" onClick={startCreate}>+ Agregar producto</button>
          </div>

          <div className="admin-stats">
            <article><span>PRODUCTOS</span><strong>{productos.length}</strong><small>{productos.filter((p) => p.activo !== false).length} visibles</small></article>
            <article><span>CATEGORIAS</span><strong>{categorias.length}</strong><small>grupos configurados</small></article>
            <article><span>VALOR REFERENCIAL</span><strong>{hasPricedProducts ? `S/ ${catalogValue.toFixed(0)}` : 'Consultar'}</strong><small>precio x existencias</small></article>
            <article className={lowStock ? 'warning' : ''}><span>ATENCION</span><strong>{lowStock}</strong><small>productos con stock bajo</small></article>
          </div>

          {isOpen && (
            <form className="admin-form" onSubmit={handleSubmit}>
              <div className="admin-form-title"><div><strong>{editingId === 'new' ? 'Nuevo producto' : 'Editar producto'}</strong><span>Informacion visible para tus clientes</span></div><button type="button" onClick={closeForm}>Cerrar</button></div>
              <div className="admin-image-field">
                <div className="admin-gallery-preview">
                  {formImages.length ? formImages.map((image, index) => (
                    <figure key={image}>
                      <img src={image} alt={`Vista ${index + 1}`} />
                      <button type="button" onClick={() => removePhoto(index)}>Quitar</button>
                    </figure>
                  )) : (
                    <div className="admin-image-preview"><ProductBottleSVG producto={{ ...form, id: 'preview', nombre: form.nombre || 'Tu producto' }} /></div>
                  )}
                </div>
                <input ref={photoInput} className="visually-hidden" type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={handlePhoto} />
                <button type="button" onClick={() => photoInput.current.click()} disabled={uploading}>{uploading ? 'Procesando...' : 'Subir fotos'}</button>
                <small>Hasta 6 imagenes JPG, PNG o WebP. Maximo 10 MB cada una.</small>
              </div>
              <div className="admin-fields">
                <label>Nombre<input name="nombre" value={form.nombre} onChange={handleChange} required /></label>
                <label>Categoria<select name="categoria" value={form.categoria} onChange={handleChange}>{categorias.map((category) => <option key={category.nombre}>{category.nombre}</option>)}</select></label>
                <label>Subcategoria<select name="segmento" value={form.segmento} onChange={handleChange}>{subcategoryOptions.map((subcategory) => <option key={subcategory}>{subcategory}</option>)}</select></label>
                <label>Precio referencial<input name="precio" type="number" step="0.01" min="0" value={form.precio} onChange={handleChange} placeholder="Opcional" /></label>
                <label>Precio anterior<input name="precioAntes" type="number" step="0.01" min="0" value={form.precioAntes} onChange={handleChange} placeholder="Opcional" /></label>
                <label>Stock<input name="stock" type="number" min="0" value={form.stock} onChange={handleChange} required /></label>
                <label>Tamano<input name="ml" value={form.ml} onChange={handleChange} required /></label>
                <label>Intensidad / tipo<input name="intensidad" value={form.intensidad} onChange={handleChange} required /></label>
                <label>Color guia<input name="color" type="color" value={form.color} onChange={handleChange} /></label>
                <label className="wide">Descripcion<textarea name="descripcion" value={form.descripcion} onChange={handleChange} required /></label>
                <label className="wide">Notas o detalles<input name="notas" value={form.notas} onChange={handleChange} placeholder="Rosa, vainilla, ambar" required /></label>
                <div className="admin-toggles wide"><label><input name="activo" type="checkbox" checked={form.activo} onChange={handleChange} /> Visible en catalogo</label><label><input name="destacado" type="checkbox" checked={form.destacado} onChange={handleChange} /> Producto destacado</label></div>
                <button className="admin-submit wide" type="submit" disabled={uploading}>{editingId === 'new' ? 'Publicar producto' : 'Guardar cambios'}</button>
              </div>
            </form>
          )}

          <section className="category-panel" id="categorias">
            <div className="inventory-head"><div><p>CATEGORIAS</p><h2>Organizacion del catalogo</h2></div></div>
            <form className="category-form" onSubmit={handleCategorySubmit}>
              <label>Nueva categoria<input value={categoryForm.nombre} onChange={(event) => setCategoryForm((current) => ({ ...current, nombre: event.target.value }))} placeholder="Joyeria, maquillaje, cuidado..." /></label>
              <label>Subcategorias<input value={categoryForm.subcategorias} onChange={(event) => setCategoryForm((current) => ({ ...current, subcategorias: event.target.value }))} placeholder="Mujer, Hombre, Unisex" /></label>
              <button type="submit">Agregar categoria</button>
            </form>
            <div className="category-list">
              {categorias.map((category) => (
                <article key={category.nombre}>
                  <div className="category-row">
                    <div><strong>{category.nombre}</strong><span>{category.subcategorias.length || 0} subcategorias</span></div>
                    <button type="button" onClick={() => handleCategoryDelete(category)}>Eliminar</button>
                  </div>
                  <div className="category-tags">
                    {category.subcategorias.map((subcategory) => (
                      <button key={subcategory} type="button" onClick={() => handleSubcategoryRemove(category, subcategory)}>
                        {subcategory} x
                      </button>
                    ))}
                  </div>
                  <div className="subcategory-add">
                    <input
                      value={subcategoryDrafts[category.nombre] || ''}
                      onChange={(event) => setSubcategoryDrafts((current) => ({ ...current, [category.nombre]: event.target.value }))}
                      placeholder="Agregar subcategoria"
                    />
                    <button type="button" onClick={() => handleSubcategoryAdd(category)}>Agregar</button>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="inventory-panel" id="inventario">
            <div className="inventory-head"><div><p>CATALOGO</p><h2>Inventario de productos</h2></div><div><button type="button" onClick={handleExport}>Exportar</button><button type="button" onClick={() => backupInput.current.click()}>Importar</button><input ref={backupInput} className="visually-hidden" type="file" accept="application/json" onChange={handleImport} /></div></div>
            <div className="inventory-table">
              <div className="inventory-columns"><span>Producto</span><span>Categoria</span><span>Subcategoria</span><span>Precio</span><span>Stock</span><span>Estado</span><span>Acciones</span></div>
              {productos.map((product) => <article key={product.id} className={product.activo === false ? 'is-hidden' : ''}>
                <div className="inventory-product">{product.imagen ? <img src={product.imagen} alt="" /> : <span style={{ background: product.color }} />}<strong>{product.nombre}</strong></div>
                <span>{product.categoria}</span><span>{product.segmento}</span><strong>{productPriceLabel(product)}</strong><span>{product.stock} uds.</span>
                <span className={`status ${product.stock === 0 ? 'out' : product.stock <= 3 ? 'low' : ''}`}>{product.activo === false ? 'Oculto' : product.stock === 0 ? 'Agotado' : 'Activo'}</span>
                <div className="inventory-actions"><button type="button" onClick={() => startEdit(product)}>Editar</button><button className="delete" type="button" onClick={() => handleDelete(product)}>Eliminar</button></div>
              </article>)}
            </div>
            <button className="restore-button" type="button" onClick={handleReset}>Restaurar catalogo de demostracion</button>
          </section>
        </div>
      </section>
    </main>
  );
}
