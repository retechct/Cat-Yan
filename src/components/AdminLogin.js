import React, { useState } from 'react';
import './AdminLogin.css';

export default function AdminLogin({ onBack, onLogin }) {
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      await onLogin(password);
    } catch (error) {
      setMessage(error.message || 'No se pudo iniciar sesion.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="admin-login">
      <section>
        <img src="/assets/beaulyx-logo.jpg" alt="" />
        <p>Dashboard privado</p>
        <h1>Acceso al catalogo</h1>
        <form onSubmit={handleSubmit}>
          <label>
            Clave administrativa
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              required
            />
          </label>
          {message && <span role="status">{message}</span>}
          <button type="submit" disabled={loading}>
            {loading ? 'Verificando...' : 'Entrar'}
          </button>
        </form>
        <button className="admin-login-back" type="button" onClick={onBack}>
          Volver al catalogo
        </button>
      </section>
    </main>
  );
}
