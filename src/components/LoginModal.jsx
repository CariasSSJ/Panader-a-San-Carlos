import React, { useState } from 'react';
import { iniciarSesion } from '../services/authService';
import { ArrowRight, LockKeyhole, X } from 'lucide-react';

export const LoginModal = ({ isOpen, onClose, onLoginExitoso }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setCargando(true);

    try {
      const user = await iniciarSesion(email, password);
      onLoginExitoso(user);
      onClose();
    } catch (err) {
      setError('Credenciales inválidas. Verifique su correo y contraseña.');
    } finally {
      setCargando(false);
    }
  };

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <div style={styles.header}>
          <h3 style={styles.title}><LockKeyhole size={19} /> Acceso de Gerencia / Producción</h3>
          <button onClick={onClose} style={styles.btnClose} aria-label="Cerrar"><X size={18} /></button>
        </div>
        <p style={styles.subtitle}>Inicie sesión como Sr. Kevin Gálvez o Gerente para acceder al Panel de Producción.</p>

        {error && <div style={styles.alertError}>{error}</div>}

        <form onSubmit={handleSubmit}>
          <div style={styles.field}>
            <label style={styles.label}>Correo Electrónico:</label>
            <input
              type="email"
              placeholder="ej. kevin.galvez@panaderia.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={styles.input}
              required
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Contraseña:</label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={styles.input}
              required
            />
          </div>

          <button type="submit" style={styles.btnSubmit} disabled={cargando}>
            {cargando ? 'Autenticando...' : <><span>Iniciar Sesión</span><ArrowRight size={16} /></>}
          </button>
        </form>
      </div>
    </div>
  );
};

const styles = {
  overlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.75)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 },
  modal: { backgroundColor: '#ffffff', padding: '2rem', borderRadius: '12px', width: '90%', maxWidth: '420px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' },
  title: { display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0, color: '#172033', fontSize: '1.05rem' },
  btnClose: { background: '#f1f5f9', border: 'none', display: 'grid', placeItems: 'center', width: '32px', height: '32px', borderRadius: '6px', cursor: 'pointer', color: '#64748b' },
  subtitle: { fontSize: '0.85rem', color: '#64748b', marginBottom: '1.5rem' },
  field: { display: 'flex', flexDirection: 'column', gap: '0.4rem', marginBottom: '1.2rem' },
  label: { fontSize: '0.85rem', fontWeight: 'bold', color: '#334155' },
  input: { padding: '0.75rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.95rem' },
  btnSubmit: { width: '100%', padding: '0.8rem', backgroundColor: '#2563eb', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '1rem', marginTop: '0.5rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', transition: 'background-color 0.15s ease' },
  alertError: { backgroundColor: '#fee2e2', color: '#991b1b', padding: '0.75rem', borderRadius: '6px', fontSize: '0.85rem', marginBottom: '1rem' }
};