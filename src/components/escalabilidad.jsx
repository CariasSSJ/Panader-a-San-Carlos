import React, { useEffect, useState } from 'react';
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  CircleDollarSign,
  LoaderCircle,
  Package,
  RefreshCw,
  Store
} from 'lucide-react';
import { obtenerDatosEscalabilidad } from '../services/scriptEscalabilidad';

const moneda = (valor) => `Q ${Number(valor || 0).toFixed(2)}`;
const unidades = (valor) => `${Number(valor || 0).toLocaleString('es-GT')} unidades`;

export const Escalabilidad = () => {
  const [datos, setDatos] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  const cargarDatos = async () => {
    setCargando(true);
    setError('');
    try {
      setDatos(await obtenerDatosEscalabilidad());
    } catch (errorCarga) {
      console.error('Error al cargar escalabilidad:', errorCarga);
      setError('No se pudieron cargar los indicadores. Verifique la conexión e inténtelo de nuevo.');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  if (cargando) {
    return <div style={styles.estado}><LoaderCircle size={22} style={styles.spinner} /> Cargando indicadores de ventas...</div>;
  }

  if (error) {
    return (
      <div style={styles.estadoError}>
        <AlertTriangle size={22} />
        <span>{error}</span>
        <button type="button" onClick={cargarDatos} style={styles.refreshButton}><RefreshCw size={16} /> Reintentar</button>
      </div>
    );
  }

  const hayDatos = datos?.sucursales?.length > 0;
  if (!hayDatos) {
    return (
      <div style={styles.container}>
        <PageHeading />
        <div style={styles.emptyState}>
          <BarChart3 size={34} />
          <h3>Aún no hay ventas procesadas</h3>
          <p>Los indicadores aparecerán cuando se registre el primer despacho en producción.</p>
          <button type="button" onClick={cargarDatos} style={styles.refreshButton}><RefreshCw size={16} /> Actualizar</button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <PageHeading onRefresh={cargarDatos} />

      <section style={styles.kpiGrid} aria-label="Resumen de ventas">
        <MetricCard icon={<ArrowUpRight size={20} />} label="Producto más vendido global" value={datos.global.productoMasVendido?.nombre || '-'} detail={unidades(datos.global.productoMasVendido?.cantidad)} tone="blue" />
        <MetricCard icon={<ArrowDownRight size={20} />} label="Producto menos vendido global" value={datos.global.productoMenosVendido?.nombre || '-'} detail={unidades(datos.global.productoMenosVendido?.cantidad)} tone="amber" />
        <MetricCard icon={<CircleDollarSign size={20} />} label="Sucursal más rentable" value={datos.sucursalMasRentable?.nombre || '-'} detail={moneda(datos.sucursalMasRentable?.totalVentas)} tone="green" />
        <MetricCard icon={<Store size={20} />} label="Sucursal que menos genera" value={datos.sucursalMenosGenera?.nombre || '-'} detail={moneda(datos.sucursalMenosGenera?.totalVentas)} tone="red" />
      </section>

      <section style={styles.panel}>
        <div style={styles.panelHeader}>
          <div>
            <h3 style={styles.panelTitle}>Rendimiento por sucursal</h3>
            <p style={styles.panelSub}>Producto líder y facturación acumulada por cada ubicación.</p>
          </div>
          <span style={styles.counter}>{datos.sucursales.length} sucursales</span>
        </div>
        <div style={styles.branchGrid}>
          {datos.sucursales.map((sucursal) => (
            <article key={sucursal.nombre} style={styles.branchCard}>
              <div style={styles.branchTitle}><Store size={17} /><strong>{sucursal.nombre}</strong></div>
              <div style={styles.branchProduct}>
                <span style={styles.label}>Producto más vendido</span>
                <span style={styles.productName}>{sucursal.productoMasVendido?.nombre || 'Sin ventas'}</span>
                <span style={styles.quantity}>{unidades(sucursal.productoMasVendido?.cantidad)}</span>
              </div>
              <div style={styles.branchFooter}>
                <span><Package size={14} /> {unidades(sucursal.totalUnidades)}</span>
                <strong>{moneda(sucursal.totalVentas)}</strong>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
};

const PageHeading = ({ onRefresh }) => (
  <div style={styles.heading}>
    <div>
      <h2 style={styles.pageTitle}><BarChart3 size={23} /> Escalabilidad y rendimiento</h2>
      <p style={styles.subtitle}>Indicadores basados en despachos procesados y facturados.</p>
    </div>
    {onRefresh && <button type="button" onClick={onRefresh} style={styles.iconButton} title="Actualizar indicadores" aria-label="Actualizar indicadores"><RefreshCw size={17} /></button>}
  </div>
);

const MetricCard = ({ icon, label, value, detail, tone }) => (
  <article style={{ ...styles.metricCard, borderTopColor: styles.tones[tone] }}>
    <div style={{ ...styles.metricIcon, color: styles.tones[tone] }}>{icon}</div>
    <span style={styles.metricLabel}>{label}</span>
    <strong style={styles.metricValue}>{value}</strong>
    <span style={styles.metricDetail}>{detail}</span>
  </article>
);

const styles = {
  container: { maxWidth: '1200px', margin: '0 auto', padding: '1rem' },
  heading: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', marginBottom: '1.5rem' },
  pageTitle: { display: 'flex', alignItems: 'center', gap: '0.55rem', margin: 0, color: '#172033' },
  subtitle: { color: '#64748b', fontSize: '0.9rem', margin: '0.45rem 0 0' },
  kpiGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.5rem' },
  metricCard: { backgroundColor: '#fff', border: '1px solid #e2e8f0', borderTop: '4px solid', borderRadius: '10px', padding: '1.1rem', boxShadow: '0 3px 8px rgba(15, 23, 42, 0.06)' },
  metricIcon: { display: 'flex', marginBottom: '0.7rem' },
  metricLabel: { display: 'block', color: '#64748b', fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.03em' },
  metricValue: { display: 'block', color: '#0f172a', fontSize: '1.15rem', marginTop: '0.45rem' },
  metricDetail: { display: 'block', color: '#475569', fontSize: '0.88rem', marginTop: '0.3rem' },
  panel: { backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '1.35rem', boxShadow: '0 3px 8px rgba(15, 23, 42, 0.05)' },
  panelHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', marginBottom: '1rem' },
  panelTitle: { margin: 0, color: '#172033', fontSize: '1.1rem' },
  panelSub: { margin: '0.35rem 0 0', color: '#64748b', fontSize: '0.85rem' },
  counter: { color: '#0369a1', backgroundColor: '#e0f2fe', borderRadius: '999px', padding: '0.35rem 0.7rem', fontSize: '0.78rem', fontWeight: 700, whiteSpace: 'nowrap' },
  branchGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '0.9rem' },
  branchCard: { backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '1rem' },
  branchTitle: { display: 'flex', alignItems: 'center', gap: '0.45rem', color: '#0f172a', marginBottom: '1rem' },
  branchProduct: { borderLeft: '3px solid #0ea5e9', paddingLeft: '0.7rem' },
  label: { display: 'block', color: '#64748b', fontSize: '0.75rem' },
  productName: { display: 'block', color: '#172033', fontWeight: 700, marginTop: '0.25rem' },
  quantity: { display: 'block', color: '#0369a1', fontSize: '0.85rem', marginTop: '0.2rem' },
  branchFooter: { display: 'flex', justifyContent: 'space-between', gap: '0.5rem', borderTop: '1px solid #e2e8f0', marginTop: '1rem', paddingTop: '0.75rem', color: '#64748b', fontSize: '0.82rem' },
  estado: { display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.55rem', minHeight: '240px', color: '#475569' },
  estadoError: { display: 'flex', justifyContent: 'center', alignItems: 'center', flexWrap: 'wrap', gap: '0.7rem', minHeight: '240px', color: '#b91c1c', textAlign: 'center' },
  emptyState: { backgroundColor: '#fff', border: '1px dashed #cbd5e1', borderRadius: '10px', padding: '3rem 1.5rem', textAlign: 'center', color: '#64748b' },
  refreshButton: { display: 'inline-flex', alignItems: 'center', gap: '0.45rem', border: 'none', borderRadius: '6px', backgroundColor: '#0f172a', color: '#fff', padding: '0.55rem 0.85rem', cursor: 'pointer', fontWeight: 600 },
  iconButton: { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '36px', height: '36px', border: '1px solid #cbd5e1', borderRadius: '6px', backgroundColor: '#fff', color: '#334155', cursor: 'pointer' },
  spinner: { animation: 'spin 1s linear infinite' },
  tones: { blue: '#0284c7', amber: '#d97706', green: '#16a34a', red: '#dc2626' }
};
