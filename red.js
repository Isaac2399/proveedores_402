import { Asset, Networks } from "@stellar/stellar-sdk";

export const RED = "stellar:testnet";
export const HORIZON = "https://horizon-testnet.stellar.org";
export const RPC = "https://soroban-testnet.stellar.org";
export const FACILITATOR = "https://x402.org/facilitator";
export const EXPERT = "https://stellar.expert/explorer/testnet";

// El mismo USDC de testnet que usa codigo-402.
export const USDC = {
  code: "USDC",
  issuer: "GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5",
};

// ROJOS de Party Pay (Secretspay). Los clientes de la tienda pagan con este token.
export const ROJOS = {
  code: "ROJOS",
  issuer: "GBSLP3N4R65KVUYBAKQL5XAU67ZFGTNO3WBXJXWGDCH5FM3TFBNKXPPW",
};

export const ESCROW_PARTYPAY = "CC633M77TFTEUWK4X4R35DVUB2WXAP5WFN7ZBR2KI5BCFEMTBBX7A2S4";

export function contratoDe(asset) {
  return new Asset(asset.code, asset.issuer).contractId(Networks.TESTNET);
}

export function enlaceTx(hash) {
  return `${EXPERT}/tx/${hash}`;
}

export function enlaceCuenta(publica) {
  return `${EXPERT}/account/${publica}`;
}

export function enlaceAsset(asset) {
  return `${EXPERT}/asset/${asset.code}-${asset.issuer}`;
}
