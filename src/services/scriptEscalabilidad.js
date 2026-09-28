import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../config/firebase';
import { NOMBRES_PANES, PRECIOS_PANES } from '../utils/facturaPdf';

const numeroValido = (valor) => {
  const numero = Number(valor);
  return Number.isFinite(numero) ? numero : 0;
};

const crearResumen = (nombre) => ({
  nombre,
  productos: {},
  totalUnidades: 0,
  totalVentas: 0
});

const agregarProductos = (resumen, totalesPan) => {
  let importeCalculado = 0;

  Object.entries(totalesPan || {}).forEach(([productoId, cantidad]) => {
    const unidades = numeroValido(cantidad);
    if (unidades <= 0) return;

    resumen.productos[productoId] = (resumen.productos[productoId] || 0) + unidades;
    resumen.totalUnidades += unidades;
    importeCalculado += unidades * numeroValido(PRECIOS_PANES[productoId] || 1);
  });

  return importeCalculado;
};

const productoExtremo = (productos, modo) => {
  const productosConVentas = Object.entries(productos)
    .filter(([, cantidad]) => cantidad > 0)
    .map(([id, cantidad]) => ({
      id,
      nombre: NOMBRES_PANES[id] || id,
      cantidad
    }));

  if (productosConVentas.length === 0) return null;

  return productosConVentas.reduce((extremo, producto) => {
    const esMejor = modo === 'mayor'
      ? producto.cantidad > extremo.cantidad
      : producto.cantidad < extremo.cantidad;
    return esMejor ? producto : extremo;
  });
};

export const obtenerDatosEscalabilidad = async () => {
  const pedidosProcesados = await getDocs(query(
    collection(db, 'pedidos'),
    where('estado', '==', 'PROCESADO')
  ));
  const sucursales = {};
  const global = crearResumen('Todas las sucursales');

  pedidosProcesados.docs.forEach((documento) => {
    const pedido = documento.data();
    const nombreSucursal = String(pedido.sucursal || '').trim();
    if (!nombreSucursal) return;

    const resumenSucursal = sucursales[nombreSucursal] || crearResumen(nombreSucursal);
    const importeCalculado = agregarProductos(resumenSucursal, pedido.items?.reduce((totales, item) => {
      totales[item.productoId] = (totales[item.productoId] || 0) + numeroValido(item.cantidad);
      return totales;
    }, {}));

    resumenSucursal.totalVentas += importeCalculado;
    sucursales[nombreSucursal] = resumenSucursal;

    const totalesPedido = pedido.items?.reduce((totales, item) => {
      totales[item.productoId] = (totales[item.productoId] || 0) + numeroValido(item.cantidad);
      return totales;
    }, {});
    agregarProductos(global, totalesPedido);
    global.totalVentas += importeCalculado;
  });

  const listaSucursales = Object.values(sucursales)
    .map((sucursal) => ({
      ...sucursal,
      productoMasVendido: productoExtremo(sucursal.productos, 'mayor')
    }))
    .sort((a, b) => b.totalVentas - a.totalVentas);

  const sucursalMasRentable = listaSucursales[0] || null;
  const sucursalMenosGenera = listaSucursales.length > 0
    ? listaSucursales[listaSucursales.length - 1]
    : null;

  return {
    sucursales: listaSucursales,
    global: {
      ...global,
      productoMasVendido: productoExtremo(global.productos, 'mayor'),
      productoMenosVendido: productoExtremo(global.productos, 'menor')
    },
    sucursalMasRentable,
    sucursalMenosGenera,
    pedidosAnalizados: pedidosProcesados.size
  };
};
