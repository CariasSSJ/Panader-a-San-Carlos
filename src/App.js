import React, { useState } from 'react';
import { HeaderUMG } from './components/HeaderUMG';
import { PedidoSucursal } from './components/PedidoSucursal';
import { PanelProduccion } from './components/PanelProduccion';
import { GestionInventario } from './components/GestionInventario';
import { GestionRecetas } from './components/GestionRecetas';

function App() {
  const [vista, setVista] = useState('sucursal'); // 'sucursal', 'inventario', 'recetas', 'admin'

  const titulosHeader = {
    sucursal: 'PORTAL SUCURSALES (PEDIDOS)',
    inventario: 'GESTIÓN DE STOCK & PROVEEDORES',
    recetas: 'ADMINISTRACIÓN DE RECETAS',
    admin: 'PANEL DE CONTROL DE PRODUCCIÓN'
  };

  return (
    <div style={{ backgroundColor: '#f1f5f9', minHeight: '100vh', paddingBottom: '3rem' }}>
      <HeaderUMG sucursalActual={titulosHeader[vista]} />

      {/* Menú Modular */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '2rem' }}>
        <button
          onClick={() => setVista('sucursal')}
          style={styles.navBtn(vista === 'sucursal')}
        >
          1. Pedidos Sucursales
        </button>

        <button
          onClick={() => setVista('inventario')}
          style={styles.navBtn(vista === 'inventario')}
        >
          2. Compras & Proveedores (Stock)
        </button>

        <button
          onClick={() => setVista('recetas')}
          style={styles.navBtn(vista === 'recetas')}
        >
          3. Recetas por Pan
        </button>

        <button
          onClick={() => setVista('admin')}
          style={styles.navBtn(vista === 'admin')}
        >
          4. Panel Producción (Sr. Kevin)
        </button>
      </div>

      <main style={{ padding: '0 1rem' }}>
        {vista === 'sucursal' && <PedidoSucursal />}
        {vista === 'inventario' && <GestionInventario />}
        {vista === 'recetas' && <GestionRecetas />}
        {vista === 'admin' && <PanelProduccion />}
      </main>
    </div>
  );
}

const styles = {
  navBtn: (activo) => ({
    padding: '0.7rem 1.2rem',
    borderRadius: '8px',
    border: 'none',
    fontWeight: 'bold',
    cursor: 'pointer',
    backgroundColor: activo ? '#0284c7' : '#ffffff',
    color: activo ? '#ffffff' : '#334155',
    boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
    transition: 'all 0.2s'
  })
};

export default App;
