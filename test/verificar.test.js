import test from "node:test";
import assert from "node:assert/strict";
import { juzgarTransferencia, USDC_CONTRATO } from "../verificar.js";

const destino = "GDESTINODESTINODESTINODESTINODESTINODESTINODET";
const base = {
  contrato: USDC_CONTRATO,
  de: "GORIGENORIGENORIGENORIGENORIGENORIGENORIGENOR",
  a: destino,
  pagado: 100_000n,
  destino,
  monto: "0.01",
};

test("acepta la transferencia USDC exacta", () => {
  const r = juzgarTransferencia(base);
  assert.equal(r.ok, true, r.motivos.join("; "));
});

test("rechaza otro monto, otro destino y otro contrato", () => {
  assert.match(juzgarTransferencia({ ...base, pagado: 500_000n }).motivos.join(), /monto/);
  assert.match(juzgarTransferencia({ ...base, a: "GOTRO" }).motivos.join(), /destinatario/);
  assert.match(juzgarTransferencia({ ...base, contrato: "OTRO" }).motivos.join(), /no es USDC/);
});
