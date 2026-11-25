import { describe, test } from "node:test";
import assert from "node:assert/strict";

process.env.ESTADO_ARCHIVO = "estado.test.json";
const estado = await import("../estado.js");

describe("estado de la feria", { concurrency: 1 }, () => {
test("una venta en Party Pay baja stock y suma ROJOS", () => {
  const db = estado.reiniciar();
  const antes = estado.producto(db, "imperial").stock;
  const venta = estado.vender("imperial", 8);
  assert.equal(venta.rojos, 16);
  assert.equal(estado.producto(estado.leer(), "imperial").stock, antes - 8);
  assert.equal(estado.leer().rojosCobrados, 16);
  estado.reiniciar();
});

test("no vende más de lo que hay", () => {
  estado.reiniciar();
  assert.throws(() => estado.vender("imperial", 500), /quedan/);
  estado.reiniciar();
});
});
