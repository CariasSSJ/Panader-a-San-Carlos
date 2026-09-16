import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../config/firebase";
import { obtenerRecetas, obtenerInsumos } from "../services/recetasService";
import { procesarProduccion } from "../services/pedidosService";
import { PRECIOS_PANES, NOMBRES_PANES, generarFacturaPDF } from "../utils/facturaPdf";

const SUCURSALES = [
  { id: 'TODAS', nombre: '-- Todas las Sucursales --' },
  { id: 'CENTRAL', nombre: 'Sucursal Central' },
  { id: 'CHIVA', nombre: 'Sucursal Chiva' },
  { id: 'BARCO', nombre: 'Sucursal Barco' },
  { id: 'TERMINAL', nombre: 'Sucursal Terminal' }
];

export const PanelProduccion = () => {
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);
  const [turno, setTurno] = useState('Mañana');
  const [sucursalFiltro, setSucursalFiltro] = useState('TODAS');
  
  const [pedidos, setPedidos] = useState([]);
  const [totalesPan, setTotalesPan] = useState({});
  const [totalesInsumos, setTotalesInsumos] = useState({});
  const [materiaPrimaRequerida, setMateriaPrimaRequerida] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [procesando, setProcesando] = useState(false);
  const [listoParaProcesar, setListoParaProcesar] = useState(false);
  const [mensaje, setMensaje] = useState({ tipo: '', texto: '' });

  // 1. Cargar pedidos con filtros dinámicos
  // 1. Cargar pedidos con filtro por Sucursal, Fecha y Turno
  const cargarPedidosFiltro = async () => {
    setCargando(true);
    setMensaje({ tipo: '', texto: '' });
    setListoParaProcesar(false);
    setTotalesPan({});
    setTotalesInsumos({});

    try {
      // Consultamos los pedidos de la fecha y turno indicados
      const q = query(
        collection(db, "pedidos"),
        where("fecha", "==", fecha),
        where("turno", "==", turno)
      );

      const querySnapshot = await getDocs(q);
      let listaPedidos = [];

      querySnapshot.forEach((docSnap) => {
        listaPedidos.push({ id: docSnap.id, ...docSnap.data() });
      });

      // Si el filtro no es 'TODAS', filtramos los resultados localmente
      if (sucursalFiltro !== 'TODAS') {
        listaPedidos = listaPedidos.filter((p) => {
          if (!p.sucursal) return false;
          const sucPedido = p.sucursal.toLowerCase().trim();
          const sucFiltro = sucursalFiltro.toLowerCase().trim();
          
          // Compara si coincide el ID corto (ej: "chiva") o el nombre largo (ej: "Sucursal Chiva")
          return sucPedido === sucFiltro || 
                 sucPedido.includes(sucFiltro) || 
                 sucFiltro.includes(sucPedido);
        });
      }

      setPedidos(listaPedidos);
    } catch (error) {
      setMensaje({ tipo: 'error', texto: "Error al consultar pedidos: " + error.message });
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarPedidosFiltro();
  }, [fecha, turno, sucursalFiltro]);

  // 2. Calcular Consolidado de Panes, Totales Monetarios e Insumos
  const handleCalcularConsolidado = async () => {
    if (pedidos.length === 0) {
      setMensaje({ tipo: 'error', texto: 'No hay pedidos registrados para el filtro seleccionado.' });
      return;
    }

    try {
      setCargando(true);

      // Consolidar total de panes
      const acumuladoPan = {};
      pedidos.forEach(ped => {
        ped.items?.forEach(item => {
          acumuladoPan[item.productoId] = (acumuladoPan[item.productoId] || 0) + Number(item.cantidad);
        });
      });
      setTotalesPan(acumuladoPan);

      // Consultar recetas e insumos
      const recetas = await obtenerRecetas();
      const insumosCat = await obtenerInsumos();
      const mapInsumos = {};
      insumosCat.forEach(i => { mapInsumos[i.id] = i; });

      // Calcular insumos necesarios
      const acumuladoInsumos = {};
      const listaRequerida = [];

      Object.entries(acumuladoPan).forEach(([prodId, cantPan]) => {
        const ingredientes = recetas[prodId] || [];
        ingredientes.forEach(ing => {
          const req = ing.cantidad * cantPan;
          if (!acumuladoInsumos[ing.insumoId]) {
            const info = mapInsumos[ing.insumoId] || { nombre: ing.insumoId, unidad: 'lbs' };
            acumuladoInsumos[ing.insumoId] = {
              nombre: info.nombre,
              unidad: info.unidad,
              cantidad: 0
            };
          }
          acumuladoInsumos[ing.insumoId].cantidad += req;
        });
      });

      Object.entries(acumuladoInsumos).forEach(([insumoId, data]) => {
        listaRequerida.push({
          insumoId,
          nombreInsumo: data.nombre,
          unidad: data.unidad,
          cantidadRequerida: data.cantidad
        });
      });

      setTotalesInsumos(acumuladoInsumos);
      setMateriaPrimaRequerida(listaRequerida);
      setListoParaProcesar(true);
      setMensaje({ tipo: 'exito', texto: '¡Cálculo de consolidado e insumos realizado exitosamente!' });
    } catch (err) {
      setMensaje({ tipo: 'error', texto: "Error al calcular insumos: " + err.message });
    } finally {
      setCargando(false);
    }
  };

  // 3. Procesar, descontar del stock y generar PDF
  const handleProcesarYDescontar = async () => {
    try {
      setProcesando(true);
      // Descuento transaccional en Firestore
      await procesarProduccion(materiaPrimaRequerida);

      // Generar Factura / Remisión en PDF
      generarFacturaPDF({
        sucursal: sucursalFiltro === 'TODAS' ? 'Consolidado General' : sucursalFiltro,
        fecha,
        turno,
        pedidosProcesados: pedidos,
        totalesPan,
        totalesInsumos
      });

      setMensaje({ 
        tipo: 'exito', 
        texto: '¡Producción procesada con éxito! El stock ha sido descontado y la factura PDF se ha descargado.' 
      });
      setListoParaProcesar(false);
    } catch (error) {
      setMensaje({ tipo: 'error', texto: "Error en el procesamiento: " + error.message });
    } finally {
      setProcesando(false);
    }
  };

  // Calcular Gran Total Monetario en pantalla
  const granTotalMonetario = Object.entries(totalesPan).reduce((acc, [prodId, cant]) => {
    const p = PRECIOS_PANES[prodId] || 1.00;
    return acc + (cant * p);
  }, 0);

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>Panel de Control de Producción (Consolidado)</h2>

      {mensaje.texto && (
        <div style={mensaje.tipo === 'error' ? styles.alertError : styles.alertExito}>
          {mensaje.texto}
        </div>
      )}

      {/* FILTROS PERSONALIZADOS */}
      <div style={styles.filterCard}>
        <div style={styles.filterGroup}>
          <label style={styles.label}>Filtrar por Sucursal:</label>
          <select value={sucursalFiltro} onChange={(e) => setSucursalFiltro(e.target.value)} style={styles.input}>
            {SUCURSALES.map(s => (
              <option key={s.id} value={s.id}>{s.nombre}</option>
            ))}
          </select>
        </div>

        <div style={styles.filterGroup}>
          <label style={styles.label}>Fecha:</label>
          <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} style={styles.input} />
        </div>

        <div style={styles.filterGroup}>
          <label style={styles.label}>Turno:</label>
          <select value={turno} onChange={(e) => setTurno(e.target.value)} style={styles.input}>
            <option value="Mañana">Mañana</option>
            <option value="Tarde">Tarde</option>
          </select>
        </div>
      </div>

      {/* RESULTADOS DE PEDIDOS ENCONTRADOS */}
      <div style={styles.card}>
        <h3>Pedidos Encontrados ({pedidos.length})</h3>
        {cargando ? (
          <p>Cargando información...</p>
        ) : pedidos.length === 0 ? (
          <p style={styles.emptyText}>No hay pedidos para los filtros seleccionados.</p>
        ) : (
          <ul style={styles.list}>
            {pedidos.map(p => (
              <li key={p.id} style={styles.listItem}>
                <strong>{p.sucursal}</strong> - Estado: <span style={styles.badge}>{p.estado}</span>
              </li>
            ))}
          </ul>
        )}

        {pedidos.length > 0 && (
          <button onClick={handleCalcularConsolidado} style={styles.btnCalcular} disabled={cargando}>
            ⚡ Calcular Consolidado e Insumos
          </button>
        )}
      </div>

      {/* VISTA PREVIA DEL CONSOLIDADO Y PRECIOS */}
      {Object.keys(totalesPan).length > 0 && (
        <div style={styles.grid}>
          {/* Tabla Panes y Precios */}
          <div style={styles.card}>
            <h3>Detalle de Panes y Costos</h3>
            <table style={styles.table}>
              <thead>
                <tr style={styles.th}>
                  <th>Producto</th>
                  <th>Cantidad</th>
                  <th>P. Unitario</th>
                  <th>Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(totalesPan).map(([prodId, cant]) => {
                  const pu = PRECIOS_PANES[prodId] || 1.00;
                  const sub = cant * pu;
                  return (
                    <tr key={prodId} style={styles.tr}>
                      <td style={styles.tdBold}>{NOMBRES_PANES[prodId] || prodId}</td>
                      <td style={styles.td}>{cant}</td>
                      <td style={styles.td}>Q {pu.toFixed(2)}</td>
                      <td style={styles.tdBold}>Q {sub.toFixed(2)}</td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr style={styles.trTotal}>
                  <td colSpan="3" style={styles.tdTotalLabel}>TOTAL PRODUCCIÓN:</td>
                  <td style={styles.tdTotalVal}>Q {granTotalMonetario.toFixed(2)}</td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Tabla Insumos Necesarios */}
          <div style={styles.card}>
            <h3>Insumos Totales Requeridos</h3>
            <table style={styles.table}>
              <thead>
                <tr style={styles.th}>
                  <th>Insumo</th>
                  <th>Cantidad Requerida</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(totalesInsumos).map(([id, data]) => (
                  <tr key={id} style={styles.tr}>
                    <td style={styles.tdBold}>{data.nombre}</td>
                    <td style={styles.tdBold}>{data.cantidad.toFixed(2)} {data.unidad}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* BOTÓN VERDE DE PROCESAR Y DESCONTAR CON FACTURA PDF */}
      {listoParaProcesar && (
        <div style={styles.actionContainer}>
          <button 
            onClick={handleProcesarYDescontar} 
            style={styles.btnProcesar} 
            disabled={procesando}
          >
            {procesando ? 'Procesando y Descontando Stock...' : '✔ Procesar, Descontar Stock y Generar Factura PDF'}
          </button>
        </div>
      )}
    </div>
  );
};

const styles = {
  container: { backgroundColor: '#ffffff', padding: '2rem', borderRadius: '12px', maxWidth: '1050px', margin: '0 auto', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' },
  title: { marginTop: 0, color: '#0f172a' },
  filterCard: { display: 'flex', gap: '1rem', flexWrap: 'wrap', backgroundColor: '#f8fafc', padding: '1.2rem', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '1.5rem' },
  filterGroup: { flex: '1 1 200px', display: 'flex', flexDirection: 'column', gap: '0.4rem' },
  label: { fontSize: '0.85rem', fontWeight: 'bold', color: '#475569' },
  input: { padding: '0.6rem', borderRadius: '6px', border: '1px solid #cbd5e1' },
  card: { backgroundColor: '#f8fafc', padding: '1.2rem', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '1.5rem' },
  emptyText: { color: '#94a3b8', fontStyle: 'italic' },
  list: { paddingLeft: '1.2rem', margin: '0.5rem 0 1rem 0' },
  listItem: { marginBottom: '0.4rem' },
  badge: { backgroundColor: '#e0f2fe', color: '#0369a1', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 'bold' },
  btnCalcular: { width: '100%', padding: '0.75rem', backgroundColor: '#0284c7', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { textAlign: 'left', borderBottom: '2px solid #e2e8f0', padding: '0.5rem', color: '#475569', fontSize: '0.85rem' },
  tr: { borderBottom: '1px solid #f1f5f9' },
  td: { padding: '0.5rem' },
  tdBold: { padding: '0.5rem', fontWeight: 'bold' },
  trTotal: { backgroundColor: '#f1f5f9' },
  tdTotalLabel: { padding: '0.6rem', fontWeight: 'bold', textAlign: 'right' },
  tdTotalVal: { padding: '0.6rem', fontWeight: 'bold', color: '#16a34a' },
  actionContainer: { marginTop: '1rem', textAlign: 'center' },
  btnProcesar: { width: '100%', padding: '1rem', backgroundColor: '#16a34a', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '1.05rem', cursor: 'pointer', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' },
  alertExito: { backgroundColor: '#dcfce7', color: '#166534', padding: '0.8rem', borderRadius: '6px', marginBottom: '1rem' },
  alertError: { backgroundColor: '#fee2e2', color: '#991b1b', padding: '0.8rem', borderRadius: '6px', marginBottom: '1rem' }
};
