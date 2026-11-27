import { mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const raiz = dirname(fileURLToPath(import.meta.url));
function archivo() {
  return join(raiz, "data", process.env.ESTADO_ARCHIVO || "estado.json");
}

const PRODUCTOS = [
  {
    sku: "imperial",
    nombre: "Imperial 350 ml",
    detalle: "La que más sale en la feria",
    stock: 28,
    minimo: 24,
    ventaDiaria: 18,
    cubrirDias: 2,
    maxUnidades: 36,
    precioUsdc: 0.01,
    precioLista: 700,
    rojosPorUnidad: 2,
  },
  {
    sku: "pilsen",
    nombre: "Pilsen 350 ml",
    detalle: "Todavía alcanza para la noche",
    stock: 46,
    minimo: 18,
    ventaDiaria: 10,
    cubrirDias: 2,
    maxUnidades: 24,
    precioUsdc: 0.01,
    precioLista: 650,
    rojosPorUnidad: 2,
  },
  {
    sku: "papas",
    nombre: "Papas con chile",
    detalle: "Se piden con la cerveza",
    stock: 22,
    minimo: 12,
    ventaDiaria: 6,
    cubrirDias: 2,
    maxUnidades: 16,
    precioUsdc: 0.02,
    precioLista: 1500,
    rojosPorUnidad: 3,
  },
];

function semilla() {
  return {
    tienda: "Bar La Ruta",
    evento: "Feria nocturna",
    proveedor: "Cervecería del Valle",
    rojosCobrados: 0,
    ventas: 0,
    productos: PRODUCTOS.map((p) => ({ ...p })),
    pedidos: [],
    bitacora: [],
  };
}

export function leer() {
  if (!existsSync(archivo())) return semilla();
  const guardado = JSON.parse(readFileSync(archivo(), "utf8"));
  return { ...semilla(), ...guardado, productos: guardado.productos || semilla().productos };
}

export function guardar(estado) {
  mkdirSync(dirname(archivo()), { recursive: true });
  writeFileSync(archivo(), JSON.stringify(estado, null, 2));
  return estado;
}

export function reiniciar() {
  return guardar(semilla());
}

export function anotar(tipo, mensaje, extra = {}) {
  const estado = leer();
  estado.bitacora.unshift({
    en: new Date().toISOString(),
    tipo,
    mensaje,
    ...extra,
  });
  estado.bitacora = estado.bitacora.slice(0, 40);
  return guardar(estado);
}

export function producto(estado, sku) {
  return estado.productos.find((p) => p.sku === sku);
}

export function pedidoAbierto(estado, sku) {
  return estado.pedidos.find((p) => p.sku === sku && !["entregado", "reembolsado"].includes(p.estado));
}

export function porId(estado, id) {
  return estado.pedidos.find((p) => p.id === id);
}

export function gastadoHoy(estado) {
  const hoy = new Date().toISOString().slice(0, 10);
  return estado.pedidos
    .filter((p) => p.creado.slice(0, 10) === hoy && p.hash)
    .reduce((suma, p) => suma + Number(p.usdc), 0);
}

export function vender(sku, unidades) {
  const estado = leer();
  const item = producto(estado, sku);
  if (!item) throw new Error("Ese producto no está en la tienda.");
  if (!Number.isInteger(unidades) || unidades <= 0) throw new Error("Unidades inválidas.");
  if (item.stock < unidades) throw new Error(`Solo quedan ${item.stock} de ${item.nombre}.`);
  item.stock -= unidades;
  const rojos = unidades * item.rojosPorUnidad;
  estado.rojosCobrados += rojos;
  estado.ventas += unidades;
  estado.bitacora.unshift({
    en: new Date().toISOString(),
    tipo: "venta",
    mensaje: `Party Pay: ${unidades} ${item.nombre}. Quedan ${item.stock}.`,
  });
  estado.bitacora = estado.bitacora.slice(0, 40);
  guardar(estado);
  return { item, rojos };
}

export function nuevoId(sku) {
  return `reposicion-${sku}-${Date.now().toString(36)}`;
}

export function abrirPedido(datos) {
  const estado = leer();
  if (porId(estado, datos.id)) throw new Error("Ese pedido ya existe.");
  const pedido = {
    id: datos.id,
    sku: datos.sku,
    nombre: datos.nombre,
    unidades: datos.unidades,
    usdc: datos.usdc,
    rojos: datos.rojos,
    estado: "pagado",
    verificado: false,
    hash: null,
    experto: null,
    reembolsoHash: null,
    reembolsoExperto: null,
    unidadesReembolsadas: 0,
    creado: new Date().toISOString(),
    motivos: [],
  };
  estado.pedidos.unshift(pedido);
  guardar(estado);
  return pedido;
}

export function cerrarPago(id, { hash, experto, verificado, motivos }) {
  const estado = leer();
  const pedido = porId(estado, id);
  if (!pedido) throw new Error("No está ese pedido.");
  pedido.hash = hash;
  pedido.experto = experto;
  pedido.verificado = verificado;
  pedido.motivos = motivos;
  pedido.estado = verificado ? "pagado" : "observado";
  guardar(estado);
  return pedido;
}

export function marcar(id, siguiente) {
  const estado = leer();
  const pedido = porId(estado, id);
  if (!pedido) throw new Error("No está ese pedido.");
  pedido.estado = siguiente;
  if (siguiente === "entregado") {
    const item = producto(estado, pedido.sku);
    const llegan = pedido.unidades - pedido.unidadesReembolsadas;
    if (item && llegan > 0) item.stock += llegan;
  }
  guardar(estado);
  return pedido;
}

export function marcarReembolso(id, { unidades, hash, experto }) {
  const estado = leer();
  const pedido = porId(estado, id);
  if (!pedido) throw new Error("No está ese pedido.");
  pedido.unidadesReembolsadas += unidades;
  pedido.reembolsoHash = hash;
  pedido.reembolsoExperto = experto;
  if (pedido.unidadesReembolsadas >= pedido.unidades && pedido.estado !== "entregado") {
    pedido.estado = "reembolsado";
  }
  guardar(estado);
  return pedido;
}
