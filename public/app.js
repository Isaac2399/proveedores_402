const $ = (id) => document.querySelector(id);

function dinero(n) {
  if (n == null || Number.isNaN(Number(n))) return "—";
  return `${Number(n).toFixed(2)} USDC`;
}

function hora(iso) {
  return new Intl.DateTimeFormat("es-CR", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: "America/Costa_Rica",
  }).format(new Date(iso));
}

function enlace(href, texto) {
  const a = document.createElement("a");
  a.href = href;
  a.target = "_blank";
  a.rel = "noreferrer";
  a.textContent = texto;
  return a;
}

function textoConLinks(padre, texto) {
  const re = /https:\/\/\S+/g;
  let last = 0;
  for (const match of texto.matchAll(re)) {
    padre.append(document.createTextNode(texto.slice(last, match.index)));
    padre.append(enlace(match[0], "ver en Stellar Expert"));
    last = match.index + match[0].length;
  }
  padre.append(document.createTextNode(texto.slice(last)));
}

function boton(texto, clase, attrs) {
  const b = document.createElement("button");
  b.type = "button";
  b.textContent = texto;
  if (clase) b.className = clase;
  Object.entries(attrs || {}).forEach(([k, v]) => b.dataset[k] = v);
  return b;
}

async function post(url, body) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json", accept: "application/json" },
    body: JSON.stringify(body || {}),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok && data.mensaje == null) data.mensaje = data.error || `Error ${res.status}`;
  return data;
}

const ESTADOS = {
  pagado: "Pagado. El distribuidor ya puede empacar.",
  alistando: "El proveedor lo está empacando.",
  entregado: "Ya llegó al bar.",
  observado: "El pago no cuadra. No se empaca.",
  reembolsado: "Se devolvió el dinero de este pedido.",
};

let ultimo = null;

function caja(titulo, valor) {
  const div = document.createElement("div");
  const s = document.createElement("span");
  s.textContent = titulo;
  const strong = document.createElement("strong");
  strong.textContent = valor;
  div.append(s, strong);
  return div;
}

function despuesDe(estado, pedido, tipo, texto) {
  if (!pedido) return false;
  return estado.bitacora.some((b) => b.tipo === tipo && b.en > pedido.creado && b.mensaje.toLowerCase().includes(texto));
}

function guion(estado) {
  const imperial = estado.productos.find((p) => p.sku === "imperial");
  const abierto = estado.pedidos.find((p) => p.verificado && p.estado === "pagado");
  const empacando = estado.pedidos.find((p) => p.estado === "alistando");
  const total = 6;
  if (!estado.listo) {
    return { n: 1, total, panel: null, titulo: "Falta preparar las billeteras", texto: "Sin billeteras de prueba el agente no puede pagar. En la carpeta del proyecto corre npm run preparar y vuelve a abrir la app.", boton: null };
  }
  if (!abierto && !empacando && imperial.stock > imperial.minimo) {
    return {
      n: 1, total, panel: "party", paso: "vender", sku: "imperial", unidades: "8",
      titulo: "En Party Pay, un cliente pide",
      texto: `A la izquierda, en el celular. Quedan ${imperial.stock} Imperial. Ocho pedidos más y el bar se queda corto. El cliente paga en ROJOS.`,
      boton: "Pedir 8 Imperial en Party Pay",
    };
  }
  if (!abierto && !empacando) {
    return {
      n: 2, total, panel: "sistema", paso: "revisar",
      titulo: "La tienda le paga sola al distribuidor",
      texto: `A la derecha. Quedan ${imperial.stock} Imperial y el mínimo es ${imperial.minimo}. La tienda pide lo que falta y paga ahora, sin pasarse de ${estado.topes.pedido}.`,
      boton: "Pagar la reposición",
    };
  }
  if (abierto && !despuesDe(estado, abierto, "tope", "0.40")) {
    return {
      n: 3, total, panel: "sistema", paso: "forzar",
      titulo: "Si el pedido es muy grande, no paga",
      texto: "El pedido de verdad ya se pagó. Ahora pedimos 40 cervezas a propósito. Eso cuesta más que el presupuesto, así que el agente se detiene y no manda dinero.",
      boton: "Pedir 40 y ver que se detiene",
    };
  }
  if (abierto && !despuesDe(estado, abierto, "tope", "reembolso")) {
    return {
      n: 4, total, panel: "sistema", paso: "reembolso", id: abierto.id, unidades: String(abierto.unidades),
      titulo: "No se puede devolver el pedido entero",
      texto: "El proveedor quiere devolver todo el dinero. Eso se pasa del límite de devolución, así que el sistema no lo deja.",
      boton: "Intentar devolver todo",
    };
  }
  if (abierto && !abierto.reembolsoHash) {
    return {
      n: 5, total, panel: "sistema", paso: "reembolso", id: abierto.id, unidades: "4",
      titulo: "Devuelve solo lo que no cabe en el camión",
      texto: "4 cervezas no van. Esa devolución sí cabe en el límite y el dinero regresa al bar.",
      boton: "Devolver 4 cervezas",
    };
  }
  if (abierto) {
    return {
      n: 6, total, panel: "sistema", paso: "alistar", id: abierto.id,
      titulo: "El proveedor empaca lo que sí va a llevar",
      texto: "El pago ya está confirmado. El proveedor empaca las cervezas que no se devolvieron.",
      boton: "Empacar el pedido",
    };
  }
  if (empacando) {
    return {
      n: 6, total, panel: "sistema", paso: "entregar", id: empacando.id,
      titulo: "La cerveza llega al bar",
      texto: "Al confirmar, el stock sube solo con lo que sí llegó. Lo devuelto no entra.",
      boton: "Ya llegó al bar",
    };
  }
  return {
    n: 6, total, panel: "sistema", paso: "reiniciar",
    titulo: "Eso es la continuación",
    texto: "Party Pay vendió. La tienda pagó sola, el distribuidor cobró antes de salir y llevó solo lo que sí cabía. Listo para otra noche.",
    boton: "Empezar otra noche",
  };
}

function promesa(titulo, texto) {
  const div = document.createElement("article");
  div.className = "promesa";
  const s = document.createElement("span");
  s.textContent = titulo;
  const strong = document.createElement("strong");
  strong.textContent = texto;
  div.append(s, strong);
  return div;
}

function textosPromesa(estado) {
  const activo = estado.pedidos.find((p) => p.estado === "pagado" || p.estado === "alistando");
  const ultimoPedido = estado.pedidos[0];
  const pedido = activo || ultimoPedido;
  const bajo = estado.productos.some((p) => p.stock <= p.minimo);
  let pago = "Party Pay todavía alcanza. La tienda no ha tenido que pagar.";
  if (bajo && !activo) pago = `El inventario bajó del mínimo. La tienda puede pagar sola, hasta ${estado.topes.pedido}.`;
  if (activo) pago = `La tienda ya pagó ${dinero(activo.usdc)} sola, sin armar el pedido a mano.`;
  let ruta = "Todavía no hay ruta. El distribuidor no sale.";
  let dineroAntes = "Cuando la tienda pague, el dinero entra antes de cargar el camión.";
  if (pedido) {
    const llevan = pedido.unidades - (pedido.unidadesReembolsadas || 0);
    if (pedido.estado === "pagado") ruta = `Llevar ${llevan} de ${pedido.nombre}. Ya se puede empacar.`;
    else if (pedido.estado === "alistando") ruta = `Sale ahora: ${llevan} de ${pedido.nombre}.`;
    else if (pedido.estado === "entregado") ruta = `Ya se entregaron ${llevan} de ${pedido.nombre}.`;
    else if (pedido.estado === "reembolsado") ruta = `Ese pedido se devolvió completo. No hay que salir.`;
    else ruta = `${pedido.nombre}: el pago no cuadra, así que no sale.`;
    if (pedido.verificado && pedido.estado !== "entregado" && pedido.estado !== "reembolsado") {
      dineroAntes = `Ya entraron ${dinero(pedido.usdc)}. Sale con el dinero en la cuenta.`;
    } else if (pedido.estado === "entregado") {
      dineroAntes = `Cobró ${dinero(pedido.usdc)} antes de entregar. El pedido ya llegó.`;
    }
  }
  return [
    ["Pago automático", pago],
    ["Cuánto y cuándo", ruta],
    ["Dinero por adelantado", dineroAntes],
  ];
}

function pintarGuia(estado) {
  const g = guion(estado);
  const party = $("#guia-party");
  const sistema = $("#guia-sistema");
  party.replaceChildren();
  sistema.replaceChildren();
  const guia = g.panel === "party" ? party : sistema;
  guia.className = "guia";
  const puntos = document.createElement("div");
  puntos.className = "puntos";
  for (let i = 1; i <= g.total; i += 1) {
    const marca = document.createElement("i");
    if (i <= g.n) marca.className = "hecho";
    puntos.append(marca);
  }
  const paso = document.createElement("p");
  paso.className = "paso";
  paso.textContent = `Paso ${g.n} de ${g.total}`;
  const titulo = document.createElement("h2");
  titulo.textContent = g.titulo;
  const texto = document.createElement("p");
  texto.textContent = g.texto;
  guia.append(puntos, paso, titulo, texto);
  if (g.boton) {
    const b = document.createElement("button");
    b.type = "button";
    b.textContent = g.boton;
    b.dataset.paso = g.paso;
    if (g.sku) b.dataset.sku = g.sku;
    if (g.unidades) b.dataset.unidades = g.unidades;
    if (g.id) b.dataset.id = g.id;
    guia.append(b);
  }
  $("#lado-party").classList.toggle("en-foco", g.panel === "party");
  $("#lado-sistema").classList.toggle("en-foco", g.panel === "sistema");
}

function pintar(estado) {
  $("#tienda").textContent = estado.tienda;
  $("#proveedor").textContent = estado.proveedor;
  $("#rojos").textContent = String(estado.rojosCobrados);
  pintarGuia(estado);

  const aviso = $("#aviso");
  aviso.hidden = estado.listo;
  if (!estado.listo) aviso.textContent = "Sin billeteras el agente no puede pagar. Corre npm run preparar y vuelve a abrir la app.";

  const resultado = $("#resultado");
  resultado.hidden = !ultimo;
  resultado.textContent = ultimo || "";

  const agente = $("#saldo-agente");
  agente.replaceChildren(caja("Presupuesto de la tienda", estado.saldos.agente ? dinero(estado.saldos.agente.usdc) : "sin billetera"));
  if (estado.cuentas.agenteUrl) agente.append(enlace(estado.cuentas.agenteUrl, "Ver la billetera del agente"));

  const proveedorSaldo = $("#saldo-proveedor");
  proveedorSaldo.replaceChildren(caja("Ya cobrado, antes de salir", estado.saldos.proveedor ? dinero(estado.saldos.proveedor.usdc) : "sin billetera"));
  if (estado.cuentas.proveedorUrl) proveedorSaldo.append(enlace(estado.cuentas.proveedorUrl, "Ver la billetera del proveedor"));

  const limites = $("#limites");
  limites.replaceChildren(
    caja("Máximo por pedido", estado.topes.pedido),
    caja("Máximo del día", estado.topes.dia),
    caja("Gastado hoy", dinero(estado.gastadoHoy)),
    caja("Máximo a devolver", estado.topes.reembolso),
  );

  const bajo = estado.productos.some((p) => p.stock <= p.minimo);
  const hayPedidoAbierto = estado.pedidos.some((p) => p.verificado && (p.estado === "pagado" || p.estado === "alistando"));
  const rondaLista = estado.pedidos.some((p) => p.estado === "entregado") && !bajo && !hayPedidoAbierto;
  $("#reiniciar").classList.toggle("recomendado", rondaLista);

  const promesas = $("#promesas");
  promesas.replaceChildren();
  for (const [titulo, texto] of textosPromesa(estado)) promesas.append(promesa(titulo, texto));

  const productos = $("#productos");
  productos.replaceChildren();
  for (const p of estado.productos) {
    const card = document.createElement("article");
    card.className = "producto";
    const h = document.createElement("h3");
    h.textContent = p.nombre;
    const situacion = document.createElement("p");
    situacion.className = "ayuda";
    situacion.textContent = p.stock <= p.minimo
      ? `Quedan ${p.stock}. El mínimo es ${p.minimo}: hay que pedir.`
      : `Quedan ${p.stock}. El mínimo es ${p.minimo}: todavía alcanza.`;
    const meta = document.createElement("p");
    meta.className = "meta";
    const izq = document.createElement("span");
    izq.textContent = `${p.rojosPorUnidad} ROJOS`;
    const der = document.createElement("span");
    der.textContent = p.stock <= p.minimo ? "Hay que reponer" : "Alcanza";
    meta.append(izq, der);
    const barra = document.createElement("div");
    barra.className = p.stock <= p.minimo ? "barra bajo" : "barra";
    const span = document.createElement("span");
    span.style.width = `${Math.min(100, (p.stock / (p.minimo * 2)) * 100)}%`;
    barra.append(span);
    card.append(h, situacion, meta, barra);
    productos.append(card);
  }

  const ventas = $("#ventas-phone");
  ventas.replaceChildren();
  const recientes = estado.bitacora.filter((b) => b.tipo === "venta").slice(0, 3);
  if (!recientes.length) {
    const vacio = document.createElement("p");
    vacio.textContent = "Todavía nadie pide en el celular.";
    ventas.append(vacio);
  }
  for (const linea of recientes) {
    const p = document.createElement("p");
    p.textContent = linea.mensaje.replace(/^Party Pay: /, "");
    ventas.append(p);
  }

  const pedidos = $("#pedidos");
  pedidos.replaceChildren();
  if (!estado.pedidos.length) {
    const vacio = document.createElement("p");
    vacio.className = "vacio";
    vacio.textContent = "Aquí aparece el pedido cuando el agente pague. Hasta entonces, el proveedor no tiene nada que empacar.";
    pedidos.append(vacio);
  }
  for (const p of estado.pedidos) {
    const card = document.createElement("article");
    card.className = "pedido";
    const h = document.createElement("h3");
    h.textContent = `${p.unidades} de ${p.nombre}`;
    const pill = document.createElement("p");
    pill.className = "estado-pill";
    pill.textContent = ESTADOS[p.estado] || p.estado;
    const meta = document.createElement("p");
    meta.className = "ayuda";
    meta.textContent = p.unidadesReembolsadas
      ? `Se pagaron ${dinero(p.usdc)}. Se devolvieron ${p.unidadesReembolsadas}. Llegan ${p.unidades - p.unidadesReembolsadas}.`
      : `El bar pagó ${dinero(p.usdc)}.`;
    card.append(h, pill, meta);
    const links = document.createElement("div");
    links.className = "links";
    if (p.experto) links.append(enlace(p.experto, p.verificado ? "Ver el pago en la red" : "El pago todavía no cuadra"));
    if (p.reembolsoExperto) links.append(enlace(p.reembolsoExperto, "Ver la devolución en la red"));
    if (links.childNodes.length) card.append(links);
    const acciones = document.createElement("div");
    acciones.className = "acciones";
    if (p.verificado && p.estado === "pagado" && p.unidadesReembolsadas < p.unidades) {
      acciones.append(boton("Empacar este pedido", "recomendado", { accion: "alistar", id: p.id }));
    }
    if (p.estado === "alistando") acciones.append(boton("Ya lo entregué", "recomendado", { accion: "entregar", id: p.id }));
    if (p.verificado && !p.reembolsoHash && p.estado !== "entregado") {
      acciones.append(boton("Devolver 4 que no llevo", "ghost", { accion: "reembolso", id: p.id, unidades: "4" }));
      acciones.append(boton("Intentar devolver todo (pasa el límite)", "peligro", { accion: "reembolso", id: p.id, unidades: String(p.unidades) }));
    }
    card.append(acciones);
    pedidos.append(card);
  }

  const log = $("#bitacora");
  log.replaceChildren();
  if (!estado.bitacora.length) {
    const li = document.createElement("li");
    li.textContent = "Todavía no pasa nada. Empieza por una venta de Imperial.";
    log.append(li);
  }
  for (const linea of estado.bitacora) {
    const li = document.createElement("li");
    const t = document.createElement("time");
    t.textContent = hora(linea.en);
    t.className = `tipo-${linea.tipo}`;
    const p = document.createElement("p");
    textoConLinks(p, linea.mensaje);
    li.append(t, p);
    log.append(li);
  }

  const frases = [];
  if (estado.ventas) frases.push(`Ventas de esta noche: ${estado.rojosCobrados} ROJOS.`);
  const bajos = estado.productos.filter((p) => p.stock <= p.minimo).map((p) => p.nombre);
  if (bajos.length) frases.push(`Bajo el mínimo ahora: ${bajos.join(", ")}.`);
  for (const p of estado.pedidos) {
    const cerrado = p.estado === "entregado" || p.estado === "reembolsado";
    const devuelto = p.unidadesReembolsadas ? ` De ese pedido se devolvieron ${p.unidadesReembolsadas}.` : "";
    const dicho = ESTADOS[p.estado] || p.estado;
    const enFrase = dicho.charAt(0).toLowerCase() + dicho.slice(1);
    frases.push(`${cerrado ? "Pedido ya cerrado" : "Pedido en curso"} de ${p.nombre}: ${enFrase}${devuelto}`);
  }
  $("#resumen").textContent = frases.join(" ") || "Cuando vendas, el resumen de la noche aparece aquí.";
}

async function refrescar() {
  const res = await fetch("/api/estado");
  pintar(await res.json());
}

function ocupado(btn, valor) {
  document.querySelectorAll("button").forEach((b) => { b.disabled = valor; });
  if (btn) btn.disabled = valor;
}

document.body.addEventListener("click", async (event) => {
  const btn = event.target.closest("button");
  if (!btn) return;
  ocupado(btn, true);
  try {
    let data = {};
    const paso = btn.dataset.paso || btn.id;
    if (paso === "revisar") data = await post("/api/agente/revisar");
    else if (paso === "forzar") data = await post("/api/agente/forzar", { sku: "imperial", unidades: 40 });
    else if (paso === "sin-saldo") data = await post("/api/agente/sin-saldo", { sku: "imperial", unidades: 12 });
    else if (paso === "repetir") data = await post("/api/agente/repetir");
    else if (paso === "juzgar") data = await post("/api/pagos/juzgar", { monto: "9.99" });
    else if (paso === "reiniciar") data = await post("/api/demo/reiniciar");
    else if (paso === "vender" || btn.dataset.accion === "vender") {
      data = await post("/api/ventas", { sku: btn.dataset.sku, unidades: Number(btn.dataset.unidades) });
      if (data.ok) data.mensaje = `Se vendieron ${btn.dataset.unidades} ${data.item.nombre}. El bar cobró ${data.rojos} ROJOS y quedan ${data.estado}.`;
    }
    else if (paso === "alistar" || btn.dataset.accion === "alistar") {
      data = await post(`/api/pedidos/${btn.dataset.id}/alistar`);
      if (data.ok && !data.mensaje) data.mensaje = "El proveedor está empacando lo que sí va a llevar.";
    } else if (paso === "entregar" || btn.dataset.accion === "entregar") {
      data = await post(`/api/pedidos/${btn.dataset.id}/entregar`);
      if (data.ok && !data.mensaje) data.mensaje = "Ya llegó al bar. El stock subió solo con lo que no se devolvió.";
    }
    else if (paso === "reembolso" || btn.dataset.accion === "reembolso") data = await post(`/api/pedidos/${btn.dataset.id}/reembolsar`, { unidades: Number(btn.dataset.unidades) });
    ultimo = data.mensaje || (data.ok ? "Listo." : "No se pudo completar.");
  } finally {
    ocupado(btn, false);
    await refrescar();
  }
});

refrescar();
