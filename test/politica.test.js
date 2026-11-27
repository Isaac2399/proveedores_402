import test from "node:test";
import assert from "node:assert/strict";
import { cotizar, decidirReposicion, evaluarCobro, evaluarReembolso, formatoPrecio } from "../politica.js";

const imperial = {
  nombre: "Imperial 350 ml",
  stock: 20,
  minimo: 24,
  ventaDiaria: 18,
  cubrirDias: 2,
  maxUnidades: 36,
  precioUsdc: 0.01,
};

const topes = { topePedidoUsdc: 0.12, topeDiaUsdc: 0.3, gastadoHoyUsdc: 0 };

test("no pide si el stock está sobre el mínimo", () => {
  const decision = decidirReposicion({ ...imperial, stock: 30 }, topes);
  assert.equal(decision.ok, false);
  assert.equal(decision.codigo, "stock_ok");
});

test("recorta el pedido para no pasarse del tope", () => {
  const decision = decidirReposicion(imperial, topes);
  assert.equal(decision.ok, true);
  assert.equal(decision.necesidad, 16);
  assert.equal(decision.unidades, 12);
  assert.equal(decision.usdc, 0.12);
  assert.equal(decision.recortado, true);
});

test("al llegar a 24 pide 50 cervezas si el tope lo permite", () => {
  const decision = decidirReposicion(
    { ...imperial, stock: 24, pedidoUnidades: 50, maxUnidades: 50 },
    { topePedidoUsdc: 0.5, topeDiaUsdc: 0.5, gastadoHoyUsdc: 0 },
  );
  assert.equal(decision.ok, true);
  assert.equal(decision.unidades, 50);
  assert.equal(decision.usdc, 0.5);
  assert.equal(decision.recortado, false);
});

test("rechaza cuando el tope del día ya no alcanza ni una unidad", () => {
  const decision = decidirReposicion(imperial, { ...topes, gastadoHoyUsdc: 0.3 });
  assert.equal(decision.ok, false);
  assert.equal(decision.codigo, "tope");
});

test("no firma si la API cobra de más, si no hay saldo o si el pedido ya se pagó", () => {
  assert.equal(evaluarCobro({ usdc: 0.4, tope: 0.12, saldo: 1, yaPagado: false, esperado: 0.4 }).codigo, "tope");
  assert.equal(evaluarCobro({ usdc: 0.12, tope: 0.12, saldo: 0.05, yaPagado: false, esperado: 0.12 }).codigo, "saldo");
  assert.equal(evaluarCobro({ usdc: 0.12, tope: 0.12, saldo: 1, yaPagado: true, esperado: 0.12 }).codigo, "repetido");
  assert.equal(evaluarCobro({ usdc: 0.2, tope: 0.5, saldo: 1, yaPagado: false, esperado: 0.12 }).codigo, "invalido");
  assert.equal(evaluarCobro({ usdc: 0.12, tope: 0.12, saldo: null, yaPagado: false, esperado: 0.12 }).codigo, "saldo_desconocido");
  assert.equal(evaluarCobro({ usdc: 0.12, tope: 0.12, saldo: 0.12, yaPagado: false, esperado: 0.12 }).ok, true);
});

test("el reembolso también respeta tope, saldo y un solo pago", () => {
  assert.equal(evaluarReembolso({ usdc: 0.5, tope: 0.08, saldo: 1, yaReembolsado: false, restante: 0.5 }).ok, true);
  assert.equal(evaluarReembolso({ usdc: 0.04, tope: 0.08, saldo: 0.01, yaReembolsado: false, restante: 0.12 }).codigo, "saldo");
  assert.equal(evaluarReembolso({ usdc: 0.04, tope: 0.08, saldo: 1, yaReembolsado: true, restante: 0.12 }).codigo, "repetido");
  assert.equal(evaluarReembolso({ usdc: 0.04, tope: 0.08, saldo: 1, yaReembolsado: false, restante: 0.12 }).ok, true);
});

test("cotiza en centavos de USDC", () => {
  assert.equal(cotizar(0.01, 12), 0.12);
  assert.equal(formatoPrecio(0.1), "$0.10");
});
