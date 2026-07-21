import React, { useState } from 'react';
import './Header.css';

const PHONE_URL = 'https://wa.me/51961678632?text=Hola,%20quiero%20asesoria%20sobre%20los%20productos%20disponibles.';

export default function Header({ busqueda, setBusqueda, consultaCount, onOpenConsulta }) {
  const [menuOpen, setMenuOpen] = useState(false);

  const closeMenu = () => setMenuOpen(false);

  return (
    <>
      <div className="luxury-bar">
        <span>Catalogo independiente</span>
        <i />
        <span>Asesoria personalizada</span>
        <i />
        <span>Consulta por WhatsApp</span>
      </div>

      <header className="header">
        <div className="header-inner">
          <a className="brand" href="#inicio" aria-label="Ir al inicio">
            <img src="/assets/beaulyx-logo.jpg" alt="" />
            <span><strong>BEAULYX</strong><small>Catalogo personal</small></span>
          </a>

          <nav className="header-nav" aria-label="Navegacion principal">
            <a href="#inicio">Inicio</a>
            <a href="#catalogo">Coleccion</a>
            <a href="#catalogo">Categorias</a>
            <a href={PHONE_URL} target="_blank" rel="noreferrer">Asesoria</a>
          </nav>

          <div className="header-tools">
            <span className="header-locale">ES</span>
            <label className="search">
              <span>Buscar</span>
              <input
                type="search"
                placeholder="Rosa, joyeria, unisex..."
                value={busqueda}
                onChange={(event) => setBusqueda(event.target.value)}
              />
            </label>

            <button className="header-consulta" type="button" onClick={onOpenConsulta}>
              Consulta
              <span>{consultaCount}</span>
            </button>

            <button
              className={`header-menu ${menuOpen ? 'is-open' : ''}`}
              type="button"
              aria-label={menuOpen ? 'Cerrar menu' : 'Abrir menu'}
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((open) => !open)}
            >
              <span />
              <span />
              <span />
            </button>
          </div>

          <nav className={`mobile-menu ${menuOpen ? 'is-open' : ''}`} aria-label="Menu movil">
            <a href="#inicio" onClick={closeMenu}>Inicio</a>
            <a href="#catalogo" onClick={closeMenu}>Coleccion</a>
            <a href="#catalogo" onClick={closeMenu}>Categorias</a>
            <a href={PHONE_URL} target="_blank" rel="noreferrer" onClick={closeMenu}>Asesoria</a>
          </nav>
        </div>
      </header>
    </>
  );
}
