import React from 'react';

export const HeaderUMG = ({ sucursalActual }) => {
  return (
    <header style={styles.header}>
      <div style={styles.branding}>
        <div style={styles.logoUmg}>UMG</div>
        <div>
          <h1 style={styles.title}>Panadería San Carlos</h1>
          <p style={styles.subtitle}>Sistema de Control de Producción y Pedidos</p>
        </div>
      </div>
      {sucursalActual && (
        <div style={styles.sucursalBadge}>
          <span>Sucursal: <strong>{sucursalActual}</strong></span>
        </div>
      )}
    </header>
  );
};

const styles = {
  header: {
    backgroundColor: '#1e293b',
    color: '#ffffff',
    padding: '1rem 2rem',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    marginBottom: '2rem'
  },
  branding: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem'
  },
  logoUmg: {
    backgroundColor: '#0284c7',
    color: '#fff',
    fontWeight: 'bold',
    fontSize: '1.2rem',
    padding: '0.5rem 0.8rem',
    borderRadius: '6px',
    letterSpacing: '1px'
  },
  title: {
    margin: 0,
    fontSize: '1.4rem',
    fontWeight: '600'
  },
  subtitle: {
    margin: 0,
    fontSize: '0.85rem',
    color: '#94a3b8'
  },
  sucursalBadge: {
    backgroundColor: '#334155',
    padding: '0.5rem 1rem',
    borderRadius: '20px',
    fontSize: '0.9rem',
    border: '1px solid #475569'
  }
};