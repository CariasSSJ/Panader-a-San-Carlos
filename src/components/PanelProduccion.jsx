import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../config/firebase";
import { inicializarInsumosYRecetas, obtenerRecetas, obtenerInsumos } from "../services/recetasService";
import { procesarProduccion } from "../services/pedidosService";

export const PanelProduccion = () => {
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);
  const [turno, setTurno] = useState('Mañana');
  const [pedidos, setPedidos] = useState([]);
  const [totalesPan, setTotalesPan] = useState({});
  const [totalesInsumos, setTotalesInsumos] = useState({});
  const [insumosInfo, setInsumosInfo] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [mensaje, setMensaje] = useState({ tipo: '', texto: '' });

  // Inicializar catálogos al cargar el componente
  useEffect(() => {
    inicializarInsumosYRecetas();
  }, []);

  // Consultar pedidos y realizar cálculo de consolidado e insumos
  const consultarConsolidado = async () => {
    try {
      setCargando(true);
      setMensaje({ tipo: '', texto: '' });

      // 1. Obtener pedidos por fecha y turno
      const q = query(
        collection(db, "pedidos"),
        where("fecha", "==", fecha),
        where("turno", "==", turno)
      );

      const querySnapshot = await getDocs(q);
      const listaPedidos = [];
      const acumuladoPan = {};

      querySnapshot.forEach(docSnap => {
        const ped = docSnap.data();
        listaPedidos.push({ id: docSnap.id, ...ped });

        // Acumular producción de pan
        ped.items.forEach(item => {
          acumuladoPan[item.productoId] = (acumuladoPan[item.productoId] || 0) + item.cantidad;
        });
      });

      setPedidos(listaPedidos);
      setTotalesPan(acumuladoPan);

      // 2. Calcular explosión de insumos con base en las recetas
      const recetas = await obtenerRecetas();
      const insumosList = await obtenerInsumos();
      setInsumosInfo(insumosList);

      const acumuladoInsumos = {};

      Object.entries(acumuladoPan).forEach(([productoId, cantidadPan]) => {
        const receta = recetas[productoId] || [];
        receta.forEach(ing => {
          acumuladoInsumos[ing.insumoId] = (acumuladoInsumos[ing.insumoId] || 0) + (ing.cantidad * cantidadPan);
        });
      });

      setTotalesInsumos(acumuladoInsumos);
    } catch (error) {
      setMensaje({ tipo: 'error', texto: `Error al consultar datos: ${error.message}` });
    } finally {
      setCargando(false);
    }
  };

  // Procesar la orden de producción y descontar inventarios
  const handleProcesarProduccion = async () => {
    try {
      setCargando(true);
      const itemsAProcesar = Object.entries(totalesInsumos).map(([insumoId, cantidadRequerida]) => ({
        insumoId,
        cantidadRequerida
      }));

      if (itemsAProcesar.length === 0) {
        setMensaje({ tipo: 'error', texto: 'No hay insumos que procesar para el turno seleccionado.' });
        return;
      }

      await procesarProduccion(itemsAProcesar);
      setMensaje({ tipo: 'exito', texto: '¡Producción procesada exitosamente! Stock de insumos actualizado.' });
      consultarConsolidado(); // Recargar datos
    } catch (error) {
      setMensaje({ tipo: 'error', texto: error.message });
    } finally {
      setCargando(false);
    }
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>Panel de Control de Producción (Sr. Kevin)</h2>

      {mensaje.texto && (
        <div style={mensaje.tipo === 'error' ? styles.alertError : styles.alertExito}>
          {mensaje.texto}
        </div>
      )}

      {/* Filtros de Fecha y Turno */}
      <div style={styles.filterRow}>
        <div style={styles.field}>
          <label style={styles.label}>Fecha Producción:</label>
          <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} style={styles.input} />
        </div>
        <div style={styles.field}>
          <label style={styles.label}>Turno:</label>
          <select value={turno} onChange={(e) => setTurno(e.target.value)} style={styles.input}>
            <option value="Mañana">Mañana</option>
            <option value="Tarde">Tarde</option>
          </select>
        </div>
        <button onClick={consultarConsolidado} style={styles.btnPrimary} disabled={cargando}>
          {cargando ? 'Consultando...' : 'Calcular Consolidado e Insumos'}
        </button>
      </div>

      <div style={styles.tablesGrid}>
        {/* Tabla 1: Consolidado de Pan a Fabricar */}
        <div style={styles.card}>
          <h3>Total de Pan Requerido (Todas las Sucursales)</h3>
          <table style={styles.table}>
            <thead>
              <tr style={styles.th}>
                <th>Producto / Clase Pan</th>
                <th>Total Unidades</th>
              </tr>
            </thead>
            <tbody>
              {Object.keys(totalesPan).length === 0 ? (
                <tr><td colSpan="2" style={styles.tdEmpty}>No hay pedidos para este turno</td></tr>
              ) : (
                Object.entries(totalesPan).map(([producto, cant]) => (
                  <tr key={producto} style={styles.tr}>
                    <td style={styles.tdCapital}>{producto}</td>
                    <td style={styles.tdBold}>{cant} u.</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Tabla 2: Explosión de Insumos / Ingredientes Necesarios */}
        <div style={styles.card}>
          <h3>Insumos / Ingredientes Requeridos</h3>
          <table style={styles.table}>
            <thead>
              <tr style={styles.th}>
                <th>Insumo</th>
                <th>Requerido</th>
                <th>Stock Actual</th>
              </tr>
            </thead>
            <tbody>
              {Object.keys(totalesInsumos).length === 0 ? (
                <tr><td colSpan="3" style={styles.tdEmpty}>Sin insumos calculados</td></tr>
              ) : (
                Object.entries(totalesInsumos).map(([insumoId, cantReq]) => {
                  const insumoObj = insumosInfo.find(i => i.id === insumoId);
                  const nombre = insumoObj ? insumoObj.nombre : insumoId;
                  const unidad = insumoObj ? insumoObj.unidad : '';
                  const stock = insumoObj ? insumoObj.stockActual : 0;
                  const sinStock = stock < cantReq;

                  return (
                    <tr key={insumoId} style={sinStock ? styles.trWarning : styles.tr}>
                      <td style={styles.tdCapital}>{nombre}</td>
                      <td style={styles.tdBold}>{cantReq.toFixed(2)} {unidad}</td>
                      <td style={{ ...styles.tdBold, color: sinStock ? '#dc2626' : '#16a34a' }}>
                        {stock} {unidad}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>

          {Object.keys(totalesInsumos).length > 0 && (
            <button onClick={handleProcesarProduccion} style={styles.btnSuccess} disabled={cargando}>
              Procesar y Descontar Stock
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: { backgroundColor: '#ffffff', padding: '2rem', borderRadius: '12px', maxWidth: '1100px', margin: '0 auto', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' },
  title: { marginTop: 0, color: '#0f172a' },
  filterRow: { display: 'flex', gap: '1rem', alignItems: 'flex-end', marginBottom: '2rem', backgroundColor: '#f8fafc', padding: '1rem', borderRadius: '8px' },
  field: { display: 'flex', flexDirection: 'column', gap: '0.4rem' },
  label: { fontSize: '0.85rem', fontWeight: 'bold', color: '#475569' },
  input: { padding: '0.6rem', borderRadius: '6px', border: '1px solid #cbd5e1' },
  btnPrimary: { padding: '0.6rem 1.2rem', backgroundColor: '#0284c7', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' },
  btnSuccess: { width: '100%', marginTop: '1rem', padding: '0.8rem', backgroundColor: '#16a34a', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' },
  tablesGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' },
  card: { border: '1px solid #e2e8f0', borderRadius: '8px', padding: '1rem' },
  table: { width: '100%', borderCollapse: 'collapse', marginTop: '0.5rem' },
  th: { textAlign: 'left', borderBottom: '2px solid #e2e8f0', padding: '0.5rem', color: '#475569', fontSize: '0.85rem' },
  tr: { borderBottom: '1px solid #f1f5f9' },
  trWarning: { borderBottom: '1px solid #fecaca', backgroundColor: '#fef2f2' },
  tdCapital: { padding: '0.6rem 0.5rem', textTransform: 'capitalize' },
  tdBold: { padding: '0.6rem 0.5rem', fontWeight: 'bold' },
  tdEmpty: { padding: '1rem', textAlign: 'center', color: '#94a3b8' },
  alertExito: { backgroundColor: '#dcfce7', color: '#166534', padding: '0.8rem', borderRadius: '6px', marginBottom: '1rem' },
  alertError: { backgroundColor: '#fee2e2', color: '#991b1b', padding: '0.8rem', borderRadius: '6px', marginBottom: '1rem' }
};