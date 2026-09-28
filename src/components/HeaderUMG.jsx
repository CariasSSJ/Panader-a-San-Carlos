import React from 'react';
import { Store } from 'lucide-react';
import logoUmgImage from '../img/logo_umg.svg';

export const HeaderUMG = ({ sucursalActual }) => {
  return (
    <header style={styles.header}>
      <div style={styles.branding}>
        {}
        <div style={styles.logoContainer}>
          <img 
            src={logoUmgImage} 
            alt="Logo UMG" 
            style={styles.logoImage} 
          />
        </div>
        <div>
          <h1 style={styles.title}>Panadería San Carlos</h1>
          <p style={styles.subtitle}>Sistema de Control de Producción y Pedidos</p>
        </div>
      </div>
      {sucursalActual && (
        <div style={styles.sucursalBadge}>
          <Store size={15} />
          <span>{sucursalActual}</span>
        </div>
      )}
    </header>
  );
};

const styles = {
  header: {
    background: 'linear-gradient(115deg, #111827 0%, #1e293b 68%, #243b53 100%)',
    color: '#ffffff',
    padding: '1.25rem clamp(1rem, 4vw, 3rem)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    marginBottom: 0
  },
  branding: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.85rem'
  },
  
  logoContainer: {
    display: 'grid',
    placeItems: 'center',
    
    width: '60px',
    height: '60px',
  },
  
  logoImage: {
    maxHeight: '100%', 
    width: 'auto',      
    display: 'block'
  },
  
  title: {
    margin: 0,
    fontSize: 'clamp(1.15rem, 2vw, 1.45rem)',
    fontWeight: '700',
    letterSpacing: '-0.02em'
  },
  subtitle: {
    margin: 0,
    fontSize: '0.85rem',
    color: '#a9b7ca',
    marginTop: '0.2rem'
  },
  sucursalBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    padding: '0.55rem 0.8rem',
    borderRadius: '8px',
    fontSize: '0.9rem',
    border: '1px solid rgba(255, 255, 255, 0.14)',
    display: 'flex',
    alignItems: 'center',
    gap: '0.45rem',
    color: '#dbeafe'
  }
};