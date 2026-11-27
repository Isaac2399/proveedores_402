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

function portada() {
  const s = el("section", "slide");
  s.append(
    el("p", "kicker", "Demo day · Bar La Ruta"),
    el("h1", "", "La venta ya funciona. Ahora la tienda paga sola."),
    el("p", "bajada", "Party Pay es el celular del cliente. Este proyecto es el camión del distribuidor: cobra antes de salir y sabe qué cargar."),
  );
  return s;
}

function party() {
  const s = el("section", "slide");
  s.append(
    el("p", "kicker", "Lo que ya existe"),
    el("h1", "", "Party Pay ya resuelve la noche."),
    lista([
      "El cliente pide la cerveza desde el celular.",
      "Paga en ROJOS, la moneda de la feria.",
      "El bar ve, en el momento, cuánto le queda.",
    ]),
    el("p", "nota", "Esta parte ya está en marcha. Ya pasó por un hackathon. Lo que sigue es el otro lado del mostrador."),
  );
  return s;
}

function problema() {
  const s = el("section", "slide");
  s.append(
    el("p", "kicker", "El hueco"),
    el("h1", "", "Se acaba la Imperial y alguien tiene que salir a buscarla."),
    lista([
      "Hoy se llama, se fía y se paga después.",
      "El distribuidor no sabe cuánto llevar ni a qué hora.",
      "Sale sin el dinero, o no sale y el bar pierde la venta.",
    ]),
  );
  return s;
}

function solucion() {
  const s = el("section", "slide");
  s.append(
    el("p", "kicker", "La continuación"),
    el("h1", "", "Cuando falta producto, la tienda paga sola."),
    lista([
      "Pago automático. Nadie arma el pedido a mano.",
      "Cuánto y cuándo. El distribuidor ve las unidades que salen.",
      "Dinero por adelantado. Cobra antes de cargar el camión.",
    ]),
  );
  return s;
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
  );
  const der = el("article", "lado usdc");
  der.append(
    el("p", "kicker", "Con el distribuidor"),
    el("h2", "", "USDC"),
    el("p", "", "La tienda liquida el pedido en Stellar. El distribuidor lo ve en su cuenta antes de empacar."),
  );
  grid.append(izq, der);
  s.append(grid);
  return s;
}

function regla() {
  const s = el("section", "slide");
  s.append(
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
  s.append(nums);
  s.append(el("p", "nota", "En la demo cada Imperial se liquida a 0.01 USDC para que quepa en una billetera de prueba. En el bar esa cerveza vale ₡700."));
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
    li.append(el("span", "", String(i + 1).padStart(2, "0")), document.createTextNode(item));
    grid.append(li);
  });
  s.append(grid);
  return s;
}

function cierre() {
  const s = el("section", "slide cierre");
  s.append(
    el("p", "kicker", "Para cerrar"),
    el("h1", "", "Cobra antes de salir. Y sabe qué cargar."),
    el("p", "bajada", "Party Pay sigue vendiendo. Este sistema le resuelve al distribuidor el pedido, el pago y la ruta."),
  );
  const a = el("a", "ir", "Abrir la demo");
  a.href = "/";
  s.append(a);
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
