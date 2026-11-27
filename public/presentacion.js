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
    <text x="262" y="245" font-size="14" font-weight="700" fill="#1a120e">12 u.</text>
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
    el("p", "kicker", "Demo day · Bar La Ruta"),
    el("h1", "", "La venta ya funciona. Ahora la tienda paga sola."),
    el("p", "bajada", "Party Pay es el celular del cliente. Este proyecto es el camión del distribuidor: cobra antes de salir y sabe qué cargar."),
  ], `
    <svg viewBox="0 0 420 360">
      ${telefono}
      <rect x="44" y="118" width="136" height="36" rx="8" fill="#f3e6d8"/>
      <text x="56" y="141" font-size="13" fill="#1a120e">Imperial · 2 ROJOS</text>
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
    el("p", "kicker", "Lo que ya existe"),
    el("h1", "", "Party Pay ya resuelve la noche."),
    lista([
      "El cliente pide la cerveza desde el celular.",
      "Paga en ROJOS, la moneda de la feria.",
      "El bar ve, en el momento, cuánto le queda.",
    ]),
    el("p", "nota", "Esta parte ya está en marcha. Ya pasó por un hackathon. Lo que sigue es el otro lado del mostrador."),
  ], `
    <svg viewBox="0 0 420 420">
      <g transform="translate(110 20)">
        <rect width="200" height="380" rx="28" fill="#fff8f2"/>
        <text x="20" y="48" font-size="15" font-weight="700" fill="#e23d2b">PARTY PAY</text>
        <g class="pedido-pop">
          <rect x="16" y="70" width="168" height="48" rx="10" fill="#f6efe2"/>
          <text x="28" y="99" font-size="15" fill="#1a120e">8 Imperial</text>
        </g>
        <g class="pedido-pop d2">
          <rect x="16" y="128" width="168" height="48" rx="10" fill="#f6efe2"/>
          <text x="28" y="157" font-size="15" fill="#1a120e">16 ROJOS</text>
        </g>
        <text x="20" y="214" font-size="13" fill="#6d584c">Quedan</text>
        <rect x="20" y="226" width="160" height="14" rx="7" fill="#eadfd4"/>
        <rect class="nivel" x="20" y="226" width="160" height="14" rx="7" fill="#e23d2b"/>
        <g class="moneda-quieta">
          <circle cx="100" cy="300" r="36" fill="#e23d2b"/>
          <text x="100" y="306" text-anchor="middle" font-size="14" font-weight="700" fill="#fff8f2">ROJOS</text>
        </g>
      </g>
    </svg>`);
}

function problema() {
  return conEscena([
    el("p", "kicker", "El hueco"),
    el("h1", "", "Se acaba la Imperial y alguien tiene que salir a buscarla."),
    lista([
      "Hoy se llama, se fía y se paga después.",
      "El distribuidor no sabe cuánto llevar ni a qué hora.",
      "Sale sin el dinero, o no sale y el bar pierde la venta.",
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
    el("p", "kicker", "La continuación"),
    el("h1", "", "Cuando falta producto, la tienda paga sola."),
    lista([
      "Pago automático. Nadie arma el pedido a mano.",
      "Cuánto y cuándo. El distribuidor ve las unidades que salen.",
      "Dinero por adelantado. Cobra antes de cargar el camión.",
    ]),
  ], `
    <svg viewBox="0 0 420 420">
      <g class="foco">
        <rect class="panel-luz" x="24" y="24" width="372" height="100" rx="16" fill="#221812"/>
        <text x="44" y="64" font-size="15" fill="#ffb703">1 · Paga sola</text>
        <text x="44" y="96" font-size="22" fill="#f6efe2">0.12 USDC, sin llamar</text>
      </g>
      <g class="foco">
        <rect class="panel-luz" x="24" y="144" width="372" height="100" rx="16" fill="#221812"/>
        <text x="44" y="184" font-size="15" fill="#ffb703">2 · Cuánto y cuándo</text>
        <text x="44" y="216" font-size="22" fill="#f6efe2">Llevar 12. Salir ya.</text>
      </g>
      <g class="foco">
        <rect class="panel-luz" x="24" y="264" width="372" height="100" rx="16" fill="#221812"/>
        <text x="44" y="304" font-size="15" fill="#ffb703">3 · Dinero primero</text>
        <text x="44" y="336" font-size="22" fill="#f6efe2">Cobra y después carga</text>
      </g>
    </svg>`);
}

function monedas() {
  const s = el("section", "slide");
  s.append(el("p", "kicker", "Dos monedas, dos trabajos"), el("h1", "", "No se mezclan."));
  const grid = el("div", "dos");
  const izq = el("article", "lado party");
  izq.append(
    el("p", "kicker", "En la feria"),
    el("h2", "", "ROJOS"),
    el("p", "", "El cliente le paga al bar. Ese dinero se queda en Party Pay. No sale hacia el distribuidor."),
    escena(`<svg viewBox="0 0 220 120"><g class="moneda-quieta"><circle cx="110" cy="58" r="36" fill="#e23d2b"/><text x="110" y="64" text-anchor="middle" font-size="14" font-weight="700" fill="#fff8f2">ROJOS</text></g></svg>`),
  );
  const der = el("article", "lado usdc");
  der.append(
    el("p", "kicker", "Con el distribuidor"),
    el("h2", "", "USDC"),
    el("p", "", "La tienda liquida el pedido en Stellar. El distribuidor lo ve en su cuenta antes de empacar."),
    escena(`<svg viewBox="0 0 220 120"><g class="moneda-entra"><circle cx="110" cy="58" r="36" fill="#ffb703"/><text x="110" y="64" text-anchor="middle" font-size="16" font-weight="700" fill="#1a120e">USDC</text></g></svg>`),
  );
  grid.append(izq, der);
  s.append(grid);
  return s;
}

function regla() {
  const s = el("section", "slide con-escena");
  const texto = el("div", "texto");
  texto.append(
    el("p", "kicker", "El control"),
    el("h1", "", "Paga lo que falta. Nunca más que el presupuesto."),
    el("p", "bajada", "Mira el inventario, calcula dos noches y recorta. Si el precio no cuadra, si el pedido ya se pagó o si no hay saldo, no firma."),
  );
  const nums = el("div", "numeros");
  for (const [valor, etiqueta] of [
    ["0.12", "Máximo por pedido"],
    ["0.30", "Máximo del día"],
    ["0.08", "Máximo a devolver"],
  ]) {
    const d = document.createElement("div");
    d.append(el("strong", "", valor), el("span", "", `${etiqueta} · USDC de prueba`));
    nums.append(d);
  }
  texto.append(nums);
  texto.append(el("p", "nota", "En la demo cada Imperial se liquida a 0.01 USDC para que quepa en una billetera de prueba. En el bar esa cerveza vale ₡700."));
  s.append(texto, escena(`
    <svg viewBox="0 0 420 320">
      <text x="24" y="48" font-size="16" fill="#cbbba6">Pedido que se quiere</text>
      <rect x="24" y="68" width="340" height="36" rx="18" fill="#3a2c24"/>
      <rect class="lleno" x="24" y="68" width="340" height="36" rx="18" fill="#ffb703"/>
      <line x1="187" y1="40" x2="187" y2="104" stroke="#f6efe2" stroke-width="3"/>
      <text x="196" y="36" font-size="14" fill="#f6efe2">tope</text>
      <text x="24" y="180" font-size="28" fill="#f6efe2">Se estira… y vuelve al límite.</text>
      <text x="24" y="230" font-size="18" fill="#cbbba6">Lo que se pasa no se firma.</text>
    </svg>`));
  return s;
}

function recorrido() {
  const s = el("section", "slide");
  s.append(el("p", "kicker", "En vivo, seis clics"), el("h1", "", "Primero el celular. Después el distribuidor."));
  const grid = el("ol", "pasos lista");
  const items = [
    "En Party Pay se piden 8 Imperial. El stock baja de 28 a 20.",
    "La tienda paga 12, no 16. 0.12 USDC es el tope.",
    "Un pedido de 40 se detiene. No sale dinero.",
    "Devolver todo también se detiene. Devolver 4 sí.",
    "El distribuidor empaca solo lo que va a llevar.",
    "Al bar entran 8. Las 4 devueltas no vuelven al inventario.",
  ];
  items.forEach((item, i) => {
    const li = document.createElement("li");
    li.className = "paso-vivo";
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
      <text x="52" y="108" font-size="22" fill="#f6efe2">0.12 USDC</text>
      <g class="check">
        <circle cx="214" cy="86" r="22" fill="#8fd9cc"/>
        <path d="M204 86 l8 8 14-16" fill="none" stroke="#14312c" stroke-width="3"/>
      </g>
      <g class="sale">
        <rect x="40" y="190" width="86" height="50" rx="6" fill="#ffb703"/>
        <text x="58" y="220" font-size="16" font-weight="700" fill="#1a120e">8 u.</text>
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

const slides = [portada(), party(), problema(), solucion(), monedas(), regla(), recorrido(), cierre()];
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
