import { x402Client, x402HTTPClient, wrapFetchWithPayment } from "@x402/fetch";
import { createEd25519Signer } from "@x402/stellar";
import { ExactStellarScheme } from "@x402/stellar/exact/client";
import { atomicosAUsdc, evaluarCobro, formatoPrecio } from "./politica.js";
import { RPC } from "./red.js";
import { saldoUsdc } from "./billetera.js";

function leerTope(nombre, fallo) {
  const crudo = process.env[nombre] || fallo;
  return crudo.startsWith("$") ? crudo : `$${crudo}`;
}

export function topes() {
  return {
    pedido: leerTope("TOPE_PEDIDO", "$0.50"),
    dia: leerTope("TOPE_DIA", "$0.50"),
    reembolso: leerTope("TOPE_REEMBOLSO", "$0.50"),
  };
}

export function numeroTope(texto) {
  return Number(String(texto).replace("$", ""));
}

export function billeterasListas() {
  return Boolean(process.env.MI_PUBLICA && process.env.MI_SECRETA && process.env.AGENTE_PUBLICA && process.env.AGENTE_SECRETA);
}

function cliente(secreta, tope) {
  const signer = createEd25519Signer(secreta, "stellar:testnet");
  const client = x402Client.fromConfig({
    schemes: [{ network: "stellar:*", client: new ExactStellarScheme(signer, { url: RPC }) }],
    spendControls: { maxAmountPerPayment: tope },
  });
  return {
    signer,
    http: new x402HTTPClient(client),
    fetchQuePaga: wrapFetchWithPayment(fetch, client),
  };
}

function hashDelPago(pago) {
  return pago?.transaction || pago?.txHash || pago?.hash || null;
}

export async function pagarRuta({ url, body, secreta, tope, esperado, saldo }) {
  const { http, fetchQuePaga, signer } = cliente(secreta, tope);
  const sonda = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json", accept: "application/json" },
    body: JSON.stringify(body),
  });

  if (sonda.status === 403 || sonda.status === 409) {
    const detalle = await sonda.json().catch(() => ({}));
    return {
      ok: false,
      codigo: "repetido",
      mensaje: detalle.error || detalle.mensaje || "El servidor rechazó el cobro antes de cobrar. No se firmó nada.",
    };
  }
  if (sonda.status !== 402) {
    const detalle = await sonda.json().catch(() => ({}));
    return {
      ok: false,
      codigo: "api",
      mensaje: detalle.mensaje || `La ruta respondió ${sonda.status}. No se pagó nada.`,
    };
  }

  const requerido = http.getPaymentRequiredResponse((h) => sonda.headers.get(h));
  const usdc = atomicosAUsdc(requerido.accepts[0].amount);
  const juicio = evaluarCobro({
    usdc,
    tope: numeroTope(tope),
    saldo,
    yaPagado: false,
    esperado,
  });
  if (!juicio.ok) return { ...juicio, usdc };

  const antes = saldo;
  try {
    const res = await fetchQuePaga(url, {
      method: "POST",
      headers: { "content-type": "application/json", accept: "application/json" },
      body: JSON.stringify(body),
    });
    const texto = await res.text();
    let json = {};
    try { json = JSON.parse(texto); } catch { json = { mensaje: texto }; }
    if (!res.ok) {
      return { ok: false, codigo: "api", mensaje: json.mensaje || json.error || `El cobro respondió ${res.status}.`, usdc };
    }
    const pago = http.getPaymentSettleResponse((h) => res.headers.get(h));
    const hash = hashDelPago(pago);
    if (!hash) return { ok: false, codigo: "invalido", mensaje: "La API no devolvió el hash del pago. No se da por cobrado.", usdc };
    return { ok: true, usdc, hash, cuerpo: json, desde: signer.address };
  } catch (error) {
    const mensaje = error instanceof Error ? error.message : String(error);
    if (mensaje.includes("maxAmountPerPayment")) {
      return {
        ok: false,
        codigo: "tope",
        usdc,
        mensaje: `x402 rechazó el pago: supera el tope ${tope}. No se firmó ni se envió nada.`,
      };
    }
    let despues = null;
    try { despues = await saldoUsdc(signer.address); } catch { despues = null; }
    const cobro = despues != null && antes != null && despues + 1e-9 < antes;
    return {
      ok: false,
      codigo: cobro ? "duda" : "api",
      usdc,
      mensaje: cobro
        ? `Falló después de enviar (${mensaje}). El saldo sí bajó: no reintentes a ciegas. Revisa la billetera.`
        : `Falló el pago (${mensaje}). El saldo no cambió, no se cobró.`,
    };
  }
}

export async function pagarConSaldo(opciones) {
  const saldo = opciones.saldo != null ? opciones.saldo : await saldoUsdc(opciones.quien);
  return pagarRuta({ ...opciones, saldo });
}

export function describirTope() {
  const t = topes();
  return `Tope por pedido ${t.pedido} · tope del día ${t.dia} · tope de reembolso ${t.reembolso}. ${formatoPrecio(numeroTope(t.pedido))} es lo máximo que el agente firma de una vez.`;
}
