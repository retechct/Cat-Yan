import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Header from './components/Header';
import Hero from './components/Hero';
import ProductCard from './components/ProductCard';
import ProductDetail from './components/ProductDetail';
import ConsultationDrawer from './components/ConsultationDrawer';
import AdminPanel from './components/AdminPanel';
import AdminLogin from './components/AdminLogin';
import productosBase, { categoriasBase } from './data/productos';
import {
  ADMIN_TOKEN_STORAGE_KEY,
  fetchRemoteCatalog,
  isLocalHost,
  loginAdmin,
  saveRemoteCatalog,
} from './utils/catalogApi';
import './styles/global.css';
import './App.css';

const DATA_VERSION = 'v4-productos-webp';
const PRODUCT_STORAGE_KEY = `beaulyx-products-${DATA_VERSION}`;
const CATEGORY_STORAGE_KEY = `beaulyx-categories-${DATA_VERSION}`;
const CONSULTA_STORAGE_KEY = `beaulyx-consulta-${DATA_VERSION}`;
const LEGACY_STORAGE_KEYS = [
  'beaulyx-products',
  'beaulyx-categories',
  'beaulyx-consulta',
  'beaulyx-products-v2',
  'beaulyx-categories-v2',
  'beaulyx-consulta-v2',
  'beaulyx-products-v3-productos-reales',
  'beaulyx-categories-v3-productos-reales',
  'beaulyx-consulta-v3-productos-reales',
];
const legacySegments = ['Mujer', 'Hombre', 'Unisex'];

function slugify(text) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '') || `categoria-${Date.now()}`;
}

function normalizeCategories(categories) {
  const source = Array.isArray(categories) && categories.length ? categories : categoriasBase;
  const seen = new Set();

  return source.reduce((result, category) => {
    const nombre = String(category?.nombre || category || '').trim();
    if (!nombre) return result;
    const key = nombre.toLowerCase();
    if (seen.has(key)) return result;
    seen.add(key);

    const subcategorias = Array.isArray(category?.subcategorias)
      ? category.subcategorias
      : [];

    result.push({
      id: category?.id || slugify(nombre),
      nombre,
      subcategorias: [...new Set(subcategorias.map((item) => String(item).trim()).filter(Boolean))],
    });

    return result;
  }, []);
}

function normalizeProduct(product) {
  const legacyCategory = legacySegments.includes(product.categoria);
  const categoria = String(legacyCategory ? 'Perfumes' : product.categoria || 'Perfumes');
  const segmento = String(product.segmento || product.subcategoria || (legacyCategory ? product.categoria : 'General'));
  const precio = product.precio === '' || product.precio == null ? null : Number(product.precio);
  const precioAntes = product.precioAntes === '' || product.precioAntes == null ? null : Number(product.precioAntes);
  const imagenes = Array.isArray(product.imagenes)
    ? product.imagenes.filter(Boolean)
    : product.imagen
      ? [product.imagen]
      : [];

  return {
    ...product,
    nombre: String(product.nombre || ''),
    categoria,
    segmento,
    ml: String(product.ml || ''),
    intensidad: String(product.intensidad || ''),
    descripcion: String(product.descripcion || ''),
    color: product.color || '#b76e79',
    imagen: product.imagen || imagenes[0] || '',
    imagenes,
    precio: Number.isFinite(precio) && precio > 0 ? precio : null,
    precioAntes: Number.isFinite(precioAntes) && precioAntes > 0 ? precioAntes : null,
    stock: Number(product.stock || 0),
    notas: Array.isArray(product.notas) ? product.notas : [],
  };
}

function loadProducts() {
  try {
    const saved = window.localStorage.getItem(PRODUCT_STORAGE_KEY);
    const products = saved ? JSON.parse(saved) : productosBase;
    return Array.isArray(products) ? products.map(normalizeProduct) : productosBase.map(normalizeProduct);
  } catch {
    return productosBase.map(normalizeProduct);
  }
}

function loadCategories() {
  try {
    const saved = window.localStorage.getItem(CATEGORY_STORAGE_KEY);
    return normalizeCategories(saved ? JSON.parse(saved) : categoriasBase);
  } catch {
    return normalizeCategories(categoriasBase);
  }
}

function loadConsulta() {
  try {
    const saved = window.localStorage.getItem(CONSULTA_STORAGE_KEY);
    const items = saved ? JSON.parse(saved) : [];
    return Array.isArray(items) ? items.filter((item) => item.productId && item.quantity > 0) : [];
  } catch {
    return [];
  }
}

function loadAdminToken() {
  try {
    return window.localStorage.getItem(ADMIN_TOKEN_STORAGE_KEY) || '';
  } catch {
    return '';
  }
}

function getViewFromHash() {
  return window.location.hash === '#admin' ? 'admin' : 'catalog';
}

export default function App() {
  const [productos, setProductos] = useState(loadProducts);
  const [categorias, setCategorias] = useState(loadCategories);
  const [filtroCategoria, setFiltroCategoria] = useState('Todos');
  const [filtroSegmento, setFiltroSegmento] = useState('Todos');
  const [busqueda, setBusqueda] = useState('');
  const [view, setView] = useState(getViewFromHash);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [consulta, setConsulta] = useState(loadConsulta);
  const [consultaOpen, setConsultaOpen] = useState(false);
  const [toast, setToast] = useState('');
  const [adminToken, setAdminToken] = useState(loadAdminToken);
  const [remoteChecked, setRemoteChecked] = useState(false);
  const [remoteSaveEnabled, setRemoteSaveEnabled] = useState(false);
  const [adminDirtyVersion, setAdminDirtyVersion] = useState(0);
  const saveTimer = useRef(null);

  const notify = useCallback((text) => {
    setToast(text);
    window.setTimeout(() => setToast(''), 2400);
  }, []);

  const applyRemoteCatalog = useCallback((catalog) => {
    if (!catalog) return;
    if (Array.isArray(catalog.productos) && catalog.productos.length) {
      setProductos(catalog.productos.map(normalizeProduct));
    }
    if (Array.isArray(catalog.categorias) && catalog.categorias.length) {
      setCategorias(normalizeCategories(catalog.categorias));
    }
  }, []);

  const markAdminChange = () => {
    setAdminDirtyVersion((version) => version + 1);
  };

  useEffect(() => {
    LEGACY_STORAGE_KEYS.forEach((key) => window.localStorage.removeItem(key));
  }, []);

  useEffect(() => {
    let active = true;
    fetchRemoteCatalog()
      .then((catalog) => {
        if (!active) return;
        applyRemoteCatalog(catalog);
        setRemoteSaveEnabled(true);
      })
      .catch(() => {
        if (active) setRemoteSaveEnabled(false);
      })
      .finally(() => {
        if (active) setRemoteChecked(true);
      });

    return () => {
      active = false;
    };
  }, [applyRemoteCatalog]);

  useEffect(() => {
    window.localStorage.setItem(PRODUCT_STORAGE_KEY, JSON.stringify(productos));
  }, [productos]);

  useEffect(() => {
    window.localStorage.setItem(CATEGORY_STORAGE_KEY, JSON.stringify(categorias));
  }, [categorias]);

  useEffect(() => {
    window.localStorage.setItem(CONSULTA_STORAGE_KEY, JSON.stringify(consulta));
  }, [consulta]);

  useEffect(() => {
    const handleHashChange = () => setView(getViewFromHash());
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const categoriasCatalogo = useMemo(() => {
    const byName = new Map(categorias.map((category) => [category.nombre, { ...category }]));

    productos.forEach((product) => {
      if (!product.categoria) return;
      const existing = byName.get(product.categoria);
      if (existing) {
        if (product.segmento && !existing.subcategorias.includes(product.segmento)) {
          existing.subcategorias = [...existing.subcategorias, product.segmento];
        }
      } else {
        byName.set(product.categoria, {
          id: slugify(product.categoria),
          nombre: product.categoria,
          subcategorias: product.segmento ? [product.segmento] : [],
        });
      }
    });

    return [...byName.values()];
  }, [categorias, productos]);

  useEffect(() => {
    if (!adminToken || !remoteSaveEnabled || adminDirtyVersion === 0) return undefined;

    window.clearTimeout(saveTimer.current);
    saveTimer.current = window.setTimeout(() => {
      saveRemoteCatalog({ productos, categorias: categoriasCatalogo }, adminToken).catch((error) => {
        if (error.status === 401) {
          window.localStorage.removeItem(ADMIN_TOKEN_STORAGE_KEY);
          setAdminToken('');
          notify('Sesion expirada. Vuelve a entrar al administrador.');
          return;
        }

        notify(error.message || 'No se pudo guardar en la nube. Revisa Neon o Vercel.');
      });
    }, 650);

    return () => window.clearTimeout(saveTimer.current);
  }, [adminDirtyVersion, adminToken, categoriasCatalogo, notify, productos, remoteSaveEnabled]);

  const segmentosDisponibles = useMemo(() => {
    if (filtroCategoria === 'Todos') return [];
    const category = categoriasCatalogo.find((item) => item.nombre === filtroCategoria);
    return category ? ['Todos', ...category.subcategorias] : ['Todos'];
  }, [categoriasCatalogo, filtroCategoria]);

  const handleAdminLogin = async (password) => {
    const token = await loginAdmin(password);
    if (!isLocalHost() && !remoteSaveEnabled) {
      const catalog = await fetchRemoteCatalog();
      applyRemoteCatalog(catalog);
      setRemoteSaveEnabled(true);
      setRemoteChecked(true);
    }
    window.localStorage.setItem(ADMIN_TOKEN_STORAGE_KEY, token);
    setAdminToken(token);
  };

  const handleAdminLogout = () => {
    window.localStorage.removeItem(ADMIN_TOKEN_STORAGE_KEY);
    setAdminToken('');
  };

  const handleAddProduct = (product) => {
    setProductos((current) => [{ id: Date.now(), ...normalizeProduct(product) }, ...current]);
    markAdminChange();
  };

  const handleDeleteProduct = (id) => {
    setProductos((current) => current.filter((product) => product.id !== id));
    markAdminChange();
  };

  const handleUpdateProduct = (updatedProduct) => {
    setProductos((current) => current.map((product) => (
      product.id === updatedProduct.id ? normalizeProduct(updatedProduct) : product
    )));
    markAdminChange();
  };

  const handleImportProducts = (importedProducts) => {
    setProductos(importedProducts.map(normalizeProduct));
    markAdminChange();
  };

  const handleImportCategories = (importedCategories) => {
    setCategorias(normalizeCategories(importedCategories));
    markAdminChange();
  };

  const handleResetProducts = () => {
    setProductos(productosBase.map(normalizeProduct));
    setCategorias(normalizeCategories(categoriasBase));
    setFiltroCategoria('Todos');
    setFiltroSegmento('Todos');
    setBusqueda('');
    setConsulta([]);
    markAdminChange();
  };

  const handleCategoryFilter = (category) => {
    setFiltroCategoria(category);
    setFiltroSegmento('Todos');
  };

  const handleAddCategory = (category) => {
    setCategorias((current) => {
      const incoming = normalizeCategories([category])[0];
      if (!incoming) return current;
      const exists = current.find((item) => item.nombre.toLowerCase() === incoming.nombre.toLowerCase());
      if (!exists) return [...current, incoming];

      return current.map((item) => (
        item.nombre.toLowerCase() === incoming.nombre.toLowerCase()
          ? { ...item, subcategorias: [...new Set([...item.subcategorias, ...incoming.subcategorias])] }
          : item
      ));
    });
    markAdminChange();
  };

  const handleUpdateCategory = (updatedCategory) => {
    setCategorias((current) => {
      const cleanCategory = {
        id: updatedCategory.id || slugify(updatedCategory.nombre),
        nombre: updatedCategory.nombre,
        subcategorias: [...new Set(updatedCategory.subcategorias.filter(Boolean))],
      };
      const exists = current.some((category) => category.nombre === updatedCategory.nombre);
      if (!exists) return [...current, cleanCategory];

      return current.map((category) => (
        category.nombre === updatedCategory.nombre ? { ...category, ...cleanCategory } : category
      ));
    });
    markAdminChange();
  };

  const handleDeleteCategory = (categoryName) => {
    setCategorias((current) => current.filter((category) => category.nombre !== categoryName));
    markAdminChange();
  };

  const addToConsulta = (product, quantity = 1, openDrawer = false) => {
    if (!product || product.stock === 0) return;

    setConsulta((current) => {
      const existing = current.find((item) => item.productId === product.id);
      if (existing) {
        return current.map((item) => (
          item.productId === product.id
            ? { ...item, quantity: Math.min(Number(product.stock || 99), item.quantity + quantity) }
            : item
        ));
      }

      return [...current, { productId: product.id, quantity: Math.min(Number(product.stock || 99), quantity) }];
    });

    notify(`${product.nombre} agregado a tu consulta.`);
    if (openDrawer) setConsultaOpen(true);
  };

  const updateConsultaQuantity = (productId, quantity) => {
    if (quantity <= 0) {
      setConsulta((current) => current.filter((item) => item.productId !== productId));
      return;
    }

    const product = productos.find((item) => item.id === productId);
    const max = product?.stock || 99;
    setConsulta((current) => current.map((item) => (
      item.productId === productId ? { ...item, quantity: Math.min(max, quantity) } : item
    )));
  };

  const removeFromConsulta = (productId) => {
    setConsulta((current) => current.filter((item) => item.productId !== productId));
  };

  const productosFiltrados = useMemo(() => {
    const query = busqueda.trim().toLowerCase();

    return productos.filter((producto) => {
      if (producto.activo === false) return false;
      const coincideCategoria = filtroCategoria === 'Todos' || producto.categoria === filtroCategoria;
      const coincideSegmento = filtroSegmento === 'Todos' || producto.segmento === filtroSegmento;
      const coincideBusqueda =
        !query ||
        producto.nombre.toLowerCase().includes(query) ||
        producto.categoria.toLowerCase().includes(query) ||
        producto.segmento.toLowerCase().includes(query) ||
        producto.descripcion.toLowerCase().includes(query) ||
        producto.notas.some((nota) => nota.toLowerCase().includes(query));

      return coincideCategoria && coincideSegmento && coincideBusqueda;
    });
  }, [busqueda, filtroCategoria, filtroSegmento, productos]);

  const consultaCount = consulta.reduce((total, item) => total + item.quantity, 0);

  if (view === 'admin') {
    const adminCloudBlocked = !isLocalHost() && remoteChecked && !remoteSaveEnabled;

    if (!isLocalHost() && (!adminToken || !remoteSaveEnabled)) {
      return (
        <>
          <div className="site-bg" />
          <AdminLogin
            notice={adminCloudBlocked ? 'No se pudo conectar con Neon. Revisa /api/health antes de editar.' : ''}
            onLogin={handleAdminLogin}
            onBack={() => { window.location.hash = ''; }}
          />
        </>
      );
    }

    return (
      <>
        <div className="site-bg" />
        <AdminPanel
          productos={productos}
          categorias={categoriasCatalogo}
          onAddProduct={handleAddProduct}
          onUpdateProduct={handleUpdateProduct}
          onDeleteProduct={handleDeleteProduct}
          onResetProducts={handleResetProducts}
          onImportProducts={handleImportProducts}
          onImportCategories={handleImportCategories}
          onAddCategory={handleAddCategory}
          onUpdateCategory={handleUpdateCategory}
          onDeleteCategory={handleDeleteCategory}
          adminToken={adminToken}
          onLogout={adminToken ? handleAdminLogout : null}
          onBack={() => { window.location.hash = ''; }}
        />
      </>
    );
  }

  return (
    <>
      <div className="site-bg" />
      <Header
        busqueda={busqueda}
        setBusqueda={setBusqueda}
        consultaCount={consultaCount}
        onOpenConsulta={() => setConsultaOpen(true)}
      />
      <Hero
        productos={productos}
        onAddToConsulta={(product) => addToConsulta(product, 1, true)}
        onViewProduct={setSelectedProduct}
      />

      <main className="main" id="catalogo">
        <section className="catalog-head">
          <div>
            <p className="section-kicker">Catalogo personal de consulta</p>
            <h2>Elige por categoria, ocasion o aroma.</h2>
          </div>
          <p>
            {productosFiltrados.length} producto{productosFiltrados.length !== 1 ? 's' : ''} disponible
            {busqueda ? ` para "${busqueda}"` : ''}
          </p>
        </section>

        <section className="catalog-toolbar" aria-label="Filtros del catalogo">
          <nav className="catalog-filters" aria-label="Categorias del catalogo">
            {['Todos', ...categoriasCatalogo.map((category) => category.nombre)].map((cat) => (
              <button
                key={cat}
                type="button"
                className={filtroCategoria === cat ? 'active' : ''}
                onClick={() => handleCategoryFilter(cat)}
              >
                {cat}
              </button>
            ))}
          </nav>

          {segmentosDisponibles.length > 1 && (
            <nav className="catalog-filters sub-filters" aria-label="Subcategorias">
              {segmentosDisponibles.map((segment) => (
                <button
                  key={segment}
                  type="button"
                  className={filtroSegmento === segment ? 'active' : ''}
                  onClick={() => setFiltroSegmento(segment)}
                >
                  {segment}
                </button>
              ))}
            </nav>
          )}
        </section>

        {productosFiltrados.length > 0 ? (
          <section className="grid" aria-label="Lista de productos">
            {productosFiltrados.map((producto, index) => (
              <ProductCard
                key={producto.id}
                producto={producto}
                index={index}
                onViewProduct={setSelectedProduct}
                onAddToConsulta={(product) => addToConsulta(product, 1)}
              />
            ))}
          </section>
        ) : (
          <section className="empty-state">
            <h3>No encontramos ese producto.</h3>
            <p>Prueba con vainilla, joyeria, rostro o cambia la categoria.</p>
          </section>
        )}
      </main>

      <footer className="footer">
        <div>
          <strong>Catalogo personal administrado por una asesora independiente.</strong>
          <span>Este sitio no es la pagina oficial de Yanbal ni esta administrado por Yanbal.</span>
        </div>
        <p>
          Yanbal, sus marcas, nombres de productos, logotipos e imagenes oficiales pertenecen a sus
          respectivos titulares. Los productos mostrados son originales Yanbal adquiridos para venta
          independiente. Al contactarme por WhatsApp, usare tus datos solo para responder tu consulta.
        </p>
      </footer>

      <ConsultationDrawer
        open={consultaOpen}
        productos={productos}
        items={consulta}
        onClose={() => setConsultaOpen(false)}
        onUpdateQuantity={updateConsultaQuantity}
        onRemove={removeFromConsulta}
        onClear={() => setConsulta([])}
      />

      {selectedProduct && (
        <ProductDetail
          producto={selectedProduct}
          onClose={() => setSelectedProduct(null)}
          onAddToConsulta={(product, quantity, openDrawer) => addToConsulta(product, quantity, openDrawer)}
          onOpenConsulta={() => setConsultaOpen(true)}
        />
      )}

      {toast && <div className="app-toast" role="status">{toast}</div>}
    </>
  );
}
