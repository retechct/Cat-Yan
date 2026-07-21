import React, { useMemo } from 'react';
import { consultaPriceLine, hasReferencePrice, productPriceLabel } from '../utils/pricing';
import './ConsultationDrawer.css';

const PHONE = '51961678632';

function buildMessage(items) {
  const lines = items.map(({ product, quantity }) => (
    `- ${quantity} x ${product.nombre} (${product.categoria}${product.segmento ? ` / ${product.segmento}` : ''}, ${product.ml}) - ${consultaPriceLine(product)}`
  ));

  return encodeURIComponent([
    'Hola, quiero consultar disponibilidad de estos productos:',
    ...lines,
    '',
    'Tambien quisiera confirmar total, entrega y recomendaciones antes de coordinar.',
  ].join('\n'));
}

export default function ConsultationDrawer({ open, productos, items, onClose, onUpdateQuantity, onRemove, onClear }) {
  const consultaItems = useMemo(() => items
    .map((item) => ({
      ...item,
      product: productos.find((product) => product.id === item.productId),
    }))
    .filter((item) => item.product), [items, productos]);

  const totalReferencial = consultaItems.reduce((total, item) => (
    total + Number(item.product.precio || 0) * item.quantity
  ), 0);
  const hasAnyPrice = consultaItems.some((item) => hasReferencePrice(item.product));
  const hasMissingPrice = consultaItems.some((item) => !hasReferencePrice(item.product));

  const whatsappUrl = consultaItems.length
    ? `https://wa.me/${PHONE}?text=${buildMessage(consultaItems)}`
    : '';

  return (
    <div className={`consulta-layer ${open ? 'is-open' : ''}`} aria-hidden={!open}>
      <button className="consulta-scrim" type="button" onClick={onClose} tabIndex={open ? 0 : -1}>
        Cerrar consulta
      </button>

      <aside className="consulta-drawer" aria-label="Consulta por WhatsApp">
        <header>
          <div>
            <p>Consulta</p>
            <h2>Productos elegidos</h2>
          </div>
          <button type="button" onClick={onClose}>Cerrar</button>
        </header>

        {consultaItems.length > 0 ? (
          <>
            <div className="consulta-list">
              {consultaItems.map(({ product, quantity }) => (
                <article key={product.id}>
                  <div className="consulta-thumb">
                    {product.imagen ? <img src={product.imagen} alt="" /> : <span style={{ background: product.color }} />}
                  </div>

                  <div className="consulta-info">
                    <strong>{product.nombre}</strong>
                    <span>{product.categoria}{product.segmento ? ` / ${product.segmento}` : ''}</span>
                    <small>{productPriceLabel(product, ' ref.')}</small>
                  </div>

                  <div className="consulta-qty">
                    <button type="button" onClick={() => onUpdateQuantity(product.id, quantity - 1)}>-</button>
                    <output>{quantity}</output>
                    <button type="button" onClick={() => onUpdateQuantity(product.id, quantity + 1)} disabled={quantity >= product.stock}>+</button>
                  </div>

                  <button className="consulta-remove" type="button" onClick={() => onRemove(product.id)}>
                    Quitar
                  </button>
                </article>
              ))}
            </div>

            <footer>
              <div>
                <span>{hasMissingPrice ? 'Total referencial parcial' : 'Total referencial'}</span>
                <strong>{hasAnyPrice ? `S/ ${totalReferencial.toFixed(2)}` : 'Por confirmar'}</strong>
              </div>
              <p>No es una compra automatica. La disponibilidad, entrega y total se confirman por WhatsApp.</p>
              <a className="consulta-whatsapp" href={whatsappUrl} target="_blank" rel="noreferrer">
                Consultar todo por WhatsApp
              </a>
              <button className="consulta-clear" type="button" onClick={onClear}>
                Vaciar consulta
              </button>
            </footer>
          </>
        ) : (
          <div className="consulta-empty">
            <h3>Aun no agregaste productos.</h3>
            <p>Abre una ficha y usa "Anadir a consulta" para armar tu mensaje.</p>
          </div>
        )}
      </aside>
    </div>
  );
}
