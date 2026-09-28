import React, { useState, useEffect } from 'react';
import { db } from '../config/firebase';
import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  orderBy, 
  serverTimestamp 
} from 'firebase/firestore';
import { 
  obtenerInsumos, 
  agregarStockInsumo, 
  inicializarInsumosYRecetas 
} from '../services/recetasService';
import { Archive, Building2, LoaderCircle } from 'lucide-react';

export const GestionInventario = () => {
  const [insumos, setInsumos] = useState([]);
  const [historial, setHistorial] = useState([]);
  
  // Campos del formulario
  const [proveedor, setProveedor] = useState('');
  const [insumoId, setInsumoId] = useState('');
  const [nombreNuevo, setNombreNuevo] = useState('');
  const [unidad, setUnidad] = useState('lbs');
  const [cantidad, setCantidad] = useState('');
  const [costo, setCosto] = useState('');
  const [notas, setNotas] = useState('');
  const [esNuevoInsumo, setEsNuevoInsumo] = useState(false);
  
  const [cargando, setCargando] = useState(false);
  const [cargandoDatos, setCargandoDatos] = useState(true);
  const [mensaje, setMensaje] = useState({ tipo: '', texto: '' });

  // Cargar inventario actual de insumos
  const cargarDatos = async () => {
    try {
      const data = await obtenerInsumos();
      setInsumos(data);
      if (data.length > 0 && !insumoId) {
        setInsumoId(data[0].id);
      }
    } catch (err) {
      console.error("Error al cargar insumos:", err);
    }
  };

  // Cargar historial de compras desde Firestore
  const cargarHistorial = async () => {
    try {
      const q = query(collection(db, "historial_compras"), orderBy("timestamp", "desc"));
      const snapshot = await getDocs(q);
      const lista = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setHistorial(lista);
    } catch (err) {
      console.error("Error al cargar historial de compras:", err);
    }
  };

  useEffect(() => {
    const cargarYInicializar = async () => {
      try {
        await inicializarInsumosYRecetas();
        await cargarDatos();
        await cargarHistorial();
      } finally {
        setCargandoDatos(false);
      }
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
      const targetId = esNuevoInsumo 
        ? nombreNuevo.toLowerCase().trim().replace(/\s+/g, '_') 
        : insumoId;
      
      const targetNombre = esNuevoInsumo 
        ? nombreNuevo.trim() 
        : (insumos.find(i => i.id === insumoId)?.nombre || targetId);

      const targetUnidad = esNuevoInsumo 
        ? unidad 
        : (insumos.find(i => i.id === insumoId)?.unidad || unidad);

      // 1. Actualizar el stock actual mediante recetasService
      await agregarStockInsumo(targetId, targetNombre, targetUnidad, cantidad, proveedor);

      // 2. Registrar el movimiento en el HISTORIAL DE COMPRAS (Firestore)
      await addDoc(collection(db, "historial_compras"), {
        insumoId: targetId,
        nombreInsumo: targetNombre,
        unidad: targetUnidad,
        cantidadComprada: parseFloat(cantidad),
        costoTotal: parseFloat(costo || 0),
        proveedor: proveedor.trim(),
        notas: notas.trim() || 'Sin observaciones',
        fechaRegistro: new Date().toLocaleDateString('es-GT'),
        timestamp: serverTimestamp()
      });

      setMensaje({ 
        tipo: 'exito', 
        texto: `¡Stock actualizado e ingreso guardado en el historial exitosamente desde "${proveedor}"!` 
      });

      // Limpiar formulario
      setCantidad('');
      setCosto('');
      setNotas('');
      setProveedor('');
      setNombreNuevo('');
      setEsNuevoInsumo(false);

      // Recargar inventario e historial actualizado
      await cargarDatos();
      await cargarHistorial();
    } catch (error) {
      setMensaje({ tipo: 'error', texto: error.message });
    } finally {
      setCargando(false);
    }
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.title}><Archive size={22} /> Recepción de Insumos y Registro de Compras</h2>

      {mensaje.texto && (
        <div style={mensaje.tipo === 'error' ? styles.alertError : styles.alertExito}>
          {mensaje.texto}
        </div>
      )}

      {cargandoDatos ? (
        <div style={styles.loadingState} role="status" aria-live="polite">
          <LoaderCircle size={22} style={styles.loadingIcon} />
          <span>Cargando stock...</span>
        </div>
      ) : (
        <>
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
              <select 
                value={insumoId} 
                onChange={(e) => setInsumoId(e.target.value)} 
                style={styles.input}
              >
                {insumos.map(i => (
                  <option key={i.id} value={i.id}>
                    {i.nombre} ({i.unidad}) - Stock actual: {i.stockActual || 0}
                  </option>
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
                  <option value="kg">Kilogramos (kg)</option>
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

          <div style={styles.field}>
            <label style={styles.label}>Costo Total (Q) (Opcional):</label>
            <input
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00"
              value={costo}
              onChange={(e) => setCosto(e.target.value)}
              style={styles.input}
            />
          </div>
        </div>

        <div style={styles.row}>
          <div style={styles.field}>
            <label style={styles.label}>Notas / Observaciones (Factura, etc.):</label>
            <input
              type="text"
              placeholder="Ej. Factura #00124 - Entrega de la mañana"
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              style={styles.input}
            />
          </div>
        </div>

        <button type="submit" style={styles.btnSubmit} disabled={cargando}>
          {cargando ? 'Guardando en Stock e Historial...' : '📥 Ingresar al Inventario y Guardar Historial'}
        </button>
          </form>

          {/* Tabla de Stock Actual */}
          <div style={styles.tableCard}>
        <h3 style={styles.sectionTitle}><Building2 size={18} /> Stock de Insumos en Almacén Central</h3>
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
        </>
      )}

      {/* Tabla de Historial de Entradas */}
      <div style={{ ...styles.tableCard, marginTop: '2rem' }}>
        <h3>📜 Historial de Compras y Recepciones</h3>
        <table style={styles.table}>
          <thead>
            <tr style={styles.th}>
              <th>Fecha</th>
              <th>Proveedor</th>
              <th>Insumo</th>
              <th>Cantidad Ingresada</th>
              <th>Costo Total (Q)</th>
              <th>Notas</th>
            </tr>
          </thead>
          <tbody>
            {historial.length === 0 ? (
              <tr><td colSpan="6" style={styles.tdEmpty}>No se registran compras anteriores en el historial.</td></tr>
            ) : (
              historial.map((h) => (
                <tr key={h.id} style={styles.tr}>
                  <td style={styles.td}>{h.fechaRegistro || 'N/A'}</td>
                  <td style={styles.tdBold}>{h.proveedor}</td>
                  <td style={styles.td}>{h.nombreInsumo}</td>
                  <td style={{ ...styles.tdBold, color: '#0284c7' }}>
                    +{h.cantidadComprada} {h.unidad}
                  </td>
                  <td style={styles.td}>Q {parseFloat(h.costoTotal || 0).toFixed(2)}</td>
                  <td style={{ ...styles.td, fontSize: '0.85rem', color: '#64748b' }}>{h.notas || '-'}</td>
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
  container: { backgroundColor: '#ffffff', padding: '2rem', borderRadius: '12px', maxWidth: '1050px', margin: '0 auto', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' },
  title: { marginTop: 0, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.55rem' },
  sectionTitle: { display: 'flex', alignItems: 'center', gap: '0.5rem' },
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
  alertError: { backgroundColor: '#fee2e2', color: '#991b1b', padding: '0.8rem', borderRadius: '6px', marginBottom: '1rem' },
  loadingState: { minHeight: '220px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', color: '#475569', fontWeight: '700' },
  loadingIcon: { fontSize: '1.5rem' }
};