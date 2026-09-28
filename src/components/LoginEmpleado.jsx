import React, { useState } from 'react';
import { ArrowRight, LockKeyhole } from 'lucide-react';
import { iniciarSesion } from '../services/authService';

export const LoginEmpleado = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setCargando(true);

    try {
      await iniciarSesion(email, password);
    } catch (loginError) {
      setError('No se pudo iniciar sesión. Verifique sus credenciales e inténtelo de nuevo.');
    } finally {
      setCargando(false);
    }
  };

  return (
    <section style={styles.panel} aria-labelledby="employee-login-title">
      <div style={styles.icon}><LockKeyhole size={22} /></div>
      <p style={styles.eyebrow}>Panadería San Carlos</p>
      <h1 id="employee-login-title" style={styles.title}>Acceso de empleados</h1>
      <p style={styles.subtitle}>Ingrese con la cuenta asignada por la gerencia.</p>

      {error && <div style={styles.error} role="alert">{error}</div>}

      <form onSubmit={handleSubmit}>
        <label style={styles.label} htmlFor="employee-email">Correo electrónico</label>
        <input
          id="employee-email"
          type="email"
          autoComplete="username"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          style={styles.input}
          required
        />

        <label style={styles.label} htmlFor="employee-password">Contraseña</label>
        <input
          id="employee-password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          style={styles.input}
          required
        />

        <button type="submit" style={styles.submit} disabled={cargando}>
          {cargando ? 'Verificando...' : <>Iniciar sesión <ArrowRight size={16} /></>}
        </button>
      </form>
    </section>
  );
};

const styles = {
  panel: {
    width: '100%',
    maxWidth: '390px',
    padding: '2rem',
    backgroundColor: '#ffffff',
    border: '1px solid #e2e8f0',
    borderTop: '4px solid #b45309',
    borderRadius: '8px',
    boxShadow: '0 16px 40px rgba(15, 23, 42, 0.08)',
    boxSizing: 'border-box'
  },
  icon: { color: '#b45309', marginBottom: '1.25rem' },
  eyebrow: { margin: '0 0 0.4rem', color: '#64748b', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase' },
  title: { margin: '0 0 0.4rem', color: '#172033', fontSize: '1.4rem' },
  subtitle: { margin: '0 0 1.5rem', color: '#64748b', fontSize: '0.9rem' },
  label: { display: 'block', marginBottom: '0.4rem', color: '#334155', fontSize: '0.85rem', fontWeight: 600 },
  input: { width: '100%', boxSizing: 'border-box', padding: '0.75rem', marginBottom: '1rem', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.95rem' },
  submit: { width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', padding: '0.8rem', marginTop: '0.25rem', color: '#ffffff', backgroundColor: '#9a3412', border: 'none', borderRadius: '6px', fontSize: '0.95rem', fontWeight: 700, cursor: 'pointer' },
  error: { padding: '0.75rem', marginBottom: '1rem', color: '#991b1b', backgroundColor: '#fee2e2', borderRadius: '6px', fontSize: '0.85rem' }
};