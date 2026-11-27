import express from "express";
import { paymentMiddlewareFromHTTPServer, x402ResourceServer, x402HTTPResourceServer } from "@x402/express";
import { HTTPFacilitatorClient } from "@x402/core/server";
import { ExactStellarScheme } from "@x402/stellar/exact/server";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { billeterasListas, numeroTope, pagarConSaldo, topes } from "./agente.js";
import { saldos } from "./billetera.js";
import * as estado from "./estado.js";
import { cotizar, decidirReposicion, evaluarCobro, evaluarReembolso, formatoPrecio } from "./politica.js";
import { ESCROW_PARTYPAY, FACILITATOR, RED, ROJOS, USDC, contratoDe, enlaceAsset, enlaceCuenta, enlaceTx } from "./red.js";
import { USDC_CONTRATO, verificar } from "./verificar.js";

const PORT = Number(process.env.PORT || 4317);
const raiz = dirname(fileURLToPath(import.meta.url));
const app = express();
app.use(express.json());

const cobrosEnCurso = new Map();

function ocupar(id) {
  const ahora = Date.now();
  const previo = cobrosEnCurso.get(id);
  if (previo && ahora - previo < 90_000) return false;
  cobrosEnCurso.set(id, ahora);
  return true;
}

function soltar(id) {
  cobrosEnCurso.delete(id);
}

function reglas() {
  const t = topes();
  return {
    topePedidoUsdc: numeroTope(t.pedido),
    topeDiaUsdc: numeroTope(t.dia),
    topeReembolsoUsdc: numeroTope(t.reembolso),
  };
}

function cuerpo(context) {
  const body = context.adapter.getBody();
  return body && typeof body === "object" ? body : {};
}

function precioDeCobro(body) {
  const db = estado.leer();
  const item = estado.producto(db, body.sku);
  if (!item) throw new Error("Producto desconocido.");
  return { item, usdc: cotizar(item.precioUsdc, Number(body.unidades)) };
}

function armarRutas() {
  if (!billeterasListas()) return null;
  const facilitator = new HTTPFacilitatorClient({ url: FACILITATOR });
  const resource = new x402ResourceServer(facilitator).register(RED, new ExactStellarScheme());
  const rutas = {
    "POST /api/cobro": {
      accepts: {
        scheme: "exact",
        price: (context) => formatoPrecio(precioDeCobro(cuerpo(context)).usdc),
        network: RED,
        payTo: process.env.MI_PUBLICA,
      },
      description: "Reposición de inventario del bar. USDC de testnet.",
    },
    "POST /api/reembolso": {
      accepts: {
        scheme: "exact",
        price: (context) => {
          const body = cuerpo(context);
          const db = estado.leer();
          const pedido = estado.porId(db, body.pedidoId);
          if (!pedido) throw new Error("Pedido desconocido.");
          const item = estado.producto(db, pedido.sku);
          return formatoPrecio(cotizar(item.precioUsdc, Number(body.unidades)));
        },
        network: RED,
        payTo: process.env.AGENTE_PUBLICA,
      },
      description: "Reembolso del proveedor a la tienda. USDC de testnet, con tope.",
    },
  };

  const http = new x402HTTPResourceServer(resource, rutas).onProtectedRequest(async (context) => {
    const body = cuerpo(context);
    const db = estado.leer();
    const conPago = Boolean(context.paymentHeader);
    if (context.path.endsWith("/api/cobro")) {
      if (!body.pedidoId || !body.sku) return { abort: true, reason: "Pedido inválido. No se cobra." };
      if (estado.porId(db, body.pedidoId)?.hash) {
        return { abort: true, reason: "Ese pedido ya se pagó. No se cobra otra vez." };
      }
      if (!conPago) return;
      if (!ocupar(body.pedidoId)) {
        return { abort: true, reason: "Ese cobro ya está en curso. No se firma otro pago." };
      }
      return;
    }
    if (context.path.endsWith("/api/reembolso")) {
      const pedido = estado.porId(db, body.pedidoId);
      if (!pedido) return { abort: true, reason: "No existe ese pedido. No se reembolsa." };
      if ((pedido.unidadesReembolsadas || 0) >= pedido.unidades) {
        return { abort: true, reason: "Ese pedido ya se devolvió por completo. No se cobra otra vez." };
      }
      if (!conPago) return;
      if (!ocupar(`reembolso-${pedido.id}-${pedido.unidadesReembolsadas || 0}`)) {
        return { abort: true, reason: "Ese reembolso ya está en curso. No se firma otro pago." };
      }
    }
  });

  return http;
}

const httpPagos = armarRutas();
if (httpPagos) app.use(paymentMiddlewareFromHTTPServer(httpPagos));

app.get("/presentacion", (_req, res) => {
  res.sendFile(join(raiz, "public", "presentacion.html"));
});

app.use(express.static(join(raiz, "public")));

async function vista() {
  const db = estado.leer();
  const t = topes();
  const r = reglas();
  let agente = null;
  let proveedor = null;
  if (billeterasListas()) {
    [agente, proveedor] = await Promise.all([
      saldos(process.env.AGENTE_PUBLICA),
      saldos(process.env.MI_PUBLICA),
    ]);
  }
  return {
    red: RED,
    listo: billeterasListas(),
    tienda: db.tienda,
    evento: db.evento,
    proveedor: db.proveedor,
    rojosCobrados: db.rojosCobrados,
    ventas: db.ventas,
    productos: db.productos,
    pedidos: db.pedidos,
    bitacora: db.bitacora,
    topes: { ...t, ...r },
    cuentas: {
      agente: process.env.AGENTE_PUBLICA || null,
      proveedor: process.env.MI_PUBLICA || null,
      agenteUrl: process.env.AGENTE_PUBLICA ? enlaceCuenta(process.env.AGENTE_PUBLICA) : null,
      proveedorUrl: process.env.MI_PUBLICA ? enlaceCuenta(process.env.MI_PUBLICA) : null,
    },
    saldos: { agente, proveedor },
    activos: {
      usdc: { ...USDC, contrato: contratoDe(USDC), url: enlaceAsset(USDC), sac: USDC_CONTRATO },
      rojos: { ...ROJOS, contrato: contratoDe(ROJOS), url: enlaceAsset(ROJOS) },
      escrow: ESCROW_PARTYPAY,
      escrowUrl: `https://stellar.expert/explorer/testnet/contract/${ESCROW_PARTYPAY}`,
    },
    gastadoHoy: estado.gastadoHoy(db),
  };
}

app.get("/api/estado", async (_req, res) => {
  res.json(await vista());
});

app.post("/api/ventas", (req, res) => {
  try {
    const db = estado.leer();
    const resultado = estado.vender( req.body.sku, Number(req.body.unidades));
    res.json({ ok: true, ...resultado, estado: resultado.item.stock });
  } catch (error) {
    res.status(400).json({ ok: false, mensaje: error.message });
  }
});

app.post("/api/demo/reiniciar", (_req, res) => {
  estado.reiniciar();
  res.json({ ok: true, mensaje: "La feria volvió al inicio. Las billeteras no se tocaron." });
});

app.post("/api/cobro", (req, res) => {
  if (!httpPagos) return res.status(503).json({ ok: false, mensaje: "Los cobros no están activos." });
  try {
    const db = estado.leer();
    const { item, usdc } = precioDeCobro(req.body);
    const pedido = estado.abrirPedido( {
      id: req.body.pedidoId,
      sku: item.sku,
      nombre: item.nombre,
      unidades: Number(req.body.unidades),
      usdc,
      rojos: Number(req.body.unidades) * item.rojosPorUnidad,
    });
    res.json({ ok: true, pedido });
  } catch (error) {
    res.status(400).json({ ok: false, mensaje: error.message });
  } finally {
    if (req.body?.pedidoId) soltar(req.body.pedidoId);
  }
});

app.post("/api/reembolso", (req, res) => {
  if (!httpPagos) return res.status(503).json({ ok: false, mensaje: "Los reembolsos no están activos." });
  try {
    const db = estado.leer();
    const pedido = estado.porId(db, req.body.pedidoId);
    const item = estado.producto(db, pedido.sku);
    const usdc = cotizar(item.precioUsdc, Number(req.body.unidades));
    res.json({ ok: true, pedidoId: pedido.id, unidades: Number(req.body.unidades), usdc });
  } catch (error) {
    res.status(400).json({ ok: false, mensaje: error.message });
  } finally {
    if (req.body?.pedidoId) {
      const pedido = estado.porId(estado.leer(), req.body.pedidoId);
      soltar(`reembolso-${req.body.pedidoId}-${pedido?.unidadesReembolsadas || 0}`);
    }
  }
});

async function revisar() {
  if (!billeterasListas()) {
    return { ok: false, codigo: "wallet", mensaje: "Faltan las billeteras en .env. Corre npm run preparar y vuelve a arrancar." };
  }
  const db = estado.leer();
  const r = reglas();
  const saldo = (await saldos(process.env.AGENTE_PUBLICA)).usdc;
  const decisiones = [];

  for (const item of db.productos) {
    const abierto = estado.pedidoAbierto(db, item.sku);
    if (abierto) {
      const mensaje = `${item.nombre} ya tiene el pedido ${abierto.id} en curso. El agente no paga otro.`;
      estado.anotar( "repetido", mensaje);
      decisiones.push({ ok: false, codigo: "repetido", mensaje });
      continue;
    }
    const decision = decidirReposicion(item, { ...r, gastadoHoyUsdc: estado.gastadoHoy(db) });
    if (!decision.ok) {
      estado.anotar( decision.codigo, decision.mensaje);
      decisiones.push(decision);
      continue;
    }
    const pedidoId = estado.nuevoId(item.sku);
    const pago = await pagarConSaldo({
      url: `http://127.0.0.1:${PORT}/api/cobro`,
      body: { pedidoId, sku: item.sku, unidades: decision.unidades },
      secreta: process.env.AGENTE_SECRETA,
      quien: process.env.AGENTE_PUBLICA,
      tope: topes().pedido,
      esperado: decision.usdc,
      saldo,
    });
    if (!pago.ok) {
      estado.anotar( pago.codigo || "api", pago.mensaje);
      decisiones.push(pago);
      continue;
    }
    const ver = await verificar(pago.hash, { destino: process.env.MI_PUBLICA, monto: String(decision.usdc) });
    const pedido = estado.cerrarPago( pedidoId, {
      hash: pago.hash,
      experto: enlaceTx(pago.hash),
      verificado: ver.ok,
      motivos: ver.motivos,
    });
    const mensaje = ver.ok
      ? `${decision.mensaje} Pagó ${formatoPrecio(decision.usdc)} USDC. ${enlaceTx(pago.hash)}`
      : `Llegó un hash, pero la verificación lo rechazó: ${ver.motivos.join("; ")}. El proveedor no debe alistar.`;
    estado.anotar( ver.ok ? "pago" : "invalido", mensaje, { experto: enlaceTx(pago.hash) });
    decisiones.push({ ok: ver.ok, codigo: ver.ok ? "pago" : "invalido", mensaje, pedido });
  }

  const pago = decisiones.find((d) => d.codigo === "pago");
  return pago || decisiones[0] || { ok: false, codigo: "stock_ok", mensaje: "Nada que reponer." };
}

app.post("/api/agente/revisar", async (_req, res) => {
  try {
    res.json(await revisar());
  } catch (error) {
    res.status(500).json({ ok: false, mensaje: error.message });
  }
});

app.post("/api/agente/forzar", async (req, res) => {
  try {
    if (!billeterasListas()) {
      res.json({ ok: false, codigo: "wallet", mensaje: "Faltan las billeteras. No se intenta firmar." });
      return;
    }
    const db = estado.leer();
    const sku = req.body.sku || "imperial";
    const item = estado.producto(db, sku);
    const unidades = Number(req.body.unidades || 40);
    const esperado = cotizar(item.precioUsdc, unidades);
    const saldo = (await saldos(process.env.AGENTE_PUBLICA)).usdc;
    const sonda = await fetch(`http://127.0.0.1:${PORT}/api/cobro`, {
      method: "POST",
      headers: { "content-type": "application/json", accept: "application/json" },
      body: JSON.stringify({ pedidoId: `forzar-${sku}-${Date.now().toString(36)}`, sku, unidades }),
    });
    if (sonda.status !== 402) {
      const detalle = await sonda.json().catch(() => ({}));
      const mensaje = detalle.error || detalle.mensaje || `La API no cotizó (status ${sonda.status}). No se pagó.`;
      estado.anotar( "api", mensaje);
      res.json({ ok: false, codigo: "api", mensaje });
      return;
    }
    const { x402HTTPClient } = await import("@x402/fetch");
    const { x402Client } = await import("@x402/fetch");
    const http = new x402HTTPClient(new x402Client());
    let usdc = esperado;
    try {
      const requerido = http.getPaymentRequiredResponse((h) => sonda.headers.get(h));
      usdc = Number(requerido.accepts[0].amount) / 1e7;
    } catch {
      usdc = esperado;
    }
    const juicio = evaluarCobro({ usdc, tope: reglas().topePedidoUsdc, saldo, yaPagado: false, esperado: usdc });
    const mensaje = juicio.ok
      ? "Ese monto cabe en el tope. No era una prueba de rechazo."
      : juicio.mensaje;
    estado.anotar( juicio.codigo || "tope", mensaje);
    res.json({ ...juicio, usdc, mensaje });
  } catch (error) {
    res.status(500).json({ ok: false, mensaje: error.message });
  }
});

app.post("/api/agente/sin-saldo", async (req, res) => {
  const db = estado.leer();
  const item = estado.producto(db, req.body.sku || "imperial");
  const unidades = Number(req.body.unidades || 12);
  const usdc = cotizar(item.precioUsdc, unidades);
  const juicio = evaluarCobro({
    usdc,
    tope: reglas().topePedidoUsdc,
    saldo: 0,
    yaPagado: false,
    esperado: usdc,
  });
  estado.anotar( juicio.codigo, `Con la billetera en cero: ${juicio.mensaje}`);
  res.json(juicio);
});

app.post("/api/agente/repetir", async (req, res) => {
  const db = estado.leer();
  const pedido = estado.porId(db, req.body.pedidoId) || db.pedidos.find((p) => p.hash);
  if (!pedido) {
    res.json({ ok: false, codigo: "repetido", mensaje: "Todavía no hay un pedido pagado para repetir." });
    return;
  }
  const juicio = evaluarCobro({ usdc: pedido.usdc, tope: reglas().topePedidoUsdc, saldo: 1, yaPagado: Boolean(pedido.hash), esperado: pedido.usdc });
  let servidor = null;
  if (billeterasListas()) {
    const sonda = await fetch(`http://127.0.0.1:${PORT}/api/cobro`, {
      method: "POST",
      headers: { "content-type": "application/json", accept: "application/json" },
      body: JSON.stringify({ pedidoId: pedido.id, sku: pedido.sku, unidades: pedido.unidades }),
    });
    const detalle = await sonda.json().catch(() => ({}));
    servidor = { status: sonda.status, detalle: detalle.error || detalle.mensaje || detalle };
  }
  const mensaje = `${juicio.mensaje} El servidor respondió ${servidor ? servidor.status : "sin billetera"} y no se firmó otro pago.`;
  estado.anotar( "repetido", mensaje);
  res.json({ ...juicio, mensaje, servidor });
});

app.post("/api/pagos/juzgar", async (req, res) => {
  const db = estado.leer();
  const pedido = estado.porId(db, req.body.pedidoId) || db.pedidos.find((p) => p.hash);
  if (!pedido?.hash) {
    res.json({ ok: false, codigo: "invalido", mensaje: "Primero tiene que existir un pago real para comprobarlo." });
    return;
  }
  const monto = req.body.monto || pedido.usdc;
  const destino = req.body.destino || process.env.MI_PUBLICA;
  const ver = await verificar(pedido.hash, { destino, monto: String(monto) });
  const mensaje = ver.ok
    ? `Aceptado: ${ver.monto} USDC de ${ver.de} a ${ver.a}.`
    : `Rechazado: ${ver.motivos.join("; ")}. Ese pago no autoriza a alistar.`;
  estado.anotar( ver.ok ? "verificado" : "invalido", mensaje);
  res.json({ ...ver, mensaje });
});

app.post("/api/pedidos/:id/alistar", (req, res) => {
  const db = estado.leer();
  const pedido = estado.porId(db, req.params.id);
  if (!pedido) return res.status(404).json({ ok: false, mensaje: "No está ese pedido." });
  if (!pedido.verificado) {
    return res.status(409).json({ ok: false, mensaje: "El pago no está verificado en Stellar. No se alista." });
  }
  estado.marcar( pedido.id, "alistando");
  estado.anotar( "alistar", `${estado.leer().proveedor} alista ${pedido.unidades} de ${pedido.nombre}.`);
  res.json({ ok: true });
});

app.post("/api/pedidos/:id/entregar", (req, res) => {
  const db = estado.leer();
  const pedido = estado.porId(db, req.params.id);
  if (!pedido) return res.status(404).json({ ok: false, mensaje: "No está ese pedido." });
  if (pedido.estado !== "alistando") {
    return res.status(409).json({ ok: false, mensaje: "Primero hay que alistar el pedido." });
  }
  estado.marcar( pedido.id, "entregado");
  const llegan = pedido.unidades - pedido.unidadesReembolsadas;
  estado.anotar( "entrega", `Entrega confirmada. Entran ${llegan} de ${pedido.nombre} al stock de la tienda.`);
  res.json({ ok: true });
});

app.post("/api/pedidos/:id/reembolsar", async (req, res) => {
  try {
    if (!billeterasListas()) {
      res.json({ ok: false, codigo: "wallet", mensaje: "Faltan las billeteras. No se reembolsa." });
      return;
    }
    const db = estado.leer();
    const pedido = estado.porId(db, req.params.id);
    if (!pedido?.verificado) {
      res.status(409).json({ ok: false, mensaje: "No hay un pago verificado que reembolsar." });
      return;
    }
    const item = estado.producto(db, pedido.sku);
    const unidades = Number(req.body?.unidades);
    const usdc = cotizar(item.precioUsdc, unidades);
    const ya = pedido.unidadesReembolsadas ? cotizar(item.precioUsdc, pedido.unidadesReembolsadas) : 0;
    const restante = Math.round((pedido.usdc - ya) * 100) / 100;
    const saldo = (await saldos(process.env.MI_PUBLICA)).usdc;
    const juicio = evaluarReembolso({
      usdc,
      tope: reglas().topeReembolsoUsdc,
      saldo,
      yaReembolsado: restante <= 0,
      restante,
    });
    if (!juicio.ok) {
      estado.anotar( juicio.codigo, juicio.mensaje);
      res.json(juicio);
      return;
    }
    const pago = await pagarConSaldo({
      url: `http://127.0.0.1:${PORT}/api/reembolso`,
      body: { pedidoId: pedido.id, unidades },
      secreta: process.env.MI_SECRETA,
      quien: process.env.MI_PUBLICA,
      tope: topes().reembolso,
      esperado: usdc,
      saldo,
    });
    if (!pago.ok) {
      estado.anotar( pago.codigo || "api", pago.mensaje);
      res.json(pago);
      return;
    }
    const ver = await verificar(pago.hash, { destino: process.env.AGENTE_PUBLICA, monto: String(usdc) });
    if (!ver.ok) {
      const mensaje = `El reembolso no se acepta: ${ver.motivos.join("; ")}.`;
      estado.anotar( "invalido", mensaje, { experto: enlaceTx(pago.hash) });
      res.json({ ok: false, codigo: "invalido", mensaje });
      return;
    }
    estado.marcarReembolso( pedido.id, { unidades, hash: pago.hash, experto: enlaceTx(pago.hash) });
    const mensaje = `Reembolso de ${unidades} ${pedido.nombre} (${formatoPrecio(usdc)} USDC) de vuelta a la tienda. ${enlaceTx(pago.hash)}`;
    estado.anotar( "reembolso", mensaje, { experto: enlaceTx(pago.hash) });
    res.json({ ok: true, mensaje, experto: enlaceTx(pago.hash) });
  } catch (error) {
    res.status(500).json({ ok: false, mensaje: error.message });
  }
});

const esPrincipal = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (esPrincipal) {
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Proveedores 402 en http://127.0.0.1:${PORT}`);
  });
}

export { app, PORT };
