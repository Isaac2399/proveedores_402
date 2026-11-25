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

function pintarSaldos(nodo, titulo, saldo, url) {
  nodo.replaceChildren();
  const a = document.createElement("div");
  const b = document.createElement("div");
  a.innerHTML = `<dt>${titulo}</dt><dd></dd>`;
  a.querySelector("dd").textContent = saldo ? dinero(saldo.usdc) : "sin billetera";
  b.innerHTML = `<dt>ROJOS en esa cuenta</dt><dd></dd>`;
  b.querySelector("dd").textContent = saldo ? String(saldo.rojos ?? 0) : "—";
  nodo.append(a, b);
  if (url) {
    const link = document.createElement("a");
    link.href = url;
    link.target = "_blank";
    link.rel = "noreferrer";
    link.textContent = "Ver cuenta en stellar.expert";
    nodo.append(link);
  }
}

function pintar(estado) {
  $("#tienda").textContent = estado.tienda;
  $("#evento").textContent = estado.evento;
  $("#proveedor").textContent = estado.proveedor;
  $("#rojos").textContent = String(estado.rojosCobrados);
  $("#topes").textContent = `Tope por pedido ${estado.topes.pedido} · día ${estado.topes.dia} · reembolso ${estado.topes.reembolso}. Gastado hoy ${dinero(estado.gastadoHoy)}.`;
  $("#link-rojos").href = estado.activos.rojos.url;
  $("#link-usdc").href = estado.activos.usdc.url;
  pintarSaldos($("#saldo-agente"), "Saldo del agente", estado.saldos.agente, estado.cuentas.agenteUrl);
  pintarSaldos($("#saldo-proveedor"), "Saldo del proveedor", estado.saldos.proveedor, estado.cuentas.proveedorUrl);

  const aviso = $("#aviso");
  if (!estado.listo) {
    aviso.hidden = false;
    aviso.textContent = "Todavía no hay billeteras. En la carpeta del proyecto corre npm run preparar, reinicia npm start y vuelve a esta pantalla. Sin llaves el agente no firma.";
  } else {
    aviso.hidden = true;
  }

  const productos = $("#productos");
  productos.replaceChildren();
  for (const p of estado.productos) {
    const card = document.createElement("article");
    card.className = "producto";
    const h = document.createElement("h3");
    h.textContent = p.nombre;
    const meta = document.createElement("p");
    meta.className = "meta";
    const izq = document.createElement("span");
    izq.textContent = `${p.stock} en barra · mínimo ${p.minimo}`;
    const der = document.createElement("span");
    der.textContent = `₡${p.precioLista} · ${p.rojosPorUnidad} ROJOS`;
    meta.append(izq, der);
    const barra = document.createElement("div");
    barra.className = p.stock <= p.minimo ? "barra bajo" : "barra";
    const span = document.createElement("span");
    span.style.width = `${Math.min(100, (p.stock / (p.minimo * 2)) * 100)}%`;
    barra.append(span);
    const vender = boton(`Salieron ${p.sku === "papas" ? 4 : 8}`, "", { accion: "vender", sku: p.sku, unidades: p.sku === "papas" ? "4" : "8" });
    card.append(h, meta, barra, vender);
    productos.append(card);
  }

  const pedidos = $("#pedidos");
  pedidos.replaceChildren();
  if (!estado.pedidos.length) {
    const vacio = document.createElement("p");
    vacio.className = "vacio";
    vacio.textContent = "Cuando el agente pague, el pedido aparece aquí con el link a Stellar Expert.";
    pedidos.append(vacio);
  }
  for (const p of estado.pedidos) {
    const card = document.createElement("article");
    card.className = "pedido";
    const h = document.createElement("h3");
    h.textContent = `${p.unidades} ${p.nombre}`;
    const meta = document.createElement("p");
    meta.className = "meta";
    meta.textContent = `${p.estado} · ${dinero(p.usdc)}`;
    card.append(h, meta);
    const links = document.createElement("div");
    links.className = "links";
    if (p.experto) links.append(enlace(p.experto, p.verificado ? "Pago verificado en Expert" : "Hash sin verificar"));
    if (p.reembolsoExperto) links.append(enlace(p.reembolsoExperto, "Reembolso en Expert"));
    if (links.childNodes.length) card.append(links);
    const acciones = document.createElement("div");
    acciones.className = "acciones";
    if (p.verificado && p.estado === "pagado" && p.unidadesReembolsadas < p.unidades) acciones.append(boton("Alistar", "", { accion: "alistar", id: p.id }));
    if (p.estado === "alistando") acciones.append(boton("Confirmar entrega", "", { accion: "entregar", id: p.id }));
    if (p.verificado && !p.reembolsoHash) {
      acciones.append(boton("Reembolsar 4", "ghost", { accion: "reembolso", id: p.id, unidades: "4" }));
      acciones.append(boton("Reembolsar todo el pedido", "peligro", { accion: "reembolso", id: p.id, unidades: String(p.unidades) }));
    }
    card.append(acciones);
    pedidos.append(card);
  }

  const log = $("#bitacora");
  log.replaceChildren();
  if (!estado.bitacora.length) {
    const li = document.createElement("li");
    li.textContent = "Todavía no pasa nada. Empieza vendiendo Imperial en Party Pay.";
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

  const pasos = [...document.querySelectorAll("#pasos li")];
  const hechos = [
    estado.ventas > 0,
    estado.pedidos.some((p) => p.verificado),
    estado.bitacora.some((b) => b.tipo === "tope" || b.tipo === "saldo" || b.tipo === "repetido" || b.tipo === "invalido"),
    estado.pedidos.some((p) => p.estado === "alistando" || p.estado === "entregado" || p.estado === "reembolsado"),
    estado.pedidos.some((p) => p.reembolsoHash),
  ];
  pasos.forEach((li, i) => li.classList.toggle("hecho", Boolean(hechos[i])));
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
    if (btn.id === "revisar") await post("/api/agente/revisar");
    else if (btn.id === "forzar") await post("/api/agente/forzar", { sku: "imperial", unidades: 40 });
    else if (btn.id === "sin-saldo") await post("/api/agente/sin-saldo", { sku: "imperial", unidades: 12 });
    else if (btn.id === "repetir") await post("/api/agente/repetir");
    else if (btn.id === "juzgar") await post("/api/pagos/juzgar", { monto: "9.99" });
    else if (btn.id === "reiniciar") await post("/api/demo/reiniciar");
    else if (btn.dataset.accion === "vender") await post("/api/ventas", { sku: btn.dataset.sku, unidades: Number(btn.dataset.unidades) });
    else if (btn.dataset.accion === "alistar") await post(`/api/pedidos/${btn.dataset.id}/alistar`);
    else if (btn.dataset.accion === "entregar") await post(`/api/pedidos/${btn.dataset.id}/entregar`);
    else if (btn.dataset.accion === "reembolso") await post(`/api/pedidos/${btn.dataset.id}/reembolsar`, { unidades: Number(btn.dataset.unidades) });
  } finally {
    ocupado(btn, false);
    await refrescar();
  }
});

refrescar();
