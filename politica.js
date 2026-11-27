const CENTAVOS = 100;

export function redondearUsdc(valor) {
  return Math.round(Number(valor) * CENTAVOS) / CENTAVOS;
}

export function cotizar(precioUnitario, unidades) {
  if (!Number.isInteger(unidades) || unidades <= 0) {
    throw new Error("Las unidades tienen que ser un entero mayor que cero.");
  }
  return redondearUsdc(Number(precioUnitario) * unidades);
}

export function formatoPrecio(usdc) {
  return `$${redondearUsdc(usdc).toFixed(2)}`;
}

export function atomicosAUsdc(amount) {
  const n = Number(amount);
  if (!Number.isFinite(n)) throw new Error("El precio de la API no se puede leer.");
  if (String(amount).includes(".")) return redondearUsdc(n);
  return redondearUsdc(n / 1e7);
}

// Cuánto pedir para cubrir los días, sin pasarse de unidades ni de dólares.
export function decidirReposicion(producto, reglas) {
  const stock = Number(producto.stock);
  const minimo = Number(producto.minimo);
  if (stock > minimo) {
    return {
      ok: false,
      codigo: "stock_ok",
      mensaje: `${producto.nombre} tiene ${stock} unidades. El mínimo es ${minimo}, así que el agente no pide nada.`,
    };
  }

  const fijo = Number(producto.pedidoUnidades);
  const necesidad = fijo > 0
    ? fijo
    : Math.max(0, Number(producto.ventaDiaria) * Number(producto.cubrirDias) - stock);
  if (necesidad <= 0) {
    return {
      ok: false,
      codigo: "stock_ok",
      mensaje: `${producto.nombre} ya cubre los próximos ${producto.cubrirDias} días.`,
    };
  }

  const porUnidades = Math.min(necesidad, Number(producto.maxUnidades));
  const precio = Number(producto.precioUsdc);
  const restanteDia = redondearUsdc(Number(reglas.topeDiaUsdc) - Number(reglas.gastadoHoyUsdc));
  const techo = Math.min(Number(reglas.topePedidoUsdc), restanteDia);
  const maxPorDinero = techo > 0 ? Math.floor(techo / precio + 1e-9) : 0;

  if (maxPorDinero <= 0) {
    return {
      ok: false,
      codigo: "tope",
      unidadesIntentadas: porUnidades,
      usdc: cotizar(precio, porUnidades),
      mensaje: `Reponer ${producto.nombre} costaría más que el tope (pedido ${formatoPrecio(reglas.topePedidoUsdc)}, queda ${formatoPrecio(Math.max(0, restanteDia))} del día). No se firma nada.`,
    };
  }

  const unidades = Math.min(porUnidades, maxPorDinero);
  const usdc = cotizar(precio, unidades);
  const recortado = unidades < necesidad;
  return {
    ok: true,
    codigo: "pedir",
    unidades,
    necesidad,
    usdc,
    recortado,
    rojos: unidades * Number(producto.rojosPorUnidad),
    mensaje: recortado
      ? `Las ventas de ${producto.nombre} piden ${necesidad} unidades. El tope solo deja pagar ${unidades} (${formatoPrecio(usdc)}). El agente pide ese recorte, no el pedido completo.`
      : `El agente pide ${unidades} de ${producto.nombre} por ${formatoPrecio(usdc)}. Cabe en el tope.`,
  };
}

// La última puerta, antes de firmar. Si algo no cuadra, no hay transacción.
export function evaluarCobro({ usdc, tope, saldo, yaPagado, esperado }) {
  if (yaPagado) {
    return { ok: false, codigo: "repetido", mensaje: "Ese pedido ya se pagó. No se vuelve a firmar." };
  }
  if (saldo == null) {
    return { ok: false, codigo: "saldo_desconocido", mensaje: "No se pudo leer el saldo USDC. No se firma a ciegas." };
  }
  if (esperado != null && redondearUsdc(usdc) !== redondearUsdc(esperado)) {
    return {
      ok: false,
      codigo: "invalido",
      mensaje: `La API cobra ${formatoPrecio(usdc)} y el pedido vale ${formatoPrecio(esperado)}. No se firma.`,
    };
  }
  if (redondearUsdc(usdc) > redondearUsdc(tope) + 1e-9) {
    return {
      ok: false,
      codigo: "tope",
      mensaje: `La API cobra ${formatoPrecio(usdc)} y el tope es ${formatoPrecio(tope)}. No se firmó ni se envió nada.`,
    };
  }
  if (Number(saldo) + 1e-9 < Number(usdc)) {
    return {
      ok: false,
      codigo: "saldo",
      mensaje: `Saldo ${formatoPrecio(saldo)} USDC y el cobro es ${formatoPrecio(usdc)}. No se firmó nada.`,
    };
  }
  return { ok: true };
}

export function evaluarReembolso({ usdc, tope, saldo, yaReembolsado, restante }) {
  if (yaReembolsado) {
    return { ok: false, codigo: "repetido", mensaje: "Ese pedido ya tuvo un reembolso. No se paga otra vez." };
  }
  if (redondearUsdc(usdc) > redondearUsdc(restante) + 1e-9) {
    return { ok: false, codigo: "invalido", mensaje: "El reembolso es mayor que lo que se pagó. No se firma." };
  }
  if (saldo == null) {
    return { ok: false, codigo: "saldo_desconocido", mensaje: "No se pudo leer el saldo del proveedor. No se reembolsa a ciegas." };
  }
  if (Number(saldo) + 1e-9 < Number(usdc)) {
    return {
      ok: false,
      codigo: "saldo",
      mensaje: `El proveedor tiene ${formatoPrecio(saldo)} USDC y el reembolso es ${formatoPrecio(usdc)}. No se firmó nada.`,
    };
  }
  return { ok: true };
}
