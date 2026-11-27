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
  pagado: "Pagado",
  alistando: "Empacando",
  entregado: "Entregado",
  observado: "No cuadra",
  reembolsado: "Devuelto",
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
  const total = 5;
  if (!estado.listo) {
    return { n: 1, total, panel: null, titulo: "Faltan las billeteras", boton: null };
  }
  if (!abierto && !empacando && imperial.stock > imperial.minimo) {
    const bajar = imperial.stock - imperial.minimo;
    return {
      n: 1, total, panel: "party", paso: "vender", sku: "imperial", unidades: String(bajar),
      titulo: `Quedan ${imperial.stock}. A las 24 se pide.`,
      boton: `Pedir ${bajar} cervezas`,
    };
  }
  if (!abierto && !empacando) {
    return {
      n: 2, total, panel: "sistema", paso: "revisar",
      titulo: `Quedan ${imperial.stock}. Pedir 50.`,
      boton: "Pagar 50 cervezas",
    };
  }
  if (abierto && !despuesDe(estado, abierto, "tope", "0.80")) {
    return {
      n: 3, total, panel: "sistema", paso: "forzar",
      titulo: "80 no caben en el límite.",
      boton: "Pedir 80",
    };
  }
  const devueltas = abierto ? (abierto.unidadesReembolsadas || 0) : 0;
  const quedan = abierto ? abierto.unidades - devueltas : 0;
  if (abierto && devueltas === 0) {
    return {
      n: 4, total, panel: "sistema", paso: "reembolso", id: abierto.id, unidades: "4",
      titulo: "Devolver 4.",
      boton: "Devolver 4",
    };
  }
  if (abierto && quedan > 0) {
    return {
      n: 5, total, panel: "sistema", paso: "reembolso", id: abierto.id, unidades: String(quedan),
      titulo: "Si no hay más, devolver el resto.",
      boton: "Devolver todo",
    };
  }
  if (abierto) {
    return {
      n: 4, total, panel: "sistema", paso: "alistar", id: abierto.id,
      titulo: "Empacar lo que sí va.",
      boton: "Empacar",
    };
  }
  if (empacando) {
    return {
      n: 5, total, panel: "sistema", paso: "entregar", id: empacando.id,
      titulo: "Ya llegó al bar.",
      boton: "Entregar",
    };
  }
  return {
    n: 5, total, panel: "sistema", paso: "reiniciar",
    titulo: "Listo.",
    boton: "Otra noche",
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
  const nombre = pedido ? pedido.nombre.replace(/ 350 ml/, "") : "";
  let pago = "Nada que pagar";
  if (bajo && !activo) pago = `Hasta ${estado.topes.pedido}`;
  if (activo) pago = dinero(activo.usdc);
  let ruta = "Sin ruta";
  let dineroAntes = "Cobra antes de salir";
  if (pedido) {
    const llevan = pedido.unidades - (pedido.unidadesReembolsadas || 0);
    if (pedido.estado === "pagado") ruta = `Llevar ${llevan} ${nombre}`;
    else if (pedido.estado === "alistando") ruta = `En camino: ${llevan}`;
    else if (pedido.estado === "entregado") ruta = `Entregadas ${llevan}`;
    else if (pedido.estado === "reembolsado") ruta = "No sale";
    else ruta = "No cuadra";
    if (pedido.verificado && pedido.estado !== "entregado" && pedido.estado !== "reembolsado") {
      dineroAntes = dinero(pedido.usdc);
    } else if (pedido.estado === "entregado") {
      dineroAntes = `Cobró ${dinero(pedido.usdc)}`;
    }
  }
  return [
    ["Pago", pago],
    ["Cuánto", ruta],
    ["Cobro", dineroAntes],
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
  guia.append(puntos, paso, titulo);
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
  $("#rojos").textContent = String(estado.ventas);
  pintarGuia(estado);

  const aviso = $("#aviso");
  aviso.hidden = estado.listo;
  if (!estado.listo) aviso.textContent = "Faltan las billeteras. Corre npm run preparar.";

  const resultado = $("#resultado");
  resultado.hidden = !ultimo;
  resultado.textContent = ultimo || "";

  const agente = $("#saldo-agente");
  agente.replaceChildren(caja("Tienda", estado.saldos.agente ? dinero(estado.saldos.agente.usdc) : "—"));
  if (estado.cuentas.agenteUrl) agente.append(enlace(estado.cuentas.agenteUrl, "Billetera"));

  const proveedorSaldo = $("#saldo-proveedor");
  proveedorSaldo.replaceChildren(caja("Distribuidor", estado.saldos.proveedor ? dinero(estado.saldos.proveedor.usdc) : "—"));
  if (estado.cuentas.proveedorUrl) proveedorSaldo.append(enlace(estado.cuentas.proveedorUrl, "Billetera"));

  const limites = $("#limites");
  limites.replaceChildren(
    caja("Por pedido", estado.topes.pedido),
    caja("Día", estado.topes.dia),
    caja("Hoy", dinero(estado.gastadoHoy)),
    caja("Devolución", estado.topes.reembolso),
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
    h.textContent = p.nombre.replace(/ 350 ml/, "");
    const meta = document.createElement("p");
    meta.className = "meta";
    const izq = document.createElement("span");
    izq.textContent = `${p.stock} / ${p.minimo}`;
    const der = document.createElement("span");
    der.textContent = p.stock <= p.minimo ? "Pedir" : "Alcanza";
    meta.append(izq, der);
    const barra = document.createElement("div");
    barra.className = p.stock <= p.minimo ? "barra bajo" : "barra";
    const span = document.createElement("span");
    span.style.width = `${Math.min(100, (p.stock / (p.minimo * 2)) * 100)}%`;
    barra.append(span);
    card.append(h, meta, barra);
    productos.append(card);
  }

  const ventas = $("#ventas-phone");
  ventas.replaceChildren();

  const pedidos = $("#pedidos");
  pedidos.replaceChildren();
  if (!estado.pedidos.length) {
    const vacio = document.createElement("p");
    vacio.className = "vacio";
    vacio.textContent = "Sin pedido.";
    pedidos.append(vacio);
  }
  for (const p of estado.pedidos) {
    const card = document.createElement("article");
    card.className = "pedido";
    const h = document.createElement("h3");
    h.textContent = `${p.unidades} ${p.nombre.replace(/ 350 ml/, "")}`;
    const pill = document.createElement("p");
    pill.className = "estado-pill";
    pill.textContent = ESTADOS[p.estado] || p.estado;
    const meta = document.createElement("p");
    meta.className = "ayuda";
    meta.textContent = p.unidadesReembolsadas
      ? `${dinero(p.usdc)} · llegan ${p.unidades - p.unidadesReembolsadas}`
      : dinero(p.usdc);
    card.append(h, pill, meta);
    const links = document.createElement("div");
    links.className = "links";
    if (p.experto) links.append(enlace(p.experto, "Pago"));
    if (p.reembolsoExperto) links.append(enlace(p.reembolsoExperto, "Devolución"));
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
    li.textContent = "Nada todavía.";
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

  $("#resumen").textContent = "";
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
    else if (paso === "forzar") data = await post("/api/agente/forzar", { sku: "imperial", unidades: 80 });
    else if (paso === "sin-saldo") data = await post("/api/agente/sin-saldo", { sku: "imperial", unidades: 12 });
    else if (paso === "repetir") data = await post("/api/agente/repetir");
    else if (paso === "juzgar") data = await post("/api/pagos/juzgar", { monto: "9.99" });
    else if (paso === "reiniciar") data = await post("/api/demo/reiniciar");
    else if (paso === "vender" || btn.dataset.accion === "vender") {
      data = await post("/api/ventas", { sku: btn.dataset.sku, unidades: Number(btn.dataset.unidades) });
      }
    else if (paso === "alistar" || btn.dataset.accion === "alistar") {
      data = await post(`/api/pedidos/${btn.dataset.id}/alistar`);
    } else if (paso === "entregar" || btn.dataset.accion === "entregar") {
      data = await post(`/api/pedidos/${btn.dataset.id}/entregar`);
    }
    else if (paso === "reembolso" || btn.dataset.accion === "reembolso") data = await post(`/api/pedidos/${btn.dataset.id}/reembolsar`, { unidades: Number(btn.dataset.unidades) });
    ultimo = data.ok === false ? "Se detuvo." : "";
  } finally {
    ocupado(btn, false);
    await refrescar();
  }
});

refrescar();
