import React, { useState, useEffect } from 'react';
import { suscribirAlertasRuta, marcarAlertaResuelta } from '../services/alertasService';
import { AlertTriangle, CheckCircle2, Clock, Truck, User, MapPin, Filter } from 'lucide-react';

export function GestionAlertas() {
  const [alertas, setAlertas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('TODOS'); // 'TODOS', 'PENDIENTE', 'RESUELTA'

  useEffect(() => {
    // Escuchar cambios en Firestore en tiempo real
    const desubscribir = suscribirAlertasRuta((dataAlertas) => {
      setAlertas(dataAlertas);
      setErrorCarga('');
      setCargando(false);
    }, (error) => {
      setErrorCarga(error.message);
      setCargando(false);
    });

    return () => desubscribir();
  }, []);

  const handleResolver = async (id) => {
    const res = await marcarAlertaResuelta(id);
    if (!res.success) {
      alert("Hubo un error al intentar resolver la alerta.");
    }
  };

  const alertasFiltradas = alertas.filter((item) => {
    if (filtroEstado === 'PENDIENTE') return item.estado !== 'RESUELTA';
    if (filtroEstado === 'RESUELTA') return item.estado === 'RESUELTA';
    return true;
  });

  const pendientesCount = alertas.filter(a => a.estado !== 'RESUELTA').length;

  return (
    <div style={styles.container}>
      {/* HEADER DEL MÓDULO */}
      <div style={styles.topBar}>
        <div>
          <h2 style={styles.title}>
            <AlertTriangle color="#ef4444" size={24} /> Centro de Alertas Móviles de Ruta
          </h2>
          <p style={styles.subtitle}>Monitoreo e incidentes reportados en tiempo real por los vendedores</p>
        </div>

        {/* MTRICAS RÁPIDAS */}
        <div style={styles.statsContainer}>
          <div style={styles.statBox}>
            <span style={styles.statNumber}>{pendientesCount}</span>
            <span style={styles.statLabel}>Pendientes</span>
          </div>
          <div style={styles.statBoxSuccess}>
            <span style={styles.statNumberSuccess}>{alertas.length - pendientesCount}</span>
            <span style={styles.statLabel}>Resueltas</span>
          </div>
        </div>
      </div>

      {/* FILTROS */}
      <div style={styles.filterRow}>
        <div style={styles.filterGroup}>
          <Filter size={16} color="#64748b" />
          <span style={styles.filterLabel}>Estado:</span>
          <button 
            onClick={() => setFiltroEstado('TODOS')} 
            style={styles.btnFilter(filtroEstado === 'TODOS')}
          >
            Todos ({alertas.length})
          </button>
          <button 
            onClick={() => setFiltroEstado('PENDIENTE')} 
            style={styles.btnFilter(filtroEstado === 'PENDIENTE', '#ef4444')}
          >
            Pendientes ({pendientesCount})
          </button>
          <button 
            onClick={() => setFiltroEstado('RESUELTA')} 
            style={styles.btnFilter(filtroEstado === 'RESUELTA', '#10b981')}
          >
            Resueltas ({alertas.length - pendientesCount})
          </button>
        </div>
      </div>

      {/* ESTADO DE CARGA / LISTA VACÍA */}
      {cargando ? (
        <div style={styles.loadingBox}>Cargando incidentes de ruta...</div>
      ) : errorCarga ? (
        <div style={styles.errorBox} role="alert">
          No se pudieron cargar las alertas: {errorCarga}
        </div>
      ) : alertasFiltradas.length === 0 ? (
        <div style={styles.emptyBox}>
          <CheckCircle2 size={40} color="#10b981" />
          <p>No hay alertas {filtroEstado.toLowerCase()}s registradas en este momento.</p>
        </div>
      ) : (
        /* GRILLA DE TARJETAS DE ALERTAS */
        <div style={styles.gridContainer}>
          {alertasFiltradas.map((alerta) => {
            const esPendiente = alerta.estado !== 'RESUELTA';
            return (
              <div key={alerta.id} style={styles.card(esPendiente)}>
                <div style={styles.cardHeader}>
                  <span style={styles.badgeTipo(esPendiente)}>
                    {alerta.tipo_incidente || 'Incidente General'}
                  </span>
                  <span style={styles.badgeEstado(esPendiente)}>
                    {esPendiente ? 'PENDIENTE' : 'RESUELTA'}
                  </span>
                </div>

                <div style={styles.cardBody}>
                  <div style={styles.infoRow}>
                    <User size={15} color="#64748b" />
                    <strong>Vendedor:</strong> {alerta.vendedor || 'No especificado'}
                  </div>
                  <div style={styles.infoRow}>
                    <MapPin size={15} color="#64748b" />
                    <strong>Ruta:</strong> {alerta.ruta || 'Sin Ruta'}
                  </div>
                  <div style={styles.infoRow}>
                    <Clock size={15} color="#64748b" />
                    <strong>Fecha/Hora:</strong>{' '}
                    {alerta.fecha_reporte?.toLocaleString() || 'Sin fecha'}
                  </div>

                  <p style={styles.descripcionText}>{alerta.descripcion}</p>

                  {/* ALERTA DE RE-DESPACHO DE UNIDAD */}
                  {alerta.requiere_redespacho && (
                    <div style={styles.redespachoAlert}>
                      <Truck size={18} color="#dc2626" />
                      <span><strong>¡ATENCIÓN!</strong> Requiere enviar otra unidad de re-despacho.</span>
                    </div>
                  )}
                </div>

                {/* ACCIONES */}
                {esPendiente && (
                  <div style={styles.cardFooter}>
                    <button 
                      onClick={() => handleResolver(alerta.id)}
                      style={styles.btnResolver}
                    >
                      <CheckCircle2 size={16} /> Marcar como Resuelta
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    padding: '0.5rem 0',
  },
  topBar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1.5rem',
    flexWrap: 'wrap',
    gap: '1rem',
  },
  title: {
    margin: 0,
    fontSize: '1.4rem',
    fontWeight: 700,
    color: '#0f172a',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  subtitle: {
    margin: '0.2rem 0 0 0',
    color: '#64748b',
    fontSize: '0.875rem',
  },
  statsContainer: {
    display: 'flex',
    gap: '1rem',
  },
  statBox: {
    backgroundColor: '#fef2f2',
    border: '1px solid #fecaca',
    padding: '0.5rem 1rem',
    borderRadius: '8px',
    textAlign: 'center',
  },
  statNumber: {
    display: 'block',
    fontSize: '1.25rem',
    fontWeight: 700,
    color: '#dc2626',
  },
  statBoxSuccess: {
    backgroundColor: '#f0fdf4',
    border: '1px solid #bbf7d0',
    padding: '0.5rem 1rem',
    borderRadius: '8px',
    textAlign: 'center',
  },
  statNumberSuccess: {
    display: 'block',
    fontSize: '1.25rem',
    fontWeight: 700,
    color: '#16a34a',
  },
  statLabel: {
    fontSize: '0.75rem',
    color: '#475569',
    fontWeight: 600,
  },
  filterRow: {
    marginBottom: '1.5rem',
  },
  filterGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    backgroundColor: '#ffffff',
    padding: '0.5rem 1rem',
    borderRadius: '8px',
    border: '1px solid #e2e8f0',
  },
  filterLabel: {
    fontSize: '0.85rem',
    fontWeight: 600,
    color: '#475569',
    marginRight: '0.5rem',
  },
  btnFilter: (activo, colorActivo = '#2563eb') => ({
    padding: '0.35rem 0.75rem',
    borderRadius: '6px',
    border: '1px solid',
    borderColor: activo ? colorActivo : '#cbd5e1',
    backgroundColor: activo ? colorActivo : '#f8fafc',
    color: activo ? '#ffffff' : '#475569',
    fontSize: '0.8rem',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  }),
  loadingBox: {
    textAlign: 'center',
    padding: '3rem',
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    color: '#64748b',
  },
  errorBox: {
    padding: '1rem',
    backgroundColor: '#fef2f2',
    border: '1px solid #fecaca',
    borderRadius: '8px',
    color: '#991b1b',
  },
  emptyBox: {
    textAlign: 'center',
    padding: '3rem',
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    border: '1px dashed #cbd5e1',
    color: '#64748b',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '0.75rem',
  },
  gridContainer: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
    gap: '1.25rem',
  },
  card: (esPendiente) => ({
    backgroundColor: '#ffffff',
    borderRadius: '10px',
    border: '1px solid',
    borderColor: esPendiente ? '#fca5a5' : '#cbd5e1',
    boxShadow: esPendiente ? '0 4px 6px -1px rgba(239, 68, 68, 0.08)' : '0 2px 4px rgba(0,0,0,0.02)',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
  }),
  cardHeader: {
    padding: '0.85rem 1rem',
    backgroundColor: '#f8fafc',
    borderBottom: '1px solid #f1f5f9',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  badgeTipo: (esPendiente) => ({
    backgroundColor: esPendiente ? '#fee2e2' : '#f1f5f9',
    color: esPendiente ? '#991b1b' : '#475569',
    fontSize: '0.75rem',
    fontWeight: 700,
    padding: '0.2rem 0.5rem',
    borderRadius: '4px',
    textTransform: 'uppercase',
  }),
  badgeEstado: (esPendiente) => ({
    backgroundColor: esPendiente ? '#ef4444' : '#10b981',
    color: '#ffffff',
    fontSize: '0.68rem',
    fontWeight: 700,
    padding: '0.2rem 0.5rem',
    borderRadius: '9999px',
  }),
  cardBody: {
    padding: '1rem',
    flex: 1,
  },
  infoRow: {
    fontSize: '0.85rem',
    color: '#334155',
    marginBottom: '0.4rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.4rem',
  },
  descripcionText: {
    marginTop: '0.75rem',
    padding: '0.65rem',
    backgroundColor: '#f8fafc',
    borderRadius: '6px',
    fontSize: '0.875rem',
    color: '#1e293b',
    borderLeft: '3px solid #cbd5e1',
    lineHeight: 1.4,
  },
  redespachoAlert: {
    marginTop: '0.75rem',
    padding: '0.6rem',
    backgroundColor: '#fef2f2',
    border: '1px solid #fecaca',
    borderRadius: '6px',
    color: '#991b1b',
    fontSize: '0.8rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  cardFooter: {
    padding: '0.75rem 1rem',
    borderTop: '1px solid #f1f5f9',
    backgroundColor: '#ffffff',
  },
  btnResolver: {
    width: '100%',
    backgroundColor: '#10b981',
    color: '#ffffff',
    border: 'none',
    padding: '0.5rem',
    borderRadius: '6px',
    fontWeight: 600,
    fontSize: '0.825rem',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.4rem',
    transition: 'background-color 0.15s ease',
  },
};