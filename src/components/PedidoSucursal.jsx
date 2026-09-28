import React, { useState } from 'react';
import { registrarPedido } from '../services/pedidosService';
import { CalendarDays, Clock3, MapPin, Package, Send, LoaderCircle } from 'lucide-react';
import { ModalDialog } from './ModalDialog';

const PRODUCTOS_PAN = [
  { id: 'cubos', nombre: 'Cubos-Especial' },
  { id: 'frances', nombre: 'Francés' },
  { id: 'aleman', nombre: 'Alemán' },
  { id: 'cachos', nombre: 'Cachos' },
  { id: 'cortadas', nombre: 'Cortadas' },
  { id: 'batidas', nombre: 'Batidas' },
  { id: 'campechanas', nombre: 'Campechanas' },
  { id: 'shecas', nombre: 'Shecas' }
];

const SUCURSALES = ['CENTRAL', 'CHIVA', 'BARCO', 'HEYDI', 'TERMINAL'];

export const PedidoSucursal = () => {
  const [sucursal, setSucursal] = useState('CENTRAL');
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);
  const [turno, setTurno] = useState('Mañana');
  const [cantidades, setCantidades] = useState({});
  const [mensaje, setMensaje] = useState({ tipo: '', texto: '' });
  const [cargando, setCargando] = useState(false);
  const [erroresValidacion, setErroresValidacion] = useState({});
  const [modalConfirmacion, setModalConfirmacion] = useState({
    isOpen: false,
    mensaje: '',
    onConfirm: null,
  });

  const obtenerItems = () => Object.entries(cantidades)
    .filter(([_, cant]) => cant && cant > 0)
    .map(([productoId, cantidad]) => ({ productoId, cantidad }));

  const handleCantidadChange = (productoId, valor) => {
    const num = parseInt(valor, 10);
    const errores = { ...erroresValidacion };

    if (valor === '') {
      setCantidades(prev => ({ ...prev, [productoId]: '' }));
      delete errores[productoId];
    } else if (isNaN(num)) {
      errores[productoId] = 'Debe ser un número';
      setCantidades(prev => ({ ...prev, [productoId]: valor }));
    } else if (num < 0) {
      errores[productoId] = 'No puede ser negativo';
      setCantidades(prev => ({ ...prev, [productoId]: 0 }));
    } else if (num > 1000000) {
      errores[productoId] = 'Cantidad sospechosamente alta';
      setCantidades(prev => ({ ...prev, [productoId]: num }));
    } else {
      delete errores[productoId];
      setCantidades(prev => ({ ...prev, [productoId]: num }));
    }

    setErroresValidacion(errores);
  };

  const cerrarModalConfirmacion = () => {
    setModalConfirmacion({ isOpen: false, mensaje: '', onConfirm: null });
  };

  const continuarEnvioPedido = async () => {
    const items = obtenerItems();

    try {
      setCargando(true);
      await registrarPedido(sucursal, fecha, turno, items);
      setMensaje({
        tipo: 'exito',
        texto: `✅ Éxito: Pedido enviado correctamente a Revisión.\n\nSucursal: ${sucursal}\nFecha: ${fecha}\nTurno: ${turno}\n\nEl administrador deberá revisar y aprobar este pedido.`
      });
      setCantidades({});
      setErroresValidacion({});
    } catch (error) {
      setMensaje({
        tipo: 'error',
        texto: `❌ Error al enviar pedido: ${error.message}`
      });
    } finally {
      setCargando(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMensaje({ tipo: '', texto: '' });

    const items = obtenerItems();

    if (items.length === 0) {
      setMensaje({
        tipo: 'error',
        texto: '❌ Campo obligatorio: Debe ingresar al menos una cantidad de pan mayor a 0.'
      });
      return;
    }

    const itemsSospechosos = items.filter(item => item.cantidad > 1000000);
    if (itemsSospechosos.length > 0) {
      setModalConfirmacion({
        isOpen: true,
        mensaje: `⚠️ ADVERTENCIA: Detectamos cantidades muy altas:\n\n${itemsSospechosos.map(item => `${PRODUCTOS_PAN.find(p => p.id === item.productoId)?.nombre}: ${item.cantidad}`).join('\n')}\n\n¿Está seguro de que desea continuar?`,
        onConfirm: async () => {
          setModalConfirmacion({ isOpen: false, mensaje: '', onConfirm: null });
          await continuarEnvioPedido();
        }
      });
      return;
    }

    await continuarEnvioPedido();
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.formTitle}>Solicitud de Pedido de Pan</h2>

      {mensaje.texto && (
        <div style={mensaje.tipo === 'error' ? styles.alertError : styles.alertExito}>
          {mensaje.texto}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div style={styles.row}>
          <div style={styles.fieldGroup}>
            <label style={styles.label}><MapPin size={15} /> Sucursal Requiere:</label>
            <select style={styles.input} value={sucursal} onChange={(e) => setSucursal(e.target.value)}>
              {SUCURSALES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          <div style={styles.fieldGroup}>
            <label style={styles.label}><CalendarDays size={15} /> Fecha: <span style={{ color: '#ef4444' }}>*</span></label>
            <input
              type="date"
              style={styles.input}
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              required
            />
          </div>

          <div style={styles.fieldGroup}>
            <label style={styles.label}><Clock3 size={15} /> Turno de Entrega:</label>
            <select style={styles.input} value={turno} onChange={(e) => setTurno(e.target.value)}>
              <option value="Mañana">Mañana</option>
              <option value="Tarde">Tarde</option>
            </select>
          </div>
        </div>

        <h3 style={styles.subTitle}><Package size={18} /> Selección de Productos (Unidades)</h3>
        <p style={styles.hint}>Ingresa la cantidad de cada tipo de pan. Los campos dejan estar vacíos si no necesitas ese producto.</p>

        <div style={styles.gridProductos}>
          {PRODUCTOS_PAN.map(prod => (
            <div key={prod.id} style={{ ...styles.cardProducto, borderColor: erroresValidacion[prod.id] ? '#ef4444' : '#e2e8f0' }}>
              <label style={styles.prodName}>{prod.nombre}</label>
              <input
                type="number"
                min="0"
                placeholder="0"
                style={{
                  ...styles.inputCant,
                  borderColor: erroresValidacion[prod.id] ? '#ef4444' : '#cbd5e1',
                  backgroundColor: erroresValidacion[prod.id] ? '#fee2e2' : '#fff'
                }}
                value={cantidades[prod.id] || ''}
                onChange={(e) => handleCantidadChange(prod.id, e.target.value)}
              />
              {erroresValidacion[prod.id] && (
                <small style={{ color: '#ef4444', fontSize: '0.75rem', fontWeight: '600' }}>
                  ⚠️ {erroresValidacion[prod.id]}
                </small>
              )}
            </div>
          ))}
        </div>

        <button type="submit" style={styles.btnSubmit} disabled={cargando}>
          {cargando ? <><LoaderCircle size={16} /> Guardando en Firebase...</> : <><Send size={16} /> Enviar Pedido a Fábrica (Revisión)</>}
        </button>
      </form>

      <ModalDialog
        isOpen={modalConfirmacion.isOpen}
        type="confirm"
        title="Confirmación requerida"
        message={modalConfirmacion.mensaje}
        confirmText="Sí, continuar"
        cancelText="Cancelar"
        onConfirm={modalConfirmacion.onConfirm || (() => {})}
        onCancel={cerrarModalConfirmacion}
      />
    </div>
  );
};

const styles = {
  container: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    padding: '2rem',
    maxWidth: '850px',
    margin: '0 auto',
    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
  },
  formTitle: { marginTop: 0, color: '#0f172a', borderBottom: '2px solid #e2e8f0', paddingBottom: '0.5rem' },
  subTitle: { marginTop: '1.5rem', color: '#334155', fontSize: '1.1rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.5rem' },
  hint: { color: '#64748b', fontSize: '0.9rem', marginBottom: '1rem', fontStyle: 'italic' },
  row: { display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1.5rem' },
  fieldGroup: { flex: '1 1 200px', display: 'flex', flexDirection: 'column', gap: '0.4rem' },
  label: { fontSize: '0.875rem', fontWeight: '600', color: '#475569', display: 'flex', alignItems: 'center', gap: '0.35rem' },
  input: { padding: '0.6rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.95rem' },
  gridProductos: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '1rem', marginBottom: '2rem' },
  cardProducto: { backgroundColor: '#f8fafc', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '0.5rem', transition: 'all 0.2s' },
  prodName: { fontSize: '0.9rem', fontWeight: '600', color: '#1e293b' },
  inputCant: { padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '1rem', textAlign: 'center', transition: 'all 0.2s' },
  btnSubmit: { width: '100%', padding: '0.8rem', backgroundColor: '#0284c7', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '1rem', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.2s' },
  alertExito: { backgroundColor: '#dcfce7', color: '#166534', padding: '1rem', borderRadius: '6px', marginBottom: '1rem', border: '2px solid #86efac', fontWeight: '600', whiteSpace: 'pre-wrap' },
  alertError: { backgroundColor: '#fee2e2', color: '#991b1b', padding: '1rem', borderRadius: '6px', marginBottom: '1rem', border: '2px solid #fca5a5', fontWeight: '600', whiteSpace: 'pre-wrap' }
};