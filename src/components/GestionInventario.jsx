import React, { useState, useEffect } from 'react';
import { obtenerInsumos, agregarStockInsumo, inicializarInsumosYRecetas } from '../services/recetasService';


export const GestionInventario = () => {
  const [insumos, setInsumos] = useState([]);
  const [proveedor, setProveedor] = useState('');
  const [insumoId, setInsumoId] = useState('harina_fuerza');
  const [nombreNuevo, setNombreNuevo] = useState('');
  const [unidad, setUnidad] = useState('lbs');
  const [cantidad, setCantidad] = useState('');
  const [esNuevoInsumo, setEsNuevoInsumo] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [mensaje, setMensaje] = useState({ tipo: '', texto: '' });

  const cargarDatos = async () => {
    try {
      const data = await obtenerInsumos();
      setInsumos(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    const cargarYInicializar = async () => {
        
    await inicializarInsumosYRecetas();

    await cargarDatos();
    };

    cargarYInicializar();
  }, []);

  const handleIngresarStock = async (e) => {
    e.preventDefault();
    if (!proveedor || !cantidad || Number(cantidad) <= 0) {
      setMensaje({ tipo: 'error', texto: 'Ingrese un proveedor y una cantidad válida.' });
      return;
    }

    try {
      setCargando(true);
      const targetId = esNuevoInsumo ? nombreNuevo.toLowerCase().replace(/\s+/g, '_') : insumoId;
      const targetNombre = esNuevoInsumo ? nombreNuevo : (insumos.find(i => i.id === insumoId)?.nombre || targetId);

      await agregarStockInsumo(targetId, targetNombre, unidad, cantidad, proveedor);
      
      setMensaje({ tipo: 'exito', texto: `¡Stock actualizado correctamente desde el proveedor "${proveedor}"!` });
      setCantidad('');
      setProveedor('');
      setNombreNuevo('');
      setEsNuevoInsumo(false);
      cargarDatos(); // Recargar inventario
    } catch (error) {
      setMensaje({ tipo: 'error', texto: error.message });
    } finally {
      setCargando(false);
    }
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>Recepción de Insumos y Compras a Proveedores</h2>

      {mensaje.texto && (
        <div style={mensaje.tipo === 'error' ? styles.alertError : styles.alertExito}>
          {mensaje.texto}
        </div>
      )}

      {/* Formulario de Entrada de Mercadería */}
      <form onSubmit={handleIngresarStock} style={styles.formCard}>
        <h3>Registrar Ingreso de Materia Prima</h3>
        
        <div style={styles.row}>
          <div style={styles.field}>
            <label style={styles.label}>Proveedor:</label>
            <input
              type="text"
              placeholder="Ej. Molinos Modernos S.A."
              value={proveedor}
              onChange={(e) => setProveedor(e.target.value)}
              style={styles.input}
              required
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>¿Insumo Existente o Nuevo?</label>
            <select
              value={esNuevoInsumo ? "NUEVO" : "EXISTENTE"}
              onChange={(e) => setEsNuevoInsumo(e.target.value === "NUEVO")}
              style={styles.input}
            >
              <option value="EXISTENTE">Insumo Existente en Catálogo</option>
              <option value="NUEVO">+ Registrar Nuevo Insumo</option>
            </select>
          </div>
        </div>

        <div style={styles.row}>
          {!esNuevoInsumo ? (
            <div style={styles.field}>
              <label style={styles.label}>Insumo:</label>
              <select value={insumoId} onChange={(e) => setInsumoId(e.target.value)} style={styles.input}>
                {insumos.map(i => (
                  <option key={i.id} value={i.id}>{i.nombre} ({i.unidad})</option>
                ))}
              </select>
            </div>
          ) : (
            <>
              <div style={styles.field}>
                <label style={styles.label}>Nombre Insumo Nuevo:</label>
                <input
                  type="text"
                  placeholder="Ej. Mantequilla sin Sal"
                  value={nombreNuevo}
                  onChange={(e) => setNombreNuevo(e.target.value)}
                  style={styles.input}
                  required
                />
              </div>
              <div style={styles.field}>
                <label style={styles.label}>Unidad de Medida:</label>
                <select value={unidad} onChange={(e) => setUnidad(e.target.value)} style={styles.input}>
                  <option value="lbs">Libras (lbs)</option>
                  <option value="litros">Litros</option>
                  <option value="oz">Onzas (oz)</option>
                  <option value="unidades">Unidades</option>
                </select>
              </div>
            </>
          )}

          <div style={styles.field}>
            <label style={styles.label}>Cantidad a Ingresar:</label>
            <input
              type="number"
              min="0.1"
              step="any"
              placeholder="0.00"
              value={cantidad}
              onChange={(e) => setCantidad(e.target.value)}
              style={styles.input}
              required
            />
          </div>
        </div>

        <button type="submit" style={styles.btnSubmit} disabled={cargando}>
          {cargando ? 'Guardando en Stock...' : 'Ingresar al Inventario'}
        </button>
      </form>

      {/* Tabla de Stock Actual */}
      <div style={styles.tableCard}>
        <h3>Stock de Insumos en Almacén Central</h3>
        <table style={styles.table}>
          <thead>
            <tr style={styles.th}>
              <th>Insumo</th>
              <th>Stock Disponible</th>
              <th>Unidad</th>
              <th>Último Proveedor</th>
            </tr>
          </thead>
          <tbody>
            {insumos.length === 0 ? (
              <tr><td colSpan="4" style={styles.tdEmpty}>No hay insumos registrados</td></tr>
            ) : (
              insumos.map(item => (
                <tr key={item.id} style={styles.tr}>
                  <td style={styles.tdBold}>{item.nombre}</td>
                  <td style={{ ...styles.tdBold, color: item.stockActual < 50 ? '#dc2626' : '#16a34a' }}>
                    {item.stockActual}
                  </td>
                  <td style={styles.td}>{item.unidad}</td>
                  <td style={styles.td}>{item.ultimoProveedor || 'N/A'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const styles = {
  container: { backgroundColor: '#ffffff', padding: '2rem', borderRadius: '12px', maxWidth: '1000px', margin: '0 auto', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' },
  title: { marginTop: 0, color: '#0f172a' },
  formCard: { backgroundColor: '#f8fafc', padding: '1.5rem', borderRadius: '8px', marginBottom: '2rem', border: '1px solid #e2e8f0' },
  row: { display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1rem' },
  field: { flex: '1 1 200px', display: 'flex', flexDirection: 'column', gap: '0.4rem' },
  label: { fontSize: '0.85rem', fontWeight: 'bold', color: '#475569' },
  input: { padding: '0.6rem', borderRadius: '6px', border: '1px solid #cbd5e1' },
  btnSubmit: { width: '100%', padding: '0.75rem', backgroundColor: '#0284c7', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' },
  tableCard: { border: '1px solid #e2e8f0', borderRadius: '8px', padding: '1rem' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { textAlign: 'left', borderBottom: '2px solid #e2e8f0', padding: '0.6rem', color: '#475569', fontSize: '0.85rem' },
  tr: { borderBottom: '1px solid #f1f5f9' },
  td: { padding: '0.6rem' },
  tdBold: { padding: '0.6rem', fontWeight: 'bold' },
  tdEmpty: { padding: '1rem', textAlign: 'center', color: '#94a3b8' },
  alertExito: { backgroundColor: '#dcfce7', color: '#166534', padding: '0.8rem', borderRadius: '6px', marginBottom: '1rem' },
  alertError: { backgroundColor: '#fee2e2', color: '#991b1b', padding: '0.8rem', borderRadius: '6px', marginBottom: '1rem' }
};