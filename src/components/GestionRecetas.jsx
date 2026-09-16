import React, { useState, useEffect } from 'react';
import { obtenerInsumos, obtenerRecetas, guardarRecetaProducto } from '../services/recetasService';


const PRODUCTOS_PAN = [
  { id: 'frances', nombre: 'Francés' },
  { id: 'aleman', nombre: 'Alemán' },
  { id: 'shecas', nombre: 'Shecas' },
  { id: 'cubos', nombre: 'Cubos-Especial' },
  { id: 'cachos', nombre: 'Cachos' },
  { id: 'cortadas', nombre: 'Cortadas' },
  { id: 'batidas', nombre: 'Batidas' },
  { id: 'campechanas', nombre: 'Campechanas' }
];

export const GestionRecetas = () => {
  const [productoSeleccionado, setProductoSeleccionado] = useState('frances');
  const [insumosDisponibles, setInsumosDisponibles] = useState([]);
  const [ingredientesReceta, setIngredientesReceta] = useState([]);
  const [insumoToAdd, setInsumoToAdd] = useState('');
  const [cantToAdd, setCantToAdd] = useState('');
  const [mensaje, setMensaje] = useState({ tipo: '', texto: '' });

  useEffect(() => {
    cargarDatos();
  }, [productoSeleccionado]);

  const cargarDatos = async () => {
    const listaInsumos = await obtenerInsumos();
    setInsumosDisponibles(listaInsumos);
    if (listaInsumos.length > 0) setInsumoToAdd(listaInsumos[0].id);

    const todasRecetas = await obtenerRecetas();
    setIngredientesReceta(todasRecetas[productoSeleccionado] || []);
  };

  const handleAgregarIngrediente = () => {
    if (!cantToAdd || Number(cantToAdd) <= 0) return;

    const existe = ingredientesReceta.find(i => i.insumoId === insumoToAdd);
    if (existe) {
      setIngredientesReceta(ingredientesReceta.map(i => 
        i.insumoId === insumoToAdd ? { ...i, cantidad: Number(cantToAdd) } : i
      ));
    } else {
      setIngredientesReceta([...ingredientesReceta, { insumoId: insumoToAdd, cantidad: Number(cantToAdd) }]);
    }
    setCantToAdd('');
  };

  const handleEliminarIngrediente = (insumoId) => {
    setIngredientesReceta(ingredientesReceta.filter(i => i.insumoId !== insumoId));
  };

  const handleGuardarReceta = async () => {
    try {
      await guardarRecetaProducto(productoSeleccionado, ingredientesReceta);
      setMensaje({ tipo: 'exito', texto: '¡Receta guardada exitosamente en Firestore!' });
    } catch (err) {
      setMensaje({ tipo: 'error', texto: err.message });
    }
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>Configuración de Recetas (Bill of Materials)</h2>

      {mensaje.texto && (
        <div style={mensaje.tipo === 'error' ? styles.alertError : styles.alertExito}>
          {mensaje.texto}
        </div>
      )}

      <div style={styles.card}>
        <label style={styles.label}>Seleccione el tipo de Pan a configurar:</label>
        <select
          value={productoSeleccionado}
          onChange={(e) => setProductoSeleccionado(e.target.value)}
          style={styles.selectPan}
        >
          {PRODUCTOS_PAN.map(p => (
            <option key={p.id} value={p.id}>{p.nombre}</option>
          ))}
        </select>
      </div>

      <div style={styles.grid}>
        {/* Agregar Ingrediente */}
        <div style={styles.card}>
          <h3>Añadir Ingrediente a la Receta</h3>
          <div style={styles.field}>
            <label style={styles.label}>Insumo Requerido:</label>
            <select value={insumoToAdd} onChange={(e) => setInsumoToAdd(e.target.value)} style={styles.input}>
              {insumosDisponibles.map(i => (
                <option key={i.id} value={i.id}>{i.nombre} ({i.unidad})</option>
              ))}
            </select>
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Cantidad por 1 unidad de pan:</label>
            <input
              type="number"
              step="any"
              placeholder="Ej. 0.10"
              value={cantToAdd}
              onChange={(e) => setCantToAdd(e.target.value)}
              style={styles.input}
            />
          </div>

          <button onClick={handleAgregarIngrediente} style={styles.btnAdd}>
            + Añadir a la Receta
          </button>
        </div>

        {/* Lista de Ingredientes Configurados */}
        <div style={styles.card}>
          <h3>Receta Actual para 1 Pan de {PRODUCTOS_PAN.find(p=>p.id===productoSeleccionado)?.nombre}</h3>
          <table style={styles.table}>
            <thead>
              <tr style={styles.th}>
                <th>Insumo</th>
                <th>Cantidad</th>
                <th>Acción</th>
              </tr>
            </thead>
            <tbody>
              {ingredientesReceta.length === 0 ? (
                <tr><td colSpan="3" style={styles.tdEmpty}>No hay receta configurada para este pan</td></tr>
              ) : (
                ingredientesReceta.map(ing => {
                  const insumoObj = insumosDisponibles.find(i => i.id === ing.insumoId);
                  return (
                    <tr key={ing.insumoId} style={styles.tr}>
                      <td style={styles.tdBold}>{insumoObj ? insumoObj.nombre : ing.insumoId}</td>
                      <td style={styles.tdBold}>{ing.cantidad} {insumoObj?.unidad}</td>
                      <td style={styles.td}>
                        <button onClick={() => handleEliminarIngrediente(ing.insumoId)} style={styles.btnDelete}>
                          Quitar
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>

          {ingredientesReceta.length > 0 && (
            <button onClick={handleGuardarReceta} style={styles.btnSave}>
              Guardar Receta en BD
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: { backgroundColor: '#ffffff', padding: '2rem', borderRadius: '12px', maxWidth: '1000px', margin: '0 auto', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' },
  title: { marginTop: 0, color: '#0f172a' },
  card: { backgroundColor: '#f8fafc', padding: '1.2rem', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '1.5rem' },
  selectPan: { width: '100%', padding: '0.6rem', fontSize: '1rem', fontWeight: 'bold', borderRadius: '6px', border: '1px solid #cbd5e1', marginTop: '0.5rem' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' },
  field: { display: 'flex', flexDirection: 'column', gap: '0.4rem', marginBottom: '1rem' },
  label: { fontSize: '0.85rem', fontWeight: 'bold', color: '#475569' },
  input: { padding: '0.6rem', borderRadius: '6px', border: '1px solid #cbd5e1' },
  btnAdd: { width: '100%', padding: '0.6rem', backgroundColor: '#0284c7', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' },
  btnSave: { width: '100%', padding: '0.8rem', backgroundColor: '#16a34a', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', marginTop: '1rem' },
  btnDelete: { backgroundColor: '#ef4444', color: '#fff', border: 'none', padding: '0.3rem 0.6rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { textAlign: 'left', borderBottom: '2px solid #e2e8f0', padding: '0.5rem', color: '#475569', fontSize: '0.85rem' },
  tr: { borderBottom: '1px solid #f1f5f9' },
  td: { padding: '0.5rem' },
  tdBold: { padding: '0.5rem', fontWeight: 'bold' },
  tdEmpty: { padding: '1rem', textAlign: 'center', color: '#94a3b8' },
  alertExito: { backgroundColor: '#dcfce7', color: '#166534', padding: '0.8rem', borderRadius: '6px', marginBottom: '1rem' },
  alertError: { backgroundColor: '#fee2e2', color: '#991b1b', padding: '0.8rem', borderRadius: '6px', marginBottom: '1rem' }
};