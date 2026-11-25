# Proveedores 402

El agente de un bar en Party Pay reabastece solo: mira el stock, pide lo que cabe en su tope y le paga al proveedor en USDC. Si el pedido se pasa, no firma.

**Track:** Agente que paga · Código 402 · BAF México × Programa de Embajadores de Stellar · Stellar testnet (dinero de prueba)

Party Pay es la app donde el cliente pide cerveza o comida desde el celular y paga con ROJOS. Este repo es el otro lado: el proveedor y el agente de la tienda.

## Para quién es

Para un proveedor que surte bares y puestos de una feria, y para la tienda que ya vende en [Party Pay](https://partypay-stellar-daap.vercel.app/). A media noche se acaba la Imperial. Hoy alguien llama, fía y paga después. Se pierde la venta, o se pide de más.

Cobrar por pedido tiene sentido porque el proveedor no abre una cuenta por cobrar ni suelta producto sin ver el pago. El agente paga ese pedido, con un tope, y si el camión no trae todo, el proveedor devuelve por el mismo riel, también con tope. ROJOS se queda en la feria, entre el cliente y el bar. USDC es la liquidación con el proveedor.

## Qué hace el agente

1. Lee el stock y las ventas en ROJOS.
2. Calcula lo que hace falta para cubrir dos días.
3. Recorta ese número si no cabe en el tope de unidades, en el tope del pedido o en el tope del día.
4. Pregunta el precio a la API del proveedor. Si no es el esperado, si pasa el tope, si el pedido ya se pagó o si no se puede leer el saldo, no firma.
5. Paga una vez, en USDC de testnet, con el protocolo x402.
6. El proveedor solo alista si la transacción verifica en la red: contrato USDC, destino y monto.

En testnet cada Imperial se liquida a 0.01 USDC para que el demo quepa en una billetera de práctica. En la barra, esa cerveza vale ₡700 y el cliente la paga en ROJOS (emisor `GBSLP3N4R65KVUYBAKQL5XAU67ZFGTNO3WBXJXWGDCH5FM3TFBNKXPPW`).

Topes de fábrica: 0.12 USDC por pedido, 0.30 USDC al día, 0.08 USDC por reembolso.

## Guion de 5 minutos

1. Abre la app. A la izquierda está Bar La Ruta, al centro el agente, a la derecha Cervecería del Valle.
2. Pulsa **Salieron 8** en Imperial. El stock baja de 28 a 20 y la tienda cobra 16 ROJOS.
3. Pulsa **Revisar stock y pagar**. El agente necesita 16 unidades para dos días y solo paga 12, porque 0.12 USDC es el tope. Abre el link de Stellar Expert.
4. Pulsa **Pedir 40 Imperial y pasarse del tope**. La API cobra 0.40 y no se firma nada.
5. Pulsa **Volver a pagar el mismo pedido** y **Comprobar el pago con otro monto**. El servidor responde 403 y la verificación rechaza 9.99 USDC.
6. En el proveedor, **Reembolsar todo el pedido** (se pasa de 0.08) y después **Reembolsar 4**. El segundo sí vuelve a la tienda, con su propio link.
7. **Alistar** y **Confirmar entrega**. Entran 8 unidades, no las 12.

## Cómo correrlo

Hace falta Node 22.

```bash
npm install
cp .env.example .env
npm run preparar
npm start
```

`npm run preparar` crea dos cuentas de testnet, les abre trustline de USDC y de ROJOS, cambia un poco de XLM por USDC y le deja 0.40 USDC al agente. Las llaves quedan en `.env` y no se suben. Luego abre http://localhost:4317.

`npm test` cubre el recorte del tope, el saldo insuficiente, el pago repetido, el monto inválido y el reembolso.

## Hashes de prueba

La corrida de referencia está en [la parte de Isaac2399](partes/Isaac2399/README.md): el pago de 0.12 USDC y el reembolso de 0.04 USDC, con link a Stellar Expert.

## Equipo y partes

- [Isaac2399](https://github.com/Isaac2399): [su parte](partes/Isaac2399/README.md)
