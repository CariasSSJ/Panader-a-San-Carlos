import React, { useState } from 'react';
import { HeaderUMG } from './components/HeaderUMG';
import { PedidoSucursal } from './components/PedidoSucursal';
import { PanelProduccion } from './components/PanelProduccion';

function App() {
  const [vista, setVista] = useState('sucursal'); // 'sucursal' o 'admin'

  return (
    <div style={{ backgroundColor: '#f1f5f9', minHeight: '100vh', paddingBottom: '3rem' }}>
      <HeaderUMG sucursalActual={vista === 'sucursal' ? 'PORTAL SUCURSALES' : 'ADMINISTRACIÓN / FÁBRICA'} />

      {/* Navegación por pestañas */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginBottom: '2rem' }}>
        <button
          onClick={() => setVista('sucursal')}
          style={{
            padding: '0.7rem 1.5rem',
            borderRadius: '8px',
            border: 'none',
            fontWeight: 'bold',
            cursor: 'pointer',
            backgroundColor: vista === 'sucursal' ? '#0284c7' : '#e2e8f0',
            color: vista === 'sucursal' ? '#ffffff' : '#334155'
          }}
        >
          Portal Sucursales (Tomar Pedido)
        </button>

        <button
          onClick={() => setVista('admin')}
          style={{
            padding: '0.7rem 1.5rem',
            borderRadius: '8px',
            border: 'none',
            fontWeight: 'bold',
            cursor: 'pointer',
            backgroundColor: vista === 'admin' ? '#0284c7' : '#e2e8f0',
            color: vista === 'admin' ? '#ffffff' : '#334155'
          }}
        >
          Panel Producción / Sr. Kevin
        </button>
      </div>

      <main style={{ padding: '0 1rem' }}>
        {vista === 'sucursal' ? <PedidoSucursal /> : <PanelProduccion />}
      </main>
    </div>
  );
}

export default App;
