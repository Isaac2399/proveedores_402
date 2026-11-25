# Parte de Isaac2399

La app entera de Proveedores 402: la tienda de Party Pay, el agente que paga con tope y el panel del proveedor.

## Cómo correrla

Desde la raíz del repo, con Node 22:

```bash
npm install
cp .env.example .env
npm run preparar
npm start
```

Abre http://localhost:4317.

`npm run preparar` usa Friendbot y el DEX de testnet. Si en ese momento no hay ruta de XLM a USDC, el mensaje lo dice y el USDC se saca en https://faucet.circle.com (Stellar testnet) a la cuenta `MI_PUBLICA`. Después hay que pasarle presupuesto a `AGENTE_PUBLICA`.

Los topes están en `.env`: `TOPE_PEDIDO=$0.12`, `TOPE_DIA=$0.30`, `TOPE_REEMBOLSO=$0.08`.

## Qué mira el jurado en esta parte

- El agente paga solo y recorta el pedido para no pasarse del tope.
- Un pedido de 40 Imperial (0.40 USDC) se rechaza antes de firmar.
- Repetir el mismo pedido recibe 403 y no se firma otra vez.
- Con saldo cero, o si Horizon no contesta, no se firma.
- Un hash real con el monto cambiado a 9.99 USDC se rechaza. El proveedor no alista ese pago.
- El reembolso del pedido completo se pasa del tope de 0.08 USDC y no se firma. El de 4 unidades sí.

ROJOS es el token con el que el cliente le paga al bar en Party Pay. USDC es con lo que el agente le paga al proveedor. Los dos son de testnet.

| | |
| --- | --- |
| ROJOS | [GBSLP3N4R65KVUYBAKQL5XAU67ZFGTNO3WBXJXWGDCH5FM3TFBNKXPPW](https://stellar.expert/explorer/testnet/asset/ROJOS-GBSLP3N4R65KVUYBAKQL5XAU67ZFGTNO3WBXJXWGDCH5FM3TFBNKXPPW) |
| USDC | [GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5](https://stellar.expert/explorer/testnet/asset/USDC-GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5) |
| Escrow de Party Pay | [CC633M77TFTEUWK4X4R35DVUB2WXAP5WFN7ZBR2KI5BCFEMTBBX7A2S4](https://stellar.expert/explorer/testnet/contract/CC633M77TFTEUWK4X4R35DVUB2WXAP5WFN7ZBR2KI5BCFEMTBBX7A2S4) |

## Hashes de prueba

Cuentas de esta corrida:

- Agente de la tienda: [GD3D2GDGKD2EEXYZUT7YPONXMM4MEL3KHW4OLC3XXRYFGVRHM34DLBMH](https://stellar.expert/explorer/testnet/account/GD3D2GDGKD2EEXYZUT7YPONXMM4MEL3KHW4OLC3XXRYFGVRHM34DLBMH)
- Proveedor: [GDTEEIE56ILEPKZPC5BORBIJVVA6MHZ2AGA3DKGNVBRIGC6DQGJSGY6I](https://stellar.expert/explorer/testnet/account/GDTEEIE56ILEPKZPC5BORBIJVVA6MHZ2AGA3DKGNVBRIGC6DQGJSGY6I)

Trustline de USDC y ROJOS:

- Proveedor: https://stellar.expert/explorer/testnet/tx/a0096679f26e5088f9dd6e8850d83205dbb8a2e9167bef91282503f7e1123c61
- Agente: https://stellar.expert/explorer/testnet/tx/29a7ff45a9e1da69b4ad8ddee3ae5ee8483eaae015e9d89f118fafa9e891278b

Fondos:

- 2 USDC para el proveedor: https://stellar.expert/explorer/testnet/tx/5dad133a9a931f39f0ec347c9491e32ae5f26f5af007e56ae107908c0c9a1457
- 0.40 USDC de presupuesto para el agente: https://stellar.expert/explorer/testnet/tx/13b573950bc087a717c169c82e5eacf99ce22b7d9a475768e5c8773a89d0b20e

Pagos del demo:

- 12 Imperial, 0.12 USDC, del agente al proveedor: https://stellar.expert/explorer/testnet/tx/8aaf4c0c60ac01602195b0cddd9f74a958a927e69f3b1b5542edcadde14b737b
- Reembolso de 4 unidades, 0.04 USDC, del proveedor al agente: https://stellar.expert/explorer/testnet/tx/47beb74fe00609d03b41e1df82bcf9a5958edca3b728c55cb5a01f5de8800170
