import React, { useEffect, useMemo, useState } from 'react';
import ProductBottleSVG from './ProductBottleSVG';
import { productPriceLabel } from '../utils/pricing';
import './Hero.css';

function getHeroImage(producto, mode = 'main') {
  const images = Array.isArray(producto.imagenes) ? producto.imagenes.filter(Boolean) : [];
  if (!images.length) return producto.imagen;
  if (mode === 'main') return images[2] || images[1] || images[0];
  return images[0] || producto.imagen;
}

function ProductVisual({ producto, className, mode = 'main' }) {
  const image = getHeroImage(producto, mode);

  if (image) {
    return <img className={className} src={image} alt={producto.nombre} />;
  }

  return <ProductBottleSVG producto={producto} />;
}

export default function Hero({ productos, onAddToConsulta, onViewProduct }) {
  const destacados = useMemo(() => {
    const activos = productos.filter((item) => item.activo !== false && item.stock > 0);
    const elegidos = activos.filter((item) => item.destacado);
    return (elegidos.length ? elegidos : activos).slice(0, 3);
  }, [productos]);
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(1);
  const [transitionKey, setTransitionKey] = useState(0);
  const producto = destacados[current] || productos[0];

  useEffect(() => {
    setCurrent((value) => Math.min(value, Math.max(destacados.length - 1, 0)));
  }, [destacados.length]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      if (destacados.length > 1) {
        setDirection(1);
        setTransitionKey((value) => value + 1);
        setCurrent((value) => (value + 1) % destacados.length);
      }
    }, 4200);
    return () => window.clearInterval(timer);
  }, [destacados.length]);

  if (!producto) return null;

  const previousProduct = destacados.length > 1
    ? destacados[(current - 1 + destacados.length) % destacados.length]
    : producto;
  const nextProduct = destacados.length > 1
    ? destacados[(current + 1) % destacados.length]
    : producto;

  const goTo = (direction) => {
    if (destacados.length <= 1) return;
    setDirection(direction);
    setTransitionKey((value) => value + 1);
    setCurrent((value) => (value + direction + destacados.length) % destacados.length);
  };

  const selectProduct = (index) => {
    if (index === current || destacados.length <= 1) return;
    const forward = (index - current + destacados.length) % destacados.length;
    const backward = (current - index + destacados.length) % destacados.length;
    setDirection(forward <= backward ? 1 : -1);
    setTransitionKey((value) => value + 1);
    setCurrent(index);
  };

  return (
    <section className="hero-section" id="inicio" style={{ '--hero-color': producto.color }}>
      <div className={`hero-cinematic ${direction < 0 ? 'is-prev' : 'is-next'}`}>
        <div className="hero-wordmark" aria-hidden="true">BEAULYX</div>
        <div className="hero-ribbon" key={`ribbon-${transitionKey}`} aria-hidden="true" />

        <div className="hero-side-bottle hero-side-left" key={`left-${previousProduct.id}-${transitionKey}`} aria-hidden="true">
          <ProductVisual producto={previousProduct} className="hero-photo" mode="side" />
        </div>
        <div className="hero-side-bottle hero-side-right" key={`right-${nextProduct.id}-${transitionKey}`} aria-hidden="true">
          <ProductVisual producto={nextProduct} className="hero-photo" mode="side" />
        </div>

        <button className="hero-arrow hero-arrow-left" type="button" onClick={() => goTo(-1)} aria-label="Producto anterior">
          <span>&lt;</span>
        </button>
        <button className="hero-arrow hero-arrow-right" type="button" onClick={() => goTo(1)} aria-label="Producto siguiente">
          <span>&gt;</span>
        </button>

        <button className="hero-product" key={`${producto.id}-${transitionKey}`} type="button" onClick={() => onViewProduct(producto)}>
          <ProductVisual producto={producto} className="hero-photo" />
        </button>

        <aside className="hero-info-card" key={`info-${producto.id}-${transitionKey}`}>
          <span>{producto.segmento || producto.categoria}</span>
          <strong>{producto.nombre}</strong>
          <small>{producto.ml} - {producto.intensidad}</small>
          <b>{productPriceLabel(producto, ' ref.')}</b>
        </aside>

        <div className="hero-actions">
          <button className="hero-primary" type="button" onClick={() => onAddToConsulta(producto)}>
            Anadir a consulta
          </button>
          <a className="hero-secondary" href="#catalogo">Ver catalogo</a>
        </div>

        <p className="hero-location">LIMA / Catalogo personal Yanbal</p>

        <div className="hero-copy">
          <p className="eyebrow">Catalogo independiente</p>
          <h1>Productos Yanbal disponibles para consulta personalizada.</h1>
        </div>

        <div className="hero-selector">
          {destacados.map((item, index) => (
            <button
              key={item.id}
              type="button"
              className={index === current ? 'active' : ''}
              onClick={() => selectProduct(index)}
              aria-label={`Ver ${item.nombre}`}
            >
              {String(index + 1).padStart(2, '0')}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
