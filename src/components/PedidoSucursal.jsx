import React, { useState } from 'react';
import { registrarPedido } from '../services/pedidosService';

// Tipos de pan listados en el enunciado
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

  // Controlar cambio en inputs de cantidades
  const handleCantidadChange = (productoId, valor) => {
    const num = parseInt(valor, 10);
    setCantidades(prev => ({
      ...prev,
      [productoId]: isNaN(num) || num < 0 ? 0 : num
    }));
  };

  // Enviar el pedido a Firestore
  const handleSubmit = async (e) => {
    e.preventDefault();
    setMensaje({ tipo: '', texto: '' });

    // Validar que al menos un producto tenga cantidad > 0
    const items = Object.entries(cantidades)
      .filter(([_, cant]) => cant > 0)
      .map(([productoId, cantidad]) => ({ productoId, cantidad }));

    if (items.length === 0) {
      setMensaje({ tipo: 'error', texto: 'Debe ingresar al menos una cantidad de pan mayor a 0.' });
      return;
    }

    try {
      setCargando(true);
      await registrarPedido(sucursal, fecha, turno, items);
      setMensaje({ tipo: 'exito', texto: `¡Pedido enviado con éxito para la sucursal ${sucursal} (${turno})!` });
      setCantidades({}); // Limpiar campos
    } catch (error) {
      setMensaje({ tipo: 'error', texto: `Error al enviar pedido: ${error.message}` });
    } finally {
      setCargando(false);
    }
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
            <label style={styles.label}>Sucursal Requiere:</label>
            <select style={styles.input} value={sucursal} onChange={(e) => setSucursal(e.target.value)}>
              {SUCURSALES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          <div style={styles.fieldGroup}>
            <label style={styles.label}>Fecha:</label>
            <input 
              type="date" 
              style={styles.input} 
              value={fecha} 
              onChange={(e) => setFecha(e.target.value)} 
              required 
            />
          </div>

          <div style={styles.fieldGroup}>
            <label style={styles.label}>Turno de Entrega:</label>
            <select style={styles.input} value={turno} onChange={(e) => setTurno(e.target.value)}>
              <option value="Mañana">Mañana</option>
              <option value="Tarde">Tarde</option>
            </select>
          </div>
        </div>

        <h3 style={styles.subTitle}>Selección de Productos (Unidades)</h3>
        
        <div style={styles.gridProductos}>
          {PRODUCTOS_PAN.map(prod => (
            <div key={prod.id} style={styles.cardProducto}>
              <label style={styles.prodName}>{prod.nombre}</label>
              <input
                type="number"
                min="0"
                placeholder="0"
                style={styles.inputCant}
                value={cantidades[prod.id] || ''}
                onChange={(e) => handleCantidadChange(prod.id, e.target.value)}
              />
            </div>
          ))}
        </div>

        <button type="submit" style={styles.btnSubmit} disabled={cargando}>
          {cargando ? 'Guardando en Firebase...' : 'Enviar Pedido a Fábrica'}
        </button>
      </form>
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
  subTitle: { marginTop: '1.5rem', color: '#334155', fontSize: '1.1rem' },
  row: { display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1.5rem' },
  fieldGroup: { flex: '1 1 200px', display: 'flex', flexDirection: 'column', gap: '0.4rem' },
  label: { fontSize: '0.875rem', fontWeight: '600', color: '#475569' },
  input: { padding: '0.6rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.95rem' },
  gridProductos: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '1rem', marginBottom: '2rem' },
  cardProducto: { backgroundColor: '#f8fafc', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '0.5rem' },
  prodName: { fontSize: '0.9rem', fontWeight: '600', color: '#1e293b' },
  inputCant: { padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '1rem', textAlign: 'center' },
  btnSubmit: { width: '100%', padding: '0.8rem', backgroundColor: '#0284c7', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '1rem', fontWeight: 'bold', cursor: 'pointer' },
  alertExito: { backgroundColor: '#dcfce7', color: '#166534', padding: '0.8rem', borderRadius: '6px', marginBottom: '1rem', border: '1px solid #bbf7d0' },
  alertError: { backgroundColor: '#fee2e2', color: '#991b1b', padding: '0.8rem', borderRadius: '6px', marginBottom: '1rem', border: '1px solid #fecaca' }
};