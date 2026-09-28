import React, { useState, useEffect } from 'react';
import { HeaderUMG } from './components/HeaderUMG';
import { PedidoSucursal } from './components/PedidoSucursal';
import { RevisionPedidos } from './components/RevisionPedidos';
import { PanelProduccion } from './components/PanelProduccion';
import { GestionInventario } from './components/GestionInventario';
import { GestionRecetas } from './components/GestionRecetas';
import { LoginModal } from './components/LoginModal';
import { LoginEmpleado } from './components/LoginEmpleado';
import { observarUsuario, cerrarSesion } from './services/authService';
import { HistorialReportes } from './components/HistorialReportes';
import { Escalabilidad } from './components/escalabilidad';
import { BarChart3, ClipboardList, Factory, LockKeyhole, LogIn, LogOut, Package, ScrollText, ShieldCheck, TrendingUp } from 'lucide-react';

function App() {
  const [vista, setVista] = useState('sucursal'); // 'sucursal', 'inventario', 'recetas', 'revision', 'admin', 'historial', 'escalabilidad'
  const [usuario, setUsuario] = useState(null);
  const [rolUsuario, setRolUsuario] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const [modalLoginOpen, setModalLoginOpen] = useState(false);

  // Escuchar estado de sesión de Firebase Auth
  useEffect(() => {
    const desubscribir = observarUsuario((session) => {
      setUsuario(session?.user ?? null);
      setRolUsuario(session?.role ?? null);
      setAuthReady(true);
    });
    return () => desubscribir();
  }, []);

  const handleSeleccionarVista = (nuevaVista) => {
    // Solicitar credenciales gerenciales sin cambiar la vista actual.
    if ((nuevaVista === 'admin' || nuevaVista === 'revision') && rolUsuario !== 'gerencia') {
      setModalLoginOpen(true);
      return;
    }
    setVista(nuevaVista);
  };

  const handleCerrarSesion = async () => {
    await cerrarSesion();
    setVista('sucursal');
  };

  if (!authReady) {
    return <div style={styles.loadingScreen} role="status">Verificando sesión...</div>;
  }

  if (!usuario) {
    return (
      <div style={styles.loginScreen}>
        <LoginEmpleado />
        <button onClick={() => setModalLoginOpen(true)} style={styles.managerLoginLink}>
          Acceso Gerencial
        </button>
        <LoginModal
          isOpen={modalLoginOpen}
          onClose={() => setModalLoginOpen(false)}
          onLoginExitoso={() => setVista('admin')}
        />
      </div>
    );
  }

  const titulosHeader = {
  sucursal: 'PORTAL SUCURSALES (PEDIDOS)',
  inventario: 'GESTIÓN DE STOCK & PROVEEDORES',
  recetas: 'ADMINISTRACIÓN DE RECETAS',
  revision: 'REVISIÓN Y VALIDACIÓN DE PEDIDOS',
  admin: 'PANEL DE CONTROL DE PRODUCCIÓN',
  historial: 'HISTORIAL GENERAL & AUDITORÍA',
  escalabilidad: 'ESCALABILIDAD Y RENDIMIENTO'
  };  

  return (
  <div style={styles.appContainer}>
    <HeaderUMG sucursalActual={titulosHeader[vista]} />

    {/* BARRA SUPERIOR DE SESIÓN DE USUARIO */}
    <header style={styles.authBar}>
      <div style={styles.authBarInner}>
        {usuario ? (
          <div style={styles.userInfo}>
            <div style={styles.userBadge}>
              <span style={styles.userStatusDot} />
              <span style={styles.userEmail}>{usuario.email}</span>
              <span style={styles.roleTag}>{rolUsuario === 'gerencia' ? 'Gerencia' : 'Empleado'}</span>
            </div>
            <button onClick={handleCerrarSesion} style={styles.btnLogout}>
              <LogOut size={15} /> Cerrar Sesión
            </button>
          </div>
        ) : (
          <div style={styles.userInfo}>
            <span style={styles.guestTag}>Modo Empleado / General</span>
            <button onClick={() => setModalLoginOpen(true)} style={styles.btnLogin}>
              <LogIn size={15} />
              <span>Acceso Gerencial</span>
            </button>
          </div>
        )}
      </div>
    </header>

    {/* MENÚ DE NAVEGACIÓN MODULAR */}
    <nav style={styles.navbar} aria-label="Módulos principales">
      <div style={styles.navInner}>
        <button
          onClick={() => handleSeleccionarVista('sucursal')}
          style={styles.navBtn(vista === 'sucursal')}
        >
          <ClipboardList size={16} /> Pedidos Sucursales
        </button>

        <button
          onClick={() => handleSeleccionarVista('inventario')}
          style={styles.navBtn(vista === 'inventario')}
        >
          <Package size={16} /> Compras & Stock
        </button>

        <button
          onClick={() => handleSeleccionarVista('recetas')}
          style={styles.navBtn(vista === 'recetas')}
        >
          <ScrollText size={16} /> Recetas
        </button>

        <button
          onClick={() => handleSeleccionarVista('revision')}
          style={styles.navBtn(vista === 'revision', true)}
        >
          <ShieldCheck size={16} /> Revisión Pedidos <span style={styles.adminBadge}>Gerencia</span>
        </button>

        <button
          onClick={() => handleSeleccionarVista('admin')}
          style={styles.navBtn(vista === 'admin', true)}
        >
          <Factory size={16} /> Producción <span style={styles.adminBadge}>Gerencia</span>
        </button>

        <button
          onClick={() => handleSeleccionarVista('historial')}
          style={styles.navBtn(vista === 'historial')}
        >
          <BarChart3 size={16} /> Historial & Auditoría
        </button>

        <button
          onClick={() => handleSeleccionarVista('escalabilidad')}
          style={styles.navBtn(vista === 'escalabilidad')}
        >
          <TrendingUp size={16} /> Escalabilidad
        </button>
      </div>
    </nav>

    {/* CONTENIDO PRINCIPAL */}
    <main style={styles.main}>
      {vista === 'sucursal' && <PedidoSucursal />}
      {vista === 'inventario' && <GestionInventario />}
      {vista === 'recetas' && <GestionRecetas />}
      {vista === 'revision' && (
        rolUsuario === 'gerencia' ? (
          <RevisionPedidos />
        ) : (
          <div style={styles.blockedCard}>
            <div style={styles.blockedIcon}><LockKeyhole size={30} /></div>
            <h3 style={styles.blockedTitle}>Acceso Restringido</h3>
            <p style={styles.blockedText}>Esta sección requiere una cuenta autorizada de gerencia.</p>
          </div>
        )
      )}
      {vista === 'admin' && (
        rolUsuario === 'gerencia' ? (
          <PanelProduccion />
        ) : (
          <div style={styles.blockedCard}>
            <div style={styles.blockedIcon}><LockKeyhole size={30} /></div>
            <h3 style={styles.blockedTitle}>Acceso Restringido</h3>
            <p style={styles.blockedText}>Esta sección requiere una cuenta autorizada de gerencia.</p>
          </div>
        )
      )}
      {vista === 'historial' && <HistorialReportes />}
      {vista === 'escalabilidad' && <Escalabilidad />}
    </main>

    {/* MODAL DE AUTENTICACIÓN */}
    <LoginModal
      isOpen={modalLoginOpen}
      onClose={() => setModalLoginOpen(false)}
      onLoginExitoso={() => setVista('admin')}
    />
  </div>
 );
}

const styles = {
  loadingScreen: {
    minHeight: '100vh',
    display: 'grid',
    placeItems: 'center',
    color: '#475569',
    backgroundColor: '#f8fafc',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
  },
  loginScreen: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '1rem',
    padding: '1.5rem',
    backgroundColor: '#f8fafc'
  },
  managerLoginLink: {
    color: '#475569',
    background: 'transparent',
    border: 'none',
    padding: '0.5rem 0.75rem',
    fontSize: '0.875rem',
    fontWeight: 600,
    cursor: 'pointer'
  },
  appContainer: {
    backgroundColor: '#f8fafc',
    minHeight: '100vh',
    paddingBottom: '3rem',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif'
  },
  authBar: {
    backgroundColor: '#0f172a',
    color: '#f8fafc',
    borderBottom: '1px solid #1e293b'
  },
  authBarInner: {
    maxWidth: '1400px',
    margin: '0 auto',
    padding: '0.6rem 1.5rem',
    display: 'flex',
    justifyContent: 'flex-end',
    alignItems: 'center'
  },
  userInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem'
  },
  userBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    backgroundColor: '#1e293b',
    padding: '0.35rem 0.75rem',
    borderRadius: '9999px',
    border: '1px solid #334155'
  },
  userStatusDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    backgroundColor: '#10b981'
  },
  userEmail: {
    fontSize: '0.825rem',
    fontWeight: 500,
    color: '#e2e8f0'
  },
  roleTag: {
    fontSize: '0.7rem',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    fontWeight: 700,
    color: '#38bdf8',
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
    padding: '0.1rem 0.4rem',
    borderRadius: '4px'
  },
  guestTag: {
    fontSize: '0.825rem',
    color: '#94a3b8',
    fontWeight: 500
  },
  btnLogin: {
    backgroundColor: '#2563eb',
    color: '#ffffff',
    border: 'none',
    padding: '0.4rem 0.9rem',
    borderRadius: '6px',
    cursor: 'pointer',
    fontWeight: 600,
    fontSize: '0.825rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
    transition: 'background-color 0.15s ease'
  },
  btnLogout: {
    backgroundColor: 'transparent',
    color: '#f87171',
    border: '1px solid rgba(239, 68, 68, 0.3)',
    padding: '0.35rem 0.8rem',
    borderRadius: '6px',
    cursor: 'pointer',
    fontWeight: 600,
    fontSize: '0.8rem',
    transition: 'all 0.15s ease'
  },
  navbar: {
    position: 'sticky',
    top: 0,
    zIndex: 20,
    backgroundColor: '#ffffff',
    borderBottom: '1px solid #e2e8f0',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.03)',
    marginBottom: '2rem'
  },
  navInner: {
    maxWidth: '1400px',
    margin: '0 auto',
    padding: '0.5rem 1.5rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    overflowX: 'auto'
  },
  navBtn: (activo, esAdmin = false) => ({
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.4rem',
    padding: '0.55rem 0.9rem',
    borderRadius: '6px',
    border: '1px solid',
    borderColor: activo 
      ? '#2563eb' 
      : 'transparent',
    fontWeight: activo ? 600 : 500,
    cursor: 'pointer',
    backgroundColor: activo ? '#eff6ff' : 'transparent',
    color: activo ? '#1d4ed8' : '#475569',
    transition: 'all 0.15s ease',
    whiteSpace: 'nowrap',
    fontSize: '0.85rem'
  }),
  adminBadge: {
    fontSize: '0.65rem',
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    padding: '0.1rem 0.35rem',
    borderRadius: '4px',
    backgroundColor: '#f1f5f9',
    color: '#64748b'
  },
  main: {
    maxWidth: '1400px',
    margin: '0 auto',
    padding: '0 1.5rem'
  },
  blockedCard: {
    textAlign: 'center',
    backgroundColor: '#ffffff',
    padding: '3rem 2rem',
    borderRadius: '12px',
    border: '1px solid #e2e8f0',
    maxWidth: '480px',
    margin: '3rem auto 0',
    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.05)'
  },
  blockedIcon: {
    fontSize: '2.5rem',
    marginBottom: '1rem'
  },
  blockedTitle: {
    margin: '0 0 0.5rem 0',
    color: '#0f172a',
    fontSize: '1.25rem',
    fontWeight: 600
  },
  blockedText: {
    margin: 0,
    color: '#64748b',
    fontSize: '0.875rem',
    lineHeight: 1.5
  }  
};

export default App;