const deck = document.querySelector("#deck");
const puntos = document.querySelector("#puntos");
const contador = document.querySelector("#contador");

function el(tag, clase, texto) {
  const n = document.createElement(tag);
  if (clase) n.className = clase;
  if (texto) n.textContent = texto;
  return n;
}

function lista(items) {
  const ul = el("ul", "lista");
  items.forEach((item, i) => {
    const li = document.createElement("li");
    li.append(el("span", "", String(i + 1).padStart(2, "0")), document.createTextNode(item));
    ul.append(li);
  });
  return ul;
}

function escena(svg) {
  const marco = el("div", "escena");
  marco.setAttribute("aria-hidden", "true");
  marco.innerHTML = svg;
  return marco;
}

function conEscena(nodos, svg) {
  const s = el("section", "slide con-escena");
  const texto = el("div", "texto");
  texto.append(...nodos);
  s.append(texto, escena(svg));
  return s;
}

const camion = `
  <g class="camion">
    <rect x="248" y="214" width="78" height="52" rx="6" fill="#ffb703"/>
    <text x="262" y="245" font-size="14" font-weight="700" fill="#1a120e">50 u.</text>
    <rect x="326" y="232" width="58" height="34" rx="5" fill="#f6efe2"/>
    <circle class="rueda" cx="276" cy="274" r="13" fill="#1a120e"/>
    <circle class="rueda" cx="352" cy="274" r="13" fill="#1a120e"/>
    <circle cx="276" cy="274" r="5" fill="#f6efe2"/>
    <circle cx="352" cy="274" r="5" fill="#f6efe2"/>
  </g>`;

const telefono = `
  <g>
    <rect x="28" y="36" width="168" height="300" rx="26" fill="#fff8f2"/>
    <rect x="78" y="48" width="68" height="7" rx="3" fill="#eadfd4"/>
    <text x="44" y="80" font-size="13" font-weight="700" fill="#e23d2b">PARTY PAY</text>
    <text x="44" y="100" font-size="12" fill="#6d584c">Bar La Ruta</text>
  </g>`;

function portada() {
  return conEscena([
    el("p", "kicker", "Lo que vimos en clase"),
    el("h1", "", "Un agente puede pagar. Solo hasta un límite."),
    el("p", "bajada", "En clase vimos pagos agénticos con un tope. El agente paga solo. Si el monto se pasa, no firma."),
  ], `
    <svg viewBox="0 0 420 360">
      ${telefono}
      <rect x="44" y="118" width="136" height="36" rx="8" fill="#f3e6d8"/>
      <text x="56" y="141" font-size="13" fill="#1a120e">Cerveza · USDC</text>
      <path d="M196 150 C 240 90, 280 90, 300 180" fill="none" stroke="#cbbba6" stroke-width="2" stroke-dasharray="5 6"/>
      <g class="moneda-viaja">
        <circle r="18" fill="#ffb703"/>
        <text y="5" text-anchor="middle" font-size="12" font-weight="700" fill="#1a120e">$</text>
      </g>
      ${camion}
    </svg>`);
}

function party() {
  return conEscena([
    el("p", "kicker", "El negocio que ya funciona"),
    el("h1", "", "Eso lo conectamos con Party Pay."),
    lista([
      "Party Pay ya opera en bares y en eventos masivos.",
      "El cliente pide desde el celular y paga en USDC.",
      "El sistema nuevo conecta ese negocio con sus proveedores.",
    ]),
    el("p", "nota", "La venta ya está resuelta. Lo que falta es el pedido al distribuidor, con el mismo pago y con un límite."),
  ], `
    <svg viewBox="0 0 420 420">
      <g transform="translate(110 20)">
        <rect width="200" height="380" rx="28" fill="#fff8f2"/>
        <text x="20" y="48" font-size="15" font-weight="700" fill="#e23d2b">PARTY PAY</text>
        <g class="pedido-pop">
          <rect x="16" y="70" width="168" height="48" rx="10" fill="#f6efe2"/>
          <text x="28" y="99" font-size="15" fill="#1a120e">4 cervezas</text>
        </g>
        <g class="pedido-pop d2">
          <rect x="16" y="128" width="168" height="48" rx="10" fill="#f6efe2"/>
          <text x="28" y="157" font-size="15" fill="#1a120e">Pagado en USDC</text>
        </g>
        <text x="20" y="214" font-size="13" fill="#6d584c">Quedan</text>
        <rect x="20" y="226" width="160" height="14" rx="7" fill="#eadfd4"/>
        <rect class="nivel" x="20" y="226" width="160" height="14" rx="7" fill="#e23d2b"/>
        <g class="moneda-quieta">
          <circle cx="100" cy="300" r="36" fill="#e23d2b"/>
          <text x="100" y="306" text-anchor="middle" font-size="14" font-weight="700" fill="#fff8f2">USDC</text>
        </g>
      </g>
    </svg>`);
}

function problema() {
  return conEscena([
    el("p", "kicker", "El hueco"),
    el("h1", "", "Se acaban las cervezas y alguien tiene que salir a buscarlas."),
    lista([
      "Hoy se llama, se fía y se paga después.",
      "El distribuidor no sabe cuánto llevar ni a qué hora.",
      "Sale sin haber cobrado. Si no sale, el bar se queda sin cerveza.",
    ]),
  ], `
    <svg viewBox="0 0 420 380">
      <rect x="36" y="70" width="200" height="12" rx="3" fill="#cbbba6"/>
      <rect x="52" y="28" width="22" height="42" rx="6" fill="#e23d2b"/>
      <rect class="botella-falta" x="90" y="28" width="22" height="42" rx="6" fill="none" stroke="#cbbba6" stroke-dasharray="4 3"/>
      <rect class="botella-falta" x="128" y="28" width="22" height="42" rx="6" fill="none" stroke="#cbbba6" stroke-dasharray="4 3"/>
      <rect class="botella-falta" x="166" y="28" width="22" height="42" rx="6" fill="none" stroke="#cbbba6" stroke-dasharray="4 3"/>
      <g transform="translate(40 150)">
        <rect width="70" height="120" rx="12" fill="#fff8f2"/>
        <circle cx="110" cy="36" r="16" fill="none" stroke="#ffb703" class="onda"/>
        <circle cx="110" cy="36" r="16" fill="none" stroke="#ffb703" class="onda tardia"/>
        <text x="12" y="70" font-size="12" fill="#1a120e">¿Hay</text>
        <text x="12" y="88" font-size="12" fill="#1a120e">más?</text>
      </g>
      <g transform="translate(200 210)">
        <rect width="86" height="48" rx="6" fill="#3a2c24"/>
        <rect x="86" y="16" width="54" height="32" rx="4" fill="#2a1d16"/>
        <circle cx="28" cy="56" r="12" fill="#1a120e"/>
        <circle cx="112" cy="56" r="12" fill="#1a120e"/>
        <text x="18" y="30" font-size="13" fill="#ffb4a8">sin pago</text>
      </g>
    </svg>`);
}

function solucion() {
  return conEscena([
    el("p", "kicker", "El sistema nuevo"),
    el("h1", "", "Primero le preguntamos al negocio sus límites."),
    lista([
      "De producto: ¿desde cuántas unidades hay que hacer el próximo pedido?",
      "De dinero: ¿cuánto USDC puede salir, sin pasarse?",
      "Si el pedido se pasa de producto o de plata, no se paga.",
    ]),
    el("p", "nota", "Ese pedido puede ser del día, de la semana, de la quincena o del mes. Depende del producto."),
  ], `
    <svg viewBox="0 0 420 420">
      <g class="foco">
        <rect class="panel-luz" x="24" y="36" width="372" height="150" rx="16" fill="#221812"/>
        <text x="44" y="84" font-size="16" fill="#ffb703">Límite de producto</text>
        <text x="44" y="126" font-size="26" fill="#f6efe2">A las 24, pedir 50</text>
        <text x="44" y="158" font-size="16" fill="#cbbba6">cervezas del bar</text>
      </g>
      <g class="foco">
        <rect class="panel-luz" x="24" y="214" width="372" height="150" rx="16" fill="#221812"/>
        <text x="44" y="262" font-size="16" fill="#ffb703">Límite de dinero</text>
        <text x="44" y="304" font-size="26" fill="#f6efe2">0.50 USDC</text>
        <text x="44" y="336" font-size="16" fill="#cbbba6">y no un centavo más</text>
      </g>
    </svg>`);
}

function recorrido() {
  const s = el("section", "slide");
  s.append(el("p", "kicker", "En vivo"), el("h1", "", "Primero el celular. Después el distribuidor."));
  const grid = el("ol", "pasos lista");
  const items = [
    "Se piden 4 cervezas. Quedan 24.",
    "La tienda pide 50 y paga 0.50 USDC.",
    "Un pedido de 80 se detiene.",
    "Se devuelven 4.",
    "Si no hay más producto, se devuelve el resto.",
  ];
  items.forEach((item, i) => {
    const li = document.createElement("li");
    li.append(el("span", "", String(i + 1).padStart(2, "0")), document.createTextNode(item));
    grid.append(li);
  });
  s.append(grid);
  return s;
}

function cierre() {
  const s = conEscena([
    el("p", "kicker", "Para cerrar"),
    el("h1", "", "Cobra antes de salir. Y sabe qué cargar."),
    el("p", "bajada", "Party Pay sigue vendiendo. Este sistema le resuelve al distribuidor el pedido, el pago y la ruta."),
  ], `
    <svg viewBox="0 0 420 320">
      <rect x="36" y="40" width="150" height="92" rx="16" fill="#24362f"/>
      <text x="52" y="78" font-size="16" fill="#8fd9cc">Cuenta</text>
      <text x="52" y="108" font-size="22" fill="#f6efe2">50 cervezas</text>
      <g class="check">
        <circle cx="214" cy="86" r="22" fill="#8fd9cc"/>
        <path d="M204 86 l8 8 14-16" fill="none" stroke="#14312c" stroke-width="3"/>
      </g>
      <g class="sale">
        <rect x="40" y="190" width="86" height="50" rx="6" fill="#ffb703"/>
        <text x="58" y="220" font-size="16" font-weight="700" fill="#1a120e">50</text>
        <rect x="126" y="206" width="58" height="34" rx="5" fill="#f6efe2"/>
        <circle class="rueda" cx="68" cy="248" r="13" fill="#1a120e"/>
        <circle class="rueda" cx="156" cy="248" r="13" fill="#1a120e"/>
      </g>
    </svg>`);
  s.classList.add("cierre");
  const a = el("a", "ir", "Abrir la demo");
  a.href = "/";
  s.querySelector(".texto").append(a);
  return s;
}

const slides = [portada(), party(), problema(), solucion(), recorrido(), cierre()];
slides.forEach((s) => deck.append(s));

let actual = 0;

function mostrar(n) {
  actual = Math.max(0, Math.min(slides.length - 1, n));
  slides.forEach((s, i) => s.classList.toggle("activa", i === actual));
  puntos.querySelectorAll("button").forEach((b, i) => b.classList.toggle("activo", i === actual));
  contador.textContent = `${actual + 1} / ${slides.length}`;
  history.replaceState(null, "", `#${actual + 1}`);
}

slides.forEach((_, i) => {
  const b = document.createElement("button");
  b.type = "button";
  b.addEventListener("click", () => mostrar(i));
  puntos.append(b);
});

document.querySelector("#atras").addEventListener("click", () => mostrar(actual - 1));
document.querySelector("#adelante").addEventListener("click", () => mostrar(actual + 1));
document.addEventListener("keydown", (event) => {
  if (event.key === "ArrowRight" || event.key === " " || event.key === "PageDown") {
    event.preventDefault();
    mostrar(actual + 1);
  } else if (event.key === "ArrowLeft" || event.key === "PageUp") {
    event.preventDefault();
    mostrar(actual - 1);
  } else if (event.key === "Home") mostrar(0);
  else if (event.key === "End") mostrar(slides.length - 1);
});

const desdeHash = Number(location.hash.replace("#", ""));
mostrar(Number.isInteger(desdeHash) && desdeHash > 0 ? desdeHash - 1 : 0);
