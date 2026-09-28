import React, { useState, useEffect } from 'react';
import { db } from '../config/firebase';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { NOMBRES_PANES, PRECIOS_PANES } from '../utils/facturaPdf';
import { EstadoBadge } from './EstadoBadge';
import { BarChart3, CalendarDays, Clock3, Package, ShoppingCart } from 'lucide-react';

export const HistorialReportes = () => {
  const [subTab, setSubTab] = useState('despachos'); // 'despachos' o 'compras'
  const [despachos, setDespachos] = useState([]);
  const [compras, setCompras] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    cargarHistoriales();
  }, []);

  const cargarHistoriales = async () => {
    setCargando(true);
    try {
      // 1. Cargar Historial de Despachos / Ventas
      const qDespachos = query(collection(db, "historial_despachos"), orderBy("timestamp", "desc"));
      const snapDespachos = await getDocs(qDespachos);
      const listDespachos = snapDespachos.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setDespachos(listDespachos);

      // 2. Cargar Historial de Compras de Insumos
      const qCompras = query(collection(db, "historial_compras"), orderBy("timestamp", "desc"));
      const snapCompras = await getDocs(qCompras);
      const listCompras = snapCompras.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setCompras(listCompras);
    } catch (error) {
      console.error("Error al cargar historial:", error);
    } finally {
      setCargando(false);
    }
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.pageTitle}><BarChart3 size={22} /> Historial General & Auditoría de Operaciones</h2>
      <p style={styles.sub}>Supervise todos los despachos facturados a sucursales y las compras de materia prima realizadas.</p>

      {/* Sub-navegación */}
      <div style={styles.subNav}>
        <button
          onClick={() => setSubTab('despachos')}
          style={styles.subBtn(subTab === 'despachos')}
        >
          <Package size={16} /> Despachos y Facturación a Sucursales ({despachos.length})
        </button>
        <button
          onClick={() => setSubTab('compras')}
          style={styles.subBtn(subTab === 'compras')}
        >
          <ShoppingCart size={16} /> Compras de Insumos & Stock ({compras.length})
        </button>
      </div>

      {cargando ? (
        <p style={{ textAlign: 'center', margin: '2rem 0' }}>Cargando datos del historial...</p>
      ) : (
        <>
          {/* TABLA 1: DESPACHOS / VENTAS */}
          {subTab === 'despachos' && (
            <div style={styles.card}>
              <h3>Historial de Despachos Realizados</h3>
              {despachos.length === 0 ? (
                <p>No se han registrado despachos procesados aún.</p>
              ) : (
                <div style={styles.despachoGrid}>
                  {despachos.map((item) => (
                    <div key={item.id} style={styles.despachoCardItem}>
                      {/* Encabezado de la tarjeta */}
                      <div style={styles.cardHeader}>
                        <div style={styles.headerLeft}>
                          <h4 style={styles.cardTitle}>{item.sucursal}</h4>
                          <p style={styles.cardMeta}><CalendarDays size={14} /> {item.fechaProduccion} <span>|</span> <Clock3 size={14} /> {item.turno?.toUpperCase()}</p>
                        </div>
                        <div style={styles.headerRight}>
                          <EstadoBadge estado="DESPACHADO" />
                          <p style={styles.totalAmount}>Q {(item.totalMontoQ || 0).toFixed(2)}</p>
                          <p style={styles.pedidosCount}>{item.totalPedidosProcesados} pedidos</p>
                        </div>
                      </div>

                      {/* Detalle de Panes */}
                      <div style={styles.panesDetailContainer}>
                        <h5 style={styles.subTitle}><Package size={15} /> Detalle de Panes:</h5>
                        <div style={styles.panesList}>
                          {item.totalesPan && Object.entries(item.totalesPan).map(([pan, cant]) => {
                            const nombrePan = NOMBRES_PANES[pan] || pan;
                            const precioPan = PRECIOS_PANES[pan] || 1.00;
                            const subtotal = cant * precioPan;
                            return (
                              <div key={pan} style={styles.panItem}>
                                <div style={styles.panName}>{nombrePan}</div>
                                <div style={styles.panQuantity}>{cant} unid.</div>
                                <div style={styles.panPrice}>@ Q {precioPan.toFixed(2)}</div>
                                <div style={styles.panSubtotal}>= Q {subtotal.toFixed(2)}</div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TABLA 2: COMPRAS DE INSUMOS */}
          {subTab === 'compras' && (
            <div style={styles.card}>
              <h3>Historial de Entradas de Insumos</h3>
              {compras.length === 0 ? (
                <p>No hay compras o reabastecimientos registrados.</p>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={styles.table}>
                    <thead>
                      <tr>
                        <th style={styles.th}>Fecha Reg.</th>
                        <th style={styles.th}>Materia Prima / Insumo</th>
                        <th style={styles.th}>Cantidad Entrante</th>
                        <th style={styles.th}>Proveedor</th>
                        <th style={styles.th}>Costo Total</th>
                        <th style={styles.th}>Notas</th>
                      </tr>
                    </thead>
                    <tbody>
                      {compras.map((item) => (
                        <tr key={item.id}>
                          <td style={styles.td}>{item.fechaRegistro}</td>
                          <td style={styles.td}><strong>{item.nombreInsumo}</strong></td>
                          <td style={{ ...styles.td, color: '#0284c7', fontWeight: 'bold' }}>
                            +{item.cantidadComprada} {item.unidad}
                          </td>
                          <td style={styles.td}>{item.proveedor}</td>
                          <td style={styles.td}>Q {(item.costoTotal || 0).toFixed(2)}</td>
                          <td style={styles.td}>{item.notas || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};

const styles = {
  container: { maxWidth: '1100px', margin: '0 auto', padding: '1rem' },
  pageTitle: { display: 'flex', alignItems: 'center', gap: '0.55rem', marginTop: 0, color: '#172033' },
  sub: { color: '#64748b', fontSize: '0.9rem', marginBottom: '1.5rem' },
  subNav: { display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' },
  subBtn: (activo) => ({
    display: 'inline-flex', alignItems: 'center', gap: '0.45rem',
    padding: '0.6rem 1.2rem',
    borderRadius: '6px',
    border: 'none',
    fontWeight: 'bold',
    cursor: 'pointer',
    backgroundColor: activo ? '#0f172a' : '#e2e8f0',
    color: activo ? '#fff' : '#334155'
  }),
  card: { backgroundColor: '#fff', borderRadius: '10px', padding: '1.5rem', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' },
  
  // Estilos para el grid de despachos (tarjetas)
  despachoGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))',
    gap: '1rem',
    marginTop: '1.5rem'
  },
  despachoCardItem: {
    backgroundColor: '#f8fafc',
    border: '1px solid #e2e8f0',
    borderRadius: '10px',
    padding: '1rem',
    boxShadow: '0 2px 4px rgba(0,0,0,0.08)',
    transition: 'all 0.3s ease',
    ':hover': {
      boxShadow: '0 6px 12px rgba(0,0,0,0.12)',
      borderColor: '#cbd5e1'
    }
  },
  
  // Encabezado de la tarjeta
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderBottom: '2px solid #e2e8f0',
    paddingBottom: '0.75rem',
    marginBottom: '0.75rem'
  },
  headerLeft: {
    flex: 1
  },
  headerRight: {
    textAlign: 'right'
  },
  cardTitle: {
    margin: '0 0 0.3rem 0',
    fontSize: '1.1rem',
    color: '#0f172a',
    fontWeight: '700'
  },
  cardMeta: {
    margin: '0',
    fontSize: '0.85rem',
    color: '#64748b',
    display: 'flex',
    alignItems: 'center',
    gap: '0.3rem'
  },
  totalAmount: {
    margin: '0 0 0.3rem 0',
    fontSize: '1.3rem',
    fontWeight: '800',
    color: '#16a34a'
  },
  pedidosCount: {
    margin: '0',
    fontSize: '0.85rem',
    color: '#0369a1',
    fontWeight: '600'
  },
  
  // Contenedor de detalle de panes
  panesDetailContainer: {
    marginTop: '0.5rem'
  },
  subTitle: {
    margin: '0 0 0.6rem 0',
    fontSize: '0.95rem',
    color: '#0f172a',
    fontWeight: '600',
    display: 'flex',
    alignItems: 'center',
    gap: '0.4rem'
  },
  panesList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.6rem'
  },
  
  // Cada item de pan
  panItem: {
    display: 'grid',
    gridTemplateColumns: '2fr 1fr 1fr 1fr',
    gap: '0.8rem',
    alignItems: 'center',
    padding: '0.7rem',
    backgroundColor: '#fff',
    borderRadius: '6px',
    border: '1px solid #f1f5f9'
  },
  panName: {
    fontWeight: '600',
    color: '#0f172a',
    fontSize: '0.95rem'
  },
  panQuantity: {
    color: '#0284c7',
    fontWeight: '600',
    fontSize: '0.9rem',
    textAlign: 'center'
  },
  panPrice: {
    color: '#64748b',
    fontSize: '0.85rem',
    textAlign: 'center'
  },
  panSubtotal: {
    color: '#047857',
    fontWeight: '700',
    fontSize: '0.9rem',
    textAlign: 'right'
  },
  
  // Estilos antiguos que se mantienen para compras
  table: { width: '100%', borderCollapse: 'collapse', marginTop: '1rem', fontSize: '0.9rem' },
  th: { backgroundColor: '#f8fafc', padding: '0.75rem', textAlign: 'left', borderBottom: '2px solid #e2e8f0', color: '#334155' },
  td: { padding: '0.75rem', borderBottom: '1px solid #f1f5f9' },
  badge: { display: 'block', backgroundColor: '#e0f2fe', color: '#0369a1', padding: '0.5rem', borderRadius: '4px', fontSize: '0.8rem', marginBottom: '0.4rem', borderLeft: '3px solid #0284c7' }
};