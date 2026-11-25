import { HORIZON, ROJOS, USDC } from "./red.js";

function linea(balances, asset) {
  return balances?.find((entry) => entry.asset_code === asset.code && entry.asset_issuer === asset.issuer);
}

export async function saldos(publica) {
  if (!publica) return { usdc: null, rojos: null, error: "Sin cuenta." };
  const respuesta = await fetch(`${HORIZON}/accounts/${publica}`);
  if (respuesta.status === 404) return { usdc: 0, rojos: 0, existe: false };
  if (!respuesta.ok) return { usdc: null, rojos: null, error: `Horizon respondió ${respuesta.status}` };
  const cuenta = await respuesta.json();
  const usdc = linea(cuenta.balances, USDC);
  const rojos = linea(cuenta.balances, ROJOS);
  return {
    usdc: usdc ? Number(usdc.balance) : 0,
    rojos: rojos ? Number(rojos.balance) : 0,
    existe: true,
    trustlineUsdc: Boolean(usdc),
    trustlineRojos: Boolean(rojos),
  };
}

export async function saldoUsdc(publica) {
  const s = await saldos(publica);
  return s.usdc;
}
