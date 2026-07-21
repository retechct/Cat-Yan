import React, { useEffect, useMemo, useState } from 'react';
import ProductBottleSVG from './ProductBottleSVG';
import { productPriceBeforeLabel, productPriceLabel } from '../utils/pricing';
import './ProductDetail.css';

function getGallery(producto) {
  const images = Array.isArray(producto.imagenes) && producto.imagenes.length
    ? producto.imagenes
    : producto.imagen
      ? [producto.imagen]
      : [];

  return images.length ? images.map((src, index) => ({ id: `${producto.id}-${index}`, src })) : [{ id: `${producto.id}-preview`, src: '' }];
}

function ProductVisual({ producto, src, className }) {
  if (src) return <img className={className} src={src} alt={producto.nombre} />;
  return <ProductBottleSVG producto={producto} />;
}

export default function ProductDetail({ producto, onClose, onAddToConsulta, onOpenConsulta }) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const gallery = useMemo(() => getGallery(producto), [producto]);
  const agotado = producto.stock === 0;
  const maxQuantity = Math.max(1, Number(producto.stock || 1));

  useEffect(() => {
    setSelectedIndex(0);
    setQuantity(1);
  }, [producto.id]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onClose();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleAdd = () => {
    onAddToConsulta(producto, quantity, true);
  };

  return (
    <div className="detail-backdrop" onMouseDown={onClose}>
      <section
        className="product-detail"
        role="dialog"
        aria-modal="true"
        aria-labelledby="product-detail-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <button className="detail-close" type="button" onClick={onClose} aria-label="Cerrar detalle">
          Cerrar
        </button>

        <nav className="detail-breadcrumb" aria-label="Ruta del producto">
          <span>Catalogo</span>
          <span>{producto.categoria}</span>
          <span>{producto.nombre}</span>
        </nav>

        <div className="detail-layout">
          <aside className="detail-thumbs" aria-label="Imagenes del producto">
            {gallery.map((item, index) => (
              <button
                key={item.id}
                type="button"
                className={selectedIndex === index ? 'active' : ''}
                onClick={() => setSelectedIndex(index)}
                aria-label={`Ver imagen ${index + 1} de ${producto.nombre}`}
              >
                <ProductVisual producto={producto} src={item.src} className="detail-thumb-image" />
              </button>
            ))}
          </aside>

          <div className="detail-stage">
            <ProductVisual producto={producto} src={gallery[selectedIndex]?.src} className="detail-main-image" />
          </div>

          <article className="detail-info">
            <p className="detail-kicker">{producto.categoria}{producto.segmento ? ` / ${producto.segmento}` : ''}</p>
            <h2 id="product-detail-title">{producto.nombre}</h2>
            <p className="detail-subtitle">{producto.ml} - {producto.intensidad}</p>

            <div className="detail-price">
              {producto.precioAntes && <del>{productPriceBeforeLabel(producto)}</del>}
              <strong>{productPriceLabel(producto)}</strong>
              <span>{producto.precio ? 'Precio referencial para consulta' : 'Precio por confirmar por WhatsApp'}</span>
            </div>

            <div className={`detail-stock ${agotado ? 'is-out' : producto.stock <= 3 ? 'is-low' : 'is-ready'}`}>
              {agotado ? 'Sin stock disponible' : producto.stock <= 3 ? `Ultimas ${producto.stock} unidades` : 'Disponible para consultar'}
            </div>

            <label className="detail-quantity">
              <span>Cantidad para consulta</span>
              <div>
                <button type="button" onClick={() => setQuantity((value) => Math.max(1, value - 1))} disabled={quantity <= 1}>
                  -
                </button>
                <output>{quantity}</output>
                <button type="button" onClick={() => setQuantity((value) => Math.min(maxQuantity, value + 1))} disabled={quantity >= maxQuantity}>
                  +
                </button>
              </div>
            </label>

            <div className="detail-actions">
              <button className="detail-primary" type="button" onClick={handleAdd} disabled={agotado}>
                {agotado ? 'No disponible' : 'Anadir a consulta'}
              </button>
              <button className="detail-secondary" type="button" onClick={onOpenConsulta}>
                Ver consulta
              </button>
            </div>

            <section className="detail-copy">
              <h3>Que es</h3>
              <p>{producto.descripcion}</p>
            </section>

            <div className="detail-notes" aria-label="Notas">
              {producto.notas.map((nota) => (
                <span key={nota}>{nota}</span>
              ))}
            </div>
          </article>
        </div>
      </section>
    </div>
  );
}
