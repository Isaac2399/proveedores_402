import { rpc, Asset, Networks } from "@stellar/stellar-sdk";
import { RPC, USDC } from "./red.js";

const servidor = new rpc.Server(RPC);
export const USDC_CONTRATO = new Asset(USDC.code, USDC.issuer).contractId(Networks.TESTNET);

export function juzgarTransferencia({ contrato, de, a, pagado, destino, monto }) {
  const motivos = [];
  const esperado = BigInt(Math.round(Number(monto) * 1e7));
  if (contrato !== USDC_CONTRATO) motivos.push(`no es USDC: el contrato es ${contrato}`);
  if (a !== destino) motivos.push(`el destinatario es ${a}, no ${destino}`);
  if (pagado !== esperado) motivos.push(`el monto es ${Number(pagado) / 1e7} USDC, no ${monto}`);
  return {
    ok: motivos.length === 0,
    motivos,
    de,
    a,
    monto: Number(pagado) / 1e7,
  };
}

export async function verificar(hash, { destino, monto }) {
  if (!/^[0-9a-f]{64}$/.test(hash || "")) {
    return { ok: false, motivos: ["el hash no tiene 64 caracteres hexadecimales"] };
  }

  let tx;
  let ultimo = "no encontrada";
  for (let i = 0; i < 5; i += 1) {
    tx = await servidor.getTransaction(hash);
    if (tx.status === "SUCCESS") break;
    ultimo = tx.status;
    await new Promise((r) => setTimeout(r, 800));
  }
  if (!tx || tx.status !== "SUCCESS") {
    return { ok: false, motivos: [`la transacción no está confirmada (${ultimo})`] };
  }

  const eventos = JSON.parse(JSON.stringify(tx.events?.contractEventsXdr || [])).flat();
  const pago = eventos.find((e) => e.body?.v0?.topics?.[0]?.symbol === "transfer");
  if (!pago) return { ok: false, motivos: ["no hay ninguna transferencia en esta transacción"] };

  const temas = pago.body.v0.topics.map((t) => t.address);
  const de = temas[1];
  const a = temas[2];
  const pagado = BigInt(pago.body.v0.data.i128);
  return juzgarTransferencia({
    contrato: pago.contract_id,
    de,
    a,
    pagado,
    destino,
    monto,
  });
}
