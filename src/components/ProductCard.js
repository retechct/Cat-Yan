import React from 'react';
import ProductBottleSVG from './ProductBottleSVG';
import { hasReferencePrice, productPriceBeforeLabel, productPriceLabel } from '../utils/pricing';
import './ProductCard.css';

export default function ProductCard({ producto, index, onViewProduct, onAddToConsulta }) {
  const agotado = producto.stock === 0;
  const bajoStock = producto.stock > 0 && producto.stock <= 3;
  const image = Array.isArray(producto.imagenes) && producto.imagenes.length ? producto.imagenes[0] : producto.imagen;
  const hasPrice = hasReferencePrice(producto);

  return (
    <article className="card" style={{ '--accent': producto.color, animationDelay: `${index * 70}ms` }}>
      <button className="card-media" type="button" onClick={() => onViewProduct(producto)}>
        <span className="card-category">{producto.categoria}</span>
        {producto.segmento && <span className="card-segment">{producto.segmento}</span>}
        {image ? (
          <img className="product-photo" src={image} alt={producto.nombre} loading="lazy" />
        ) : (
          <ProductBottleSVG producto={producto} />
        )}
      </button>

      <div className="card-body">
        <div className="card-heading">
          <div>
            <p className="card-volume">{producto.ml} - {producto.intensidad}</p>
            <h2>{producto.nombre}</h2>
          </div>
          <div className="card-price">
            <span>{productPriceLabel(producto)}</span>
            {producto.precioAntes && <del>{productPriceBeforeLabel(producto)}</del>}
            <small>{hasPrice ? 'Ref.' : 'Por WhatsApp'}</small>
          </div>
        </div>

        <p className="card-description">{producto.descripcion}</p>

        <div className="card-notes" aria-label="Notas olfativas">
          {producto.notas.map((nota) => (
            <span key={nota}>{nota}</span>
          ))}
        </div>

        <div className={`card-stock ${agotado ? 'is-out' : bajoStock ? 'is-low' : 'is-ready'}`}>
          {agotado ? 'Sin stock' : bajoStock ? `Ultimas ${producto.stock} unidades` : 'Disponible para consulta'}
        </div>

        <div className="card-actions">
          <button className="card-action" type="button" onClick={() => onAddToConsulta(producto)} disabled={agotado}>
            {agotado ? 'Agotado' : 'Anadir a consulta'}
          </button>
          <button className="card-view" type="button" onClick={() => onViewProduct(producto)}>
            Ver imagenes
          </button>
        </div>
      </div>
    </article>
  );
}
