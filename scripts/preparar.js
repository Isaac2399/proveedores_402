import { Asset, BASE_FEE, Horizon, Keypair, Networks, Operation, TransactionBuilder } from "@stellar/stellar-sdk";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { HORIZON, ROJOS, USDC, enlaceCuenta, enlaceTx } from "../red.js";

const horizon = new Horizon.Server(HORIZON);
const usdc = new Asset(USDC.code, USDC.issuer);
const rojos = new Asset(ROJOS.code, ROJOS.issuer);
const PRESUPUESTO_AGENTE = "1.50";

function leerEnv(ruta) {
  if (!existsSync(ruta)) return {};
  const out = {};
  for (const linea of readFileSync(ruta, "utf8").split("\n")) {
    if (!linea || linea.startsWith("#") || !linea.includes("=")) continue;
    const i = linea.indexOf("=");
    out[linea.slice(0, i)] = linea.slice(i + 1);
  }
  return out;
}

function escribirEnv(valores) {
  const lineas = [
    `MI_PUBLICA=${valores.MI_PUBLICA}`,
    `MI_SECRETA=${valores.MI_SECRETA}`,
    `AGENTE_PUBLICA=${valores.AGENTE_PUBLICA}`,
    `AGENTE_SECRETA=${valores.AGENTE_SECRETA}`,
    `TOPE_PEDIDO=${valores.TOPE_PEDIDO || "$0.50"}`,
    `TOPE_DIA=${valores.TOPE_DIA || "$0.50"}`,
    `TOPE_REEMBOLSO=${valores.TOPE_REEMBOLSO || "$0.50"}`,
    `PORT=${valores.PORT || "4317"}`,
    "",
  ];
  writeFileSync(".env", lineas.join("\n"));
}

async function activar(kp) {
  const r = await fetch(`https://friendbot.stellar.org?addr=${kp.publicKey()}`);
  if (!r.ok) throw new Error(`Friendbot falló (${r.status}).`);
  for (let i = 0; i < 8; i += 1) {
    try {
      return await horizon.loadAccount(kp.publicKey());
    } catch {
      await new Promise((ok) => setTimeout(ok, 400));
    }
  }
  return horizon.loadAccount(kp.publicKey());
}

async function trustlines(kp) {
  const cuenta = await horizon.loadAccount(kp.publicKey());
  const tiene = (asset) => cuenta.balances.some((b) => b.asset_code === asset.getCode() && b.asset_issuer === asset.getIssuer());
  const faltan = [usdc, rojos].filter((asset) => !tiene(asset));
  if (!faltan.length) return null;
  const tx = new TransactionBuilder(cuenta, { fee: BASE_FEE, networkPassphrase: Networks.TESTNET });
  for (const asset of faltan) tx.addOperation(Operation.changeTrust({ asset }));
  const lista = tx.setTimeout(60).build();
  lista.sign(kp);
  const res = await horizon.submitTransaction(lista);
  return res.hash;
}

async function conseguirUsdc(kp, quiero) {
  const rutas = await horizon.strictReceivePaths([Asset.native()], usdc, quiero).call();
  if (!rutas.records.length) throw new Error("No hay ruta XLM→USDC ahora. Usa https://faucet.circle.com en Stellar testnet.");
  const mejor = rutas.records[0];
  const maxXlm = (Number(mejor.source_amount) * 1.05).toFixed(7);
  const cuenta = await horizon.loadAccount(kp.publicKey());
  const tx = new TransactionBuilder(cuenta, { fee: BASE_FEE, networkPassphrase: Networks.TESTNET })
    .addOperation(Operation.pathPaymentStrictReceive({
      sendAsset: Asset.native(),
      sendMax: maxXlm,
      destination: kp.publicKey(),
      destAsset: usdc,
      destAmount: quiero,
      path: mejor.path.map((p) => (p.asset_type === "native" ? Asset.native() : new Asset(p.asset_code, p.asset_issuer))),
    }))
    .setTimeout(90)
    .build();
  tx.sign(kp);
  const res = await horizon.submitTransaction(tx);
  return res.hash;
}

async function enviarUsdc(desde, hacia, monto) {
  const cuenta = await horizon.loadAccount(desde.publicKey());
  const tx = new TransactionBuilder(cuenta, { fee: BASE_FEE, networkPassphrase: Networks.TESTNET })
    .addOperation(Operation.payment({ destination: hacia.publicKey(), asset: usdc, amount: monto }))
    .setTimeout(60)
    .build();
  tx.sign(desde);
  const res = await horizon.submitTransaction(tx);
  return res.hash;
}

const actual = leerEnv(".env");
const proveedor = actual.MI_SECRETA ? Keypair.fromSecret(actual.MI_SECRETA) : Keypair.random();
const agente = actual.AGENTE_SECRETA ? Keypair.fromSecret(actual.AGENTE_SECRETA) : Keypair.random();

if (!actual.MI_SECRETA) await activar(proveedor);
if (!actual.AGENTE_SECRETA) await activar(agente);

const trustProveedor = await trustlines(proveedor);
const trustAgente = await trustlines(agente);
const compra = await conseguirUsdc(proveedor, "3");
const presupuesto = await enviarUsdc(proveedor, agente, PRESUPUESTO_AGENTE);

escribirEnv({
  ...actual,
  MI_PUBLICA: proveedor.publicKey(),
  MI_SECRETA: proveedor.secret(),
  AGENTE_PUBLICA: agente.publicKey(),
  AGENTE_SECRETA: agente.secret(),
});

console.log("Billeteras listas. Las llaves quedaron solo en .env.");
console.log(`Proveedor: ${enlaceCuenta(proveedor.publicKey())}`);
console.log(`Agente de la tienda: ${enlaceCuenta(agente.publicKey())}`);
if (trustProveedor) console.log(`Trustline USDC y ROJOS del proveedor: ${enlaceTx(trustProveedor)}`);
if (trustAgente) console.log(`Trustline USDC y ROJOS del agente: ${enlaceTx(trustAgente)}`);
console.log(`Compra de 3 USDC: ${enlaceTx(compra)}`);
console.log(`Presupuesto del agente, ${PRESUPUESTO_AGENTE} USDC: ${enlaceTx(presupuesto)}`);
