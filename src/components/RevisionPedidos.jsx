import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../config/firebase";
import { actualizarPedido, aprobarPedido, eliminarPedido } from "../services/pedidosService";
import { NOMBRES_PANES } from "../utils/facturaPdf";
import { EstadoBadge } from './EstadoBadge';
import { ModalDialog } from './ModalDialog';
import { Check, Edit3, ListChecks, Search, Trash2, X } from 'lucide-react';

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

export const RevisionPedidos = () => {
  const [pedidosPendientes, setPedidosPendientes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [mensaje, setMensaje] = useState({ tipo: '', texto: '' });
  const [pedidoEditando, setPedidoEditando] = useState(null);
  const [itemsEditados, setItemsEditados] = useState([]);
  const [modalDialog, setModalDialog] = useState({
    isOpen: false,
    type: 'confirm',
    title: '',
    message: '',
    confirmText: 'Aceptar',
    cancelText: 'Cancelar',
    defaultValue: '',
    inputLabel: '',
    placeholder: '',
    onConfirm: null,
    onCancel: null,
  });

  useEffect(() => {
    cargarPedidosPendientes();
  }, []);

  const cargarPedidosPendientes = async () => {
    setCargando(true);
    try {
      const q = query(
        collection(db, "pedidos"),
        where("estado", "==", "PENDIENTE_REVISION")
      );

      const querySnapshot = await getDocs(q);
      const lista = querySnapshot.docs.map(docSnap => ({
        id: docSnap.id,
        ...docSnap.data()
      }));

      lista.sort((a, b) => {
        const fechaComp = a.fecha.localeCompare(b.fecha);
        if (fechaComp !== 0) return fechaComp;
        return a.turno.localeCompare(b.turno);
      });

      setPedidosPendientes(lista);
    } catch (error) {
      setMensaje({ tipo: 'error', texto: "Error al cargar pedidos: " + error.message });
    } finally {
      setCargando(false);
    }
  };

  const iniciarEdicion = (pedido) => {
    setPedidoEditando({ ...pedido });
    setItemsEditados([...pedido.items]);
    setMensaje({ tipo: '', texto: '' });
  };

  const cancelarEdicion = () => {
    setPedidoEditando(null);
    setItemsEditados([]);
  };

  const actualizarCantidad = (index, nuevaCantidad) => {
    const num = parseInt(nuevaCantidad, 10);
    const itemsActualizados = [...itemsEditados];

    if (nuevaCantidad === '') {
      itemsActualizados[index].cantidad = '';
      setItemsEditados(itemsActualizados);
      return;
    }

    if (isNaN(num)) {
      setMensaje({ tipo: 'error', texto: '❌ La cantidad debe ser un número válido.' });
      return;
    }

    if (num < 0) {
      setMensaje({ tipo: 'error', texto: '❌ La cantidad no puede ser negativa.' });
      return;
    }

    itemsActualizados[index].cantidad = num;
    setItemsEditados(itemsActualizados);
    setMensaje({ tipo: '', texto: '' });
  };

  const eliminarItem = (index) => {
    const itemsActualizados = itemsEditados.filter((_, i) => i !== index);
    setItemsEditados(itemsActualizados);
  };

  const agregarNuevoItem = () => {
    const itemsConCero = itemsEditados.filter(item => !item.cantidad || item.cantidad <= 0);
    if (itemsConCero.length > 0) {
      setMensaje({
        tipo: 'error',
        texto: '❌ No se puede agregar más items: Primero debes completar la cantidad de los items existentes (debe ser > 0).'
      });
      return;
    }

    setItemsEditados([...itemsEditados, { productoId: 'frances', cantidad: 1 }]);
    setMensaje({ tipo: '', texto: '' });
  };

  const continuarGuardarCambios = async () => {
    try {
      await actualizarPedido(pedidoEditando.id, { items: itemsEditados });
      setMensaje({ tipo: 'exito', texto: '✅ Éxito: Pedido actualizado correctamente.' });
      setTimeout(() => {
        cancelarEdicion();
        cargarPedidosPendientes();
      }, 1000);
    } catch (error) {
      setMensaje({ tipo: 'error', texto: `❌ Error al guardar: ${error.message}` });
    }
  };

  const guardarCambios = async () => {
    setMensaje({ tipo: '', texto: '' });

    if (itemsEditados.length === 0) {
      setMensaje({ tipo: 'error', texto: '❌ Error: El pedido debe tener al menos un item. Agrega productos antes de guardar.' });
      return;
    }

    const itemsInvalidos = itemsEditados.filter(item => !item.cantidad || item.cantidad <= 0);
    if (itemsInvalidos.length > 0) {
      const nombresInvalidos = itemsInvalidos.map(item => NOMBRES_PANES[item.productoId] || item.productoId).join(', ');
      setMensaje({
        tipo: 'error',
        texto: `❌ Error de validación: Los siguientes items tienen cantidad inválida (debe ser > 0):\n${nombresInvalidos}\n\nElimina estos items o corrige sus cantidades.`
      });
      return;
    }

    const itemsSospechosos = itemsEditados.filter(item => item.cantidad > 1000000);
    if (itemsSospechosos.length > 0) {
      const nombresSospechosos = itemsSospechosos.map(item => `${NOMBRES_PANES[item.productoId] || item.productoId} (${item.cantidad})`).join(', ');
      setModalDialog({
        isOpen: true,
        type: 'confirm',
        title: 'Confirmación requerida',
        message: `⚠️ ADVERTENCIA: Estos items tienen cantidades muy altas:\n${nombresSospechosos}\n\n¿Está seguro de que desea guardar estas cantidades?`,
        confirmText: 'Sí, guardar',
        cancelText: 'Cancelar',
        onConfirm: async () => {
          setModalDialog(prev => ({ ...prev, isOpen: false }));
          await continuarGuardarCambios();
        },
        onCancel: () => setModalDialog(prev => ({ ...prev, isOpen: false }))
      });
      return;
    }

    await continuarGuardarCambios();
  };

  const aprobar = async (pedidoId) => {
    const pedidoAprobar = pedidosPendientes.find(p => p.id === pedidoId);
    if (!pedidoAprobar) return;

    const totalItems = pedidoAprobar.items?.reduce((acc, item) => acc + item.cantidad, 0) || 0;

    setModalDialog({
      isOpen: true,
      type: 'confirm',
      title: 'Confirmar aprobación',
      message: `✅ Confirmar aprobación\n\nSucursal: ${pedidoAprobar.sucursal}\nFecha: ${pedidoAprobar.fecha}\nTurno: ${pedidoAprobar.turno}\nTotal de items: ${totalItems} unidades\n\n¿Estás seguro de que deseas aprobar este pedido para producción?`,
      confirmText: 'Sí, aprobar',
      cancelText: 'Cancelar',
      onConfirm: async () => {
        setModalDialog(prev => ({ ...prev, isOpen: false }));
        try {
          await aprobarPedido(pedidoId);
          setMensaje({ tipo: 'exito', texto: '✅ Éxito: Pedido aprobado y enviado a producción.' });
          setTimeout(() => cargarPedidosPendientes(), 1000);
        } catch (error) {
          setMensaje({ tipo: 'error', texto: `❌ Error al aprobar: ${error.message}` });
        }
      },
      onCancel: () => setModalDialog(prev => ({ ...prev, isOpen: false }))
    });
  };

  const rechazar = async (pedidoId) => {
    const pedidoRechazar = pedidosPendientes.find(p => p.id === pedidoId);
    if (!pedidoRechazar) return;

    setModalDialog({
      isOpen: true,
      type: 'input',
      title: 'Motivo de rechazo',
      message: `Por favor, ingresa el motivo del rechazo de este pedido:\n\nSucursal: ${pedidoRechazar.sucursal}\nFecha: ${pedidoRechazar.fecha}\nTurno: ${pedidoRechazar.turno}`,
      confirmText: 'Confirmar rechazo',
      cancelText: 'Cancelar',
      defaultValue: 'Ej: Cantidad excesiva',
      inputLabel: 'Motivo',
      placeholder: 'Ej: Cantidad excesiva',
      onConfirm: async (motivo) => {
        setModalDialog(prev => ({ ...prev, isOpen: false }));
        const motivoTrim = motivo?.trim();

        if (!motivoTrim) {
          setMensaje({ tipo: 'error', texto: '⚠️ Debes ingresar un motivo para rechazar el pedido.' });
          return;
        }

        try {
          await eliminarPedido(pedidoId);
          setMensaje({ tipo: 'exito', texto: `✅ Éxito: Pedido rechazado. Motivo registrado: "${motivoTrim}"` });
          setTimeout(() => cargarPedidosPendientes(), 1000);
        } catch (error) {
          setMensaje({ tipo: 'error', texto: `❌ Error al rechazar: ${error.message}` });
        }
      },
      onCancel: () => setModalDialog(prev => ({ ...prev, isOpen: false }))
    });
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.title}><Search size={22} /> Revisión y Validación de Pedidos</h2>
      <p style={styles.subtitle}>Verifica que los pedidos sean correctos antes de enviados a producción</p>

      {mensaje.texto && (
        <div style={mensaje.tipo === 'error' ? styles.alertError : styles.alertExito}>
          {mensaje.texto}
        </div>
      )}

      {cargando ? (
        <p style={styles.loading}>Cargando pedidos pendientes de revisión...</p>
      ) : pedidosPendientes.length === 0 ? (
        <div style={styles.emptySate}>
          <p style={styles.emptyIcon}><ListChecks size={34} /></p>
          <p style={styles.emptyText}>¡No hay pedidos pendientes de revisión!</p>
          <p style={styles.emptySubtext}>Todos los pedidos han sido aprobados o rechazados.</p>
        </div>
      ) : (
        <div style={styles.pedidosGrid}>
          {pedidosPendientes.map((pedido) => (
            <div key={pedido.id} style={styles.pedidoCard}>
              <div style={styles.cardHeader}>
                <div>
                  <h3 style={styles.cardTitle}>{pedido.sucursal}</h3>
                  <p style={styles.cardMeta}>📅 {pedido.fecha} | ⏰ {pedido.turno}</p>
                </div>
                <EstadoBadge estado={pedido.estado} />
              </div>

              {pedidoEditando?.id === pedido.id ? (
                <div style={styles.editMode}>
                  <h4 style={styles.sectionTitle}><Edit3 size={17} /> Editar Items del Pedido</h4>

                  <div style={styles.validationBox}>
                    {itemsEditados.length === 0 && (
                      <div style={styles.validationError}>⚠️ No hay items en el pedido</div>
                    )}
                    {itemsEditados.some(item => !item.cantidad || item.cantidad <= 0) && (
                      <div style={styles.validationError}>⚠️ Hay items sin cantidad válida (deben ser &gt; 0)</div>
                    )}
                    {itemsEditados.some(item => item.cantidad > 1000000) && (
                      <div style={styles.validationWarning}>🚨 ALERTA: Hay cantidades muy altas (posible error de entrada)</div>
                    )}
                    {itemsEditados.length > 0 && itemsEditados.every(item => item.cantidad > 0) && (
                      <div style={styles.validationSuccess}>✅ Validación: Todos los items tienen cantidad válida</div>
                    )}
                  </div>

                  <div style={styles.itemsTable}>
                    <div style={styles.itemHeaderRow}>
                      <div style={styles.itemColPan}>Tipo de Pan</div>
                      <div style={styles.itemColQty}>Cantidad</div>
                      <div style={styles.itemColAction}>Acción</div>
                    </div>

                    {itemsEditados.map((item, index) => (
                      <div key={index} style={styles.itemRow}>
                        <div style={styles.itemColPan}>
                          <select
                            value={item.productoId}
                            onChange={(e) => {
                              const items = [...itemsEditados];
                              items[index].productoId = e.target.value;
                              setItemsEditados(items);
                            }}
                            style={styles.selectPan}
                          >
                            {PRODUCTOS_PAN.map(p => (
                              <option key={p.id} value={p.id}>{p.nombre}</option>
                            ))}
                          </select>
                        </div>
                        <div style={styles.itemColQty}>
                          <input
                            type="number"
                            value={item.cantidad}
                            onChange={(e) => actualizarCantidad(index, e.target.value)}
                            style={{
                              ...styles.inputQty,
                              borderColor: !item.cantidad || item.cantidad <= 0 ? '#ef4444' : item.cantidad > 1000000 ? '#f59e0b' : '#cbd5e1',
                              backgroundColor: !item.cantidad || item.cantidad <= 0 ? '#fee2e2' : item.cantidad > 1000000 ? '#fef3c7' : '#fff'
                            }}
                            min="0"
                            placeholder="Ej: 100"
                          />
                          {(!item.cantidad || item.cantidad <= 0) && (
                            <small style={{ color: '#ef4444', fontSize: '0.7rem', marginTop: '0.2rem' }}>Campo obligatorio</small>
                          )}
                        </div>
                        <div style={styles.itemColAction}>
                          <button
                            onClick={() => eliminarItem(index)}
                            style={styles.btnEliminar}
                            title="Eliminar item"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <button onClick={agregarNuevoItem} style={styles.btnAgregar}>
                    ➕ Agregar otro producto
                  </button>

                  <div style={styles.editActions}>
                    <button onClick={guardarCambios} style={styles.btnGuardar}>
                      ✔ Guardar Cambios
                    </button>
                    <button onClick={cancelarEdicion} style={styles.btnCancelar}>
                      ✕ Cancelar Edición
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div style={styles.itemsList}>
                    {pedido.items?.map((item, idx) => (
                      <div key={idx} style={styles.itemDisplay}>
                        <span style={styles.itemName}>{NOMBRES_PANES[item.productoId] || item.productoId}</span>
                        <span style={styles.itemQty}>{item.cantidad} unidades</span>
                      </div>
                    ))}
                  </div>

                  <div style={styles.actions}>
                    <button onClick={() => iniciarEdicion(pedido)} style={styles.btnEditar}>
                      <Edit3 size={15} /> Editar
                    </button>
                    <button onClick={() => aprobar(pedido.id)} style={styles.btnAprobar}>
                      <Check size={15} /> Aprobar para Producción
                    </button>
                    <button onClick={() => rechazar(pedido.id)} style={styles.btnRechazar}>
                      <X size={15} /> Rechazar
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}

      <ModalDialog
        isOpen={modalDialog.isOpen}
        type={modalDialog.type}
        title={modalDialog.title}
        message={modalDialog.message}
        confirmText={modalDialog.confirmText}
        cancelText={modalDialog.cancelText}
        defaultValue={modalDialog.defaultValue}
        inputLabel={modalDialog.inputLabel}
        placeholder={modalDialog.placeholder}
        onConfirm={modalDialog.onConfirm || (() => {})}
        onCancel={modalDialog.onCancel || (() => {})}
      />
    </div>
  );
};

const styles = {
  container: { maxWidth: '1200px', margin: '0 auto', padding: '2rem', backgroundColor: '#ffffff', borderRadius: '12px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' },
  title: { marginTop: 0, color: '#0f172a', fontSize: '1.8rem', display: 'flex', alignItems: 'center', gap: '0.55rem' },
  subtitle: { color: '#64748b', marginBottom: '1.5rem', fontSize: '0.95rem' },
  loading: { textAlign: 'center', color: '#64748b', padding: '2rem' },
  emptySate: { textAlign: 'center', padding: '3rem 1rem' },
  emptyIcon: { fontSize: '3rem', margin: '0 0 1rem 0' },
  emptyText: { fontSize: '1.2rem', color: '#0f172a', fontWeight: '600', margin: '0 0 0.5rem 0' },
  emptySubtext: { color: '#94a3b8', margin: 0 },
  pedidosGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(450px, 1fr))', gap: '1.5rem' },
  pedidoCard: { backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '1.5rem', boxShadow: '0 2px 4px rgba(0,0,0,0.08)' },
  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.2rem', paddingBottom: '1rem', borderBottom: '2px solid #e2e8f0' },
  cardTitle: { margin: '0 0 0.3rem 0', fontSize: '1.1rem', color: '#0f172a', fontWeight: '700' },
  cardMeta: { margin: 0, fontSize: '0.85rem', color: '#64748b' },
  itemsList: { marginBottom: '1rem' },
  itemDisplay: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.6rem', backgroundColor: '#fff', borderRadius: '6px', marginBottom: '0.4rem', border: '1px solid #f1f5f9' },
  itemName: { fontWeight: '600', color: '#0f172a' },
  itemQty: { color: '#0284c7', fontWeight: '600' },
  editMode: { backgroundColor: '#fff', padding: '1rem', borderRadius: '8px', border: '2px solid #0284c7' },
  sectionTitle: { margin: '0 0 1rem 0', fontSize: '0.95rem', color: '#0f172a', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.45rem' },
  validationBox: { marginBottom: '1rem', padding: '0.8rem', backgroundColor: '#f0f9ff', borderRadius: '6px', border: '1px solid #0284c7' },
  validationSuccess: { color: '#166534', padding: '0.6rem', backgroundColor: '#dcfce7', borderRadius: '4px', fontSize: '0.9rem', fontWeight: '600', borderLeft: '4px solid #16a34a' },
  validationError: { color: '#991b1b', padding: '0.6rem', backgroundColor: '#fee2e2', borderRadius: '4px', fontSize: '0.9rem', fontWeight: '600', borderLeft: '4px solid #ef4444' },
  validationWarning: { color: '#92400e', padding: '0.6rem', backgroundColor: '#fef3c7', borderRadius: '4px', fontSize: '0.9rem', fontWeight: '600', borderLeft: '4px solid #f59e0b' },
  itemsTable: { marginBottom: '1rem' },
  itemHeaderRow: { display: 'grid', gridTemplateColumns: '2fr 1fr 0.5fr', gap: '0.8rem', padding: '0.6rem', backgroundColor: '#0284c7', color: '#fff', borderRadius: '6px', fontWeight: '600', fontSize: '0.85rem', marginBottom: '0.4rem' },
  itemRow: { display: 'grid', gridTemplateColumns: '2fr 1fr 0.5fr', gap: '0.8rem', padding: '0.6rem', backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '6px', marginBottom: '0.4rem', alignItems: 'center' },
  itemColPan: {},
  itemColQty: {},
  itemColAction: { textAlign: 'center' },
  selectPan: { width: '100%', padding: '0.4rem', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '0.85rem' },
  inputQty: { width: '100%', padding: '0.4rem', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '0.85rem', textAlign: 'center' },
  btnEliminar: { backgroundColor: '#fee2e2', color: '#991b1b', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '1rem', padding: '0.3rem 0.5rem' },
  btnAgregar: { width: '100%', padding: '0.6rem', backgroundColor: '#dbeafe', color: '#0369a1', border: '1px dashed #0284c7', borderRadius: '6px', fontWeight: '600', cursor: 'pointer', marginBottom: '0.8rem' },
  actions: { display: 'flex', gap: '0.6rem', flexWrap: 'wrap' },
  editActions: { display: 'flex', gap: '0.6rem', justifyContent: 'flex-end' },
  btnEditar: { flex: 1, padding: '0.6rem', backgroundColor: '#bfdbfe', color: '#1e40af', border: 'none', borderRadius: '6px', fontWeight: '600', cursor: 'pointer' },
  btnAprobar: { flex: 1, padding: '0.6rem', backgroundColor: '#dcfce7', color: '#166534', border: 'none', borderRadius: '6px', fontWeight: '600', cursor: 'pointer' },
  btnRechazar: { flex: 1, padding: '0.6rem', backgroundColor: '#fee2e2', color: '#991b1b', border: 'none', borderRadius: '6px', fontWeight: '600', cursor: 'pointer' },
  btnGuardar: { flex: 1, padding: '0.6rem', backgroundColor: '#16a34a', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: '600', cursor: 'pointer' },
  btnCancelar: { flex: 1, padding: '0.6rem', backgroundColor: '#e2e8f0', color: '#334155', border: 'none', borderRadius: '6px', fontWeight: '600', cursor: 'pointer' },
  alertExito: { backgroundColor: '#dcfce7', color: '#166534', padding: '1rem', borderRadius: '6px', marginBottom: '1rem', fontWeight: '600', border: '2px solid #86efac', whiteSpace: 'pre-wrap' },
  alertError: { backgroundColor: '#fee2e2', color: '#991b1b', padding: '1rem', borderRadius: '6px', marginBottom: '1rem', fontWeight: '600', border: '2px solid #fca5a5', whiteSpace: 'pre-wrap' }
};
