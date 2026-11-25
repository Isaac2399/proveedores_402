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
  pagado: "Pagado. Falta que el proveedor empague.",
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

function siguientePaso(estado) {
  if (!estado.listo) {
    return "Faltan las billeteras de prueba. En la carpeta del proyecto corre npm run preparar, reinicia la app y vuelve aquí.";
  }
  const bajo = estado.productos.find((p) => p.stock <= p.minimo);
  const porEmpacar = estado.pedidos.find((p) => p.verificado && p.estado === "pagado");
  const empacando = estado.pedidos.find((p) => p.estado === "alistando");
  if (empacando) return `Siguiente: confirma la entrega de ${empacando.nombre}. El stock del bar sube con lo que sí llegó.`;
  if (porEmpacar) return `Siguiente: ${porEmpacar.nombre} ya está pagado. En el proveedor, empaca el pedido o devuelve lo que no puedas llevar.`;
  if (bajo) return `Siguiente: ${bajo.nombre} quedó en ${bajo.stock} y el mínimo es ${bajo.minimo}. Pulsa «Que el agente pida y pague».`;
  if (estado.pedidos.some((p) => p.estado === "entregado")) {
    return "Esta ronda ya se entregó. Para verla otra vez, pulsa «Empezar la demo de nuevo» y vende Imperial hasta que baje de 24.";
  }
  return "Siguiente: simula una venta. En Imperial, pulsa «Se vendieron 8» hasta que queden menos de 24.";
}

function pintar(estado) {
  $("#tienda").textContent = estado.tienda;
  $("#proveedor").textContent = estado.proveedor;
  $("#rojos").textContent = String(estado.rojosCobrados);
  const ahora = $("#ahora");
  ahora.replaceChildren();
  const etiqueta = document.createElement("strong");
  etiqueta.textContent = "Qué hacer ahora";
  ahora.append(etiqueta, document.createTextNode(` ${siguientePaso(estado)}`));

  const aviso = $("#aviso");
  aviso.hidden = estado.listo;
  if (!estado.listo) aviso.textContent = "Sin billeteras el agente no puede pagar. Corre npm run preparar y vuelve a abrir la app.";

  const resultado = $("#resultado");
  resultado.hidden = !ultimo;
  resultado.textContent = ultimo || "";

  const agente = $("#saldo-agente");
  agente.replaceChildren(caja("Dinero del agente para pagar", estado.saldos.agente ? dinero(estado.saldos.agente.usdc) : "sin billetera"));
  if (estado.cuentas.agenteUrl) agente.append(enlace(estado.cuentas.agenteUrl, "Ver la billetera del agente"));

  const proveedorSaldo = $("#saldo-proveedor");
  proveedorSaldo.replaceChildren(caja("Dinero que ya recibió", estado.saldos.proveedor ? dinero(estado.saldos.proveedor.usdc) : "sin billetera"));
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
  $("#revisar").classList.toggle("recomendado", estado.listo && bajo && !hayPedidoAbierto);
  $("#reiniciar").classList.toggle("recomendado", rondaLista);

  const productos = $("#productos");
  productos.replaceChildren();
  for (const p of estado.productos) {
    const unidades = p.sku === "papas" ? 4 : 8;
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
    izq.textContent = `El cliente paga ${p.rojosPorUnidad} ROJOS`;
    const der = document.createElement("span");
    der.textContent = `Reponer: ${dinero(p.precioUsdc)} c/u`;
    meta.append(izq, der);
    const barra = document.createElement("div");
    barra.className = p.stock <= p.minimo ? "barra bajo" : "barra";
    const span = document.createElement("span");
    span.style.width = `${Math.min(100, (p.stock / (p.minimo * 2)) * 100)}%`;
    barra.append(span);
    const vender = boton(`Se vendieron ${unidades}`, !rondaLista && p.stock > p.minimo && p.sku === "imperial" && !hayPedidoAbierto ? "recomendado" : "", {
      accion: "vender",
      sku: p.sku,
      unidades: String(unidades),
    });
    card.append(h, situacion, meta, barra, vender);
    productos.append(card);
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
    if (btn.id === "revisar") data = await post("/api/agente/revisar");
    else if (btn.id === "forzar") data = await post("/api/agente/forzar", { sku: "imperial", unidades: 40 });
    else if (btn.id === "sin-saldo") data = await post("/api/agente/sin-saldo", { sku: "imperial", unidades: 12 });
    else if (btn.id === "repetir") data = await post("/api/agente/repetir");
    else if (btn.id === "juzgar") data = await post("/api/pagos/juzgar", { monto: "9.99" });
    else if (btn.id === "reiniciar") data = await post("/api/demo/reiniciar");
    else if (btn.dataset.accion === "vender") {
      data = await post("/api/ventas", { sku: btn.dataset.sku, unidades: Number(btn.dataset.unidades) });
      if (data.ok) data.mensaje = `Se vendieron ${btn.dataset.unidades} ${data.item.nombre}. El bar cobró ${data.rojos} ROJOS y quedan ${data.estado}.`;
    }
    else if (btn.dataset.accion === "alistar") {
      data = await post(`/api/pedidos/${btn.dataset.id}/alistar`);
      if (data.ok && !data.mensaje) data.mensaje = "El proveedor está empacando el pedido.";
    } else if (btn.dataset.accion === "entregar") {
      data = await post(`/api/pedidos/${btn.dataset.id}/entregar`);
      if (data.ok && !data.mensaje) data.mensaje = "Entrega confirmada. Lo que sí llegó ya está en el stock del bar.";
    }
    else if (btn.dataset.accion === "reembolso") data = await post(`/api/pedidos/${btn.dataset.id}/reembolsar`, { unidades: Number(btn.dataset.unidades) });
    ultimo = data.mensaje || (data.ok ? "Listo." : "No se pudo completar.");
  } finally {
    ocupado(btn, false);
    await refrescar();
  }
});

refrescar();
