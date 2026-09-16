import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable'; // Importamos autoTable directamente como función

// Precios unitarios base por tipo de pan (en Quetzales Q)
export const PRECIOS_PANES = {
  frances: 0.50,
  aleman: 0.75,
  shecas: 1.25,
  cubos: 1.00,
  cachos: 0.80,
  cortadas: 0.75,
  batidas: 1.00,
  campechanas: 1.50
};

export const NOMBRES_PANES = {
  frances: 'Pan Francés',
  aleman: 'Pan Alemán',
  shecas: 'Shecas',
  cubos: 'Cubos Especial',
  cachos: 'Cachos',
  cortadas: 'Cortadas',
  batidas: 'Batidas',
  campechanas: 'Campechanas'
};

export const generarFacturaPDF = ({ sucursal, fecha, turno, pedidosProcesados, totalesPan, totalesInsumos }) => {
  const doc = new jsPDF();

  // --- ENCABEZADO Y DATOS DE LA EMPRESA ---
  doc.setFontSize(18);
  doc.setTextColor(15, 23, 42); // slate-900
  doc.text("PANADERÍA UMG - FACTURA DE DESPACHO / REMISIÓN", 14, 20);

  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`Fecha de Emisión: ${fecha}`, 14, 28);
  doc.text(`Turno de Producción: ${turno.toUpperCase()}`, 14, 34);
  doc.text(`Sucursal Destino: ${sucursal.toUpperCase()}`, 14, 40);

  doc.setLineWidth(0.5);
  doc.setDrawColor(203, 213, 225);
  doc.line(14, 45, 196, 45);

  // --- TABLA DE PRODUCTOS (PANES) ---
  doc.setFontSize(12);
  doc.setTextColor(15, 23, 42);
  doc.text("Detalle de Panes Producidos y Despachados", 14, 53);

  const tablaProductosRows = [];
  let granTotal = 0;

  Object.entries(totalesPan).forEach(([prodId, cantidad]) => {
    const precioUnitario = PRECIOS_PANES[prodId] || 1.00;
    const subtotal = cantidad * precioUnitario;
    granTotal += subtotal;

    tablaProductosRows.push([
      NOMBRES_PANES[prodId] || prodId,
      cantidad.toLocaleString(),
      `Q ${precioUnitario.toFixed(2)}`,
      `Q ${subtotal.toFixed(2)}`
    ]);
  });

  // Usamos autoTable(doc, {...}) en lugar de doc.autoTable({...})
  autoTable(doc, {
    startY: 57,
    head: [['Producto / Pan', 'Cantidad (Unidades)', 'Precio Unitario', 'Subtotal']],
    body: tablaProductosRows,
    theme: 'grid',
    headStyles: { fillColor: [2, 132, 199], textColor: [255, 255, 255], fontStyle: 'bold' },
    foot: [['', '', 'TOTAL GENERAL:', `Q ${granTotal.toFixed(2)}`]],
    footStyles: { fillColor: [241, 245, 249], textColor: [15, 23, 42], fontStyle: 'bold' }
  });

  // Obtenemos la posición Y donde terminó la tabla anterior
  const finalYPanes = doc.lastAutoTable ? doc.lastAutoTable.finalY : 120;
  let nextY = finalYPanes + 12;

  // --- TABLA DE INSUMOS DESCONTADOS DE STOCK ---
  doc.setFontSize(12);
  doc.setTextColor(15, 23, 42);
  doc.text("Resumen de Insumos Descontados del Stock", 14, nextY);

  const tablaInsumosRows = Object.entries(totalesInsumos).map(([insumoId, data]) => [
    data.nombre,
    `${data.cantidad.toFixed(2)} ${data.unidad}`
  ]);

  autoTable(doc, {
    startY: nextY + 4,
    head: [['Materia Prima / Insumo', 'Cantidad Total Consumida']],
    body: tablaInsumosRows,
    theme: 'striped',
    headStyles: { fillColor: [71, 85, 105], textColor: [255, 255, 255] }
  });

  // --- PIE DE PÁGINA Y FIRMAS ---
  const finalYInsumos = doc.lastAutoTable ? doc.lastAutoTable.finalY : nextY + 40;
  const finalY = finalYInsumos + 25;

  doc.setLineWidth(0.5);
  doc.line(20, finalY, 80, finalY);
  doc.line(120, finalY, 180, finalY);

  doc.setFontSize(9);
  doc.setTextColor(100);
  doc.text("Firma Responsable Producción", 28, finalY + 5);
  doc.text("Firma Recibido Sucursal", 132, finalY + 5);

  // Descargar el PDF generado
  const nombreArchivo = `Factura_${sucursal.replace(/\s+/g, '_')}_${fecha}_${turno}.pdf`;
  doc.save(nombreArchivo);
};