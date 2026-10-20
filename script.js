// CONFIGURACIÓN DEL CLIENTE
const config = {
  // País + área + número, solo números. Argentina: 549 + área + número
  whatsapp: "5491160468912",
  // Mensaje al consultar por WhatsApp (botones generales)
  whatsappMessage: "Hola Velora Perfumes, quiero consultar por el catálogo de perfumes.",
  // Cuántos perfumes se muestran por vez en el catálogo
  porPagina: 48
};

// ---------- Utilidades ----------
const $ = (id) => document.getElementById(id);
const waUrl = (text) => "https://wa.me/" + config.whatsapp + "?text=" + encodeURIComponent(text);
const norm = (s) => String(s).normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
const money = (n) => "$" + Number(n).toLocaleString("es-AR");
const GENERO = { hombre: "Hombre", mujer: "Mujer", unisex: "Unisex" };

document.querySelectorAll("[data-whatsapp]").forEach((link) => {
  link.href = waUrl(config.whatsappMessage);
});
$("year").textContent = new Date().getFullYear();

// ---------- Menú ----------
const menuToggle = $("menuToggle");
const mainNav = $("mainNav");
menuToggle.addEventListener("click", () => {
  const isOpen = mainNav.classList.toggle("open");
  menuToggle.setAttribute("aria-expanded", String(isOpen));
  menuToggle.setAttribute("aria-label", isOpen ? "Cerrar menú" : "Abrir menú");
});
mainNav.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", () => {
    mainNav.classList.remove("open");
    menuToggle.setAttribute("aria-expanded", "false");
  });
});

// ---------- Pedido (carrito) ----------
const CART_KEY = "velora_pedido_v1";
let cart = {}; // id -> cantidad
try { cart = JSON.parse(localStorage.getItem(CART_KEY)) || {}; } catch (e) { cart = {}; }

const byId = {};
PRODUCTOS.forEach((p) => { byId[p.id] = p; });
// limpiar ítems que ya no existen en el catálogo
Object.keys(cart).forEach((id) => { if (!byId[id] || !(cart[id] > 0)) delete cart[id]; });

function saveCart() { try { localStorage.setItem(CART_KEY, JSON.stringify(cart)); } catch (e) {} }
function cartUnits() { return Object.values(cart).reduce((a, b) => a + b, 0); }

let toastTimer;
function toast(msg) {
  const t = $("toast");
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove("show"), 1800);
}

function prodLabel(p) { return p.nombre + " (" + p.ml + " ml)"; }

function orderMessage() {
  const lines = Object.keys(cart).map((id) => {
    const p = byId[id];
    const price = p.precio ? " - " + money(p.precio) + " c/u" : "";
    return "• " + cart[id] + " x " + prodLabel(p) + price;
  });
  let msg = "Hola Velora Perfumes! Quiero hacer este pedido:\n\n" + lines.join("\n");
  msg += "\n\nQuedo a la espera de los precios, la disponibilidad y el costo de envío. ¡Gracias!";
  return msg;
}

function renderCart() {
  const ids = Object.keys(cart);
  $("cartCount").textContent = cartUnits();
  $("cartCount").classList.toggle("has-items", ids.length > 0);
  const box = $("cartItems");
  box.textContent = "";
  if (!ids.length) {
    const p = document.createElement("p");
    p.className = "cart-empty";
    p.textContent = "Todavía no agregaste perfumes. Explorá el catálogo y sumá tus favoritos.";
    box.appendChild(p);
  }
  ids.forEach((id) => {
    const p = byId[id];
    const row = document.createElement("div");
    row.className = "cart-row";
    const img = document.createElement("img");
    img.src = p.imagen; img.alt = ""; img.width = 56; img.height = 56;
    const info = document.createElement("div");
    info.className = "cart-info";
    const n = document.createElement("strong"); n.textContent = p.nombre;
    const m = document.createElement("span");
    m.textContent = p.ml + " ml · " + GENERO[p.genero] + (p.precio ? " · " + money(p.precio) : "");
    info.append(n, m);
    const qty = document.createElement("div");
    qty.className = "qty";
    const minus = document.createElement("button"); minus.type = "button"; minus.textContent = "−"; minus.setAttribute("aria-label", "Quitar uno");
    const num = document.createElement("span"); num.textContent = cart[id];
    const plus = document.createElement("button"); plus.type = "button"; plus.textContent = "+"; plus.setAttribute("aria-label", "Agregar uno");
    minus.addEventListener("click", () => changeQty(id, -1));
    plus.addEventListener("click", () => changeQty(id, 1));
    qty.append(minus, num, plus);
    row.append(img, info, qty);
    box.appendChild(row);
  });

  const send = $("sendOrder");
  const hasItems = ids.length > 0;
  send.classList.toggle("disabled", !hasItems);
  send.setAttribute("aria-disabled", String(!hasItems));
  send.href = hasItems ? waUrl(orderMessage()) : "#";
  $("clearCart").hidden = !hasItems;

  // total solo si TODOS los productos del pedido tienen precio cargado
  const allPriced = hasItems && ids.every((id) => byId[id].precio);
  const totalEl = $("cartTotal");
  totalEl.hidden = !allPriced;
  if (allPriced) {
    totalEl.textContent = "Total estimado: " + money(ids.reduce((s, id) => s + byId[id].precio * cart[id], 0));
  }
  $("cartNote").hidden = allPriced;
}

function changeQty(id, d) {
  const next = (cart[id] || 0) + d;
  if (next <= 0) delete cart[id]; else cart[id] = Math.min(next, 99);
  saveCart(); renderCart(); refreshCardButtons();
}
function addToCart(id) {
  cart[id] = Math.min((cart[id] || 0) + 1, 99);
  saveCart(); renderCart(); refreshCardButtons();
  toast("Agregado al pedido: " + byId[id].nombre);
}

$("sendOrder").addEventListener("click", (e) => { if (!cartUnits()) e.preventDefault(); });
$("clearCart").addEventListener("click", () => {
  cart = {}; saveCart(); renderCart(); refreshCardButtons();
});

function openCart() {
  $("cartOverlay").hidden = false;
  $("cartPanel").classList.add("open");
  $("cartPanel").setAttribute("aria-hidden", "false");
  document.body.classList.add("no-scroll");
}
function closeCart() {
  $("cartOverlay").hidden = true;
  $("cartPanel").classList.remove("open");
  $("cartPanel").setAttribute("aria-hidden", "true");
  document.body.classList.remove("no-scroll");
}
$("openCart").addEventListener("click", openCart);
$("closeCart").addEventListener("click", closeCart);
$("cartOverlay").addEventListener("click", closeCart);
document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeCart(); });

// ---------- Catálogo ----------
const grid = $("grilla");
const state = { q: "", genero: "", ml: "", marca: "", shown: config.porPagina };

// Marcas para el selector
Array.from(new Set(PRODUCTOS.map((p) => p.marca)))
  .sort((a, b) => (a === "Otras marcas") - (b === "Otras marcas") || a.localeCompare(b))
  .forEach((m) => {
    const o = document.createElement("option");
    o.value = m; o.textContent = m;
    $("marca").appendChild(o);
  });

function matchMl(p) {
  if (!state.ml) return true;
  if (state.ml === "30") return p.ml <= 40;
  if (state.ml === "50") return p.ml > 40 && p.ml <= 60;
  if (state.ml === "80") return p.ml > 60 && p.ml < 90;
  return p.ml >= 90;
}
function filtered() {
  const q = norm(state.q).trim();
  return PRODUCTOS.filter((p) => {
    if (state.genero && p.genero !== state.genero && p.genero !== "unisex") return false;
    if (state.marca && p.marca !== state.marca) return false;
    if (!matchMl(p)) return false;
    if (q && !norm(p.nombre + " " + p.marca).includes(q)) return false;
    return true;
  });
}

function cardButtonText(id) {
  return cart[id] ? "Agregado (" + cart[id] + ") · sumar otro" : "Agregar al pedido";
}
function refreshCardButtons() {
  grid.querySelectorAll("[data-add]").forEach((b) => {
    const id = b.dataset.add;
    b.textContent = cardButtonText(id);
    b.classList.toggle("in-cart", !!cart[id]);
  });
}

function makeCard(p) {
  const card = document.createElement("article");
  card.className = "product-card";
  const fig = document.createElement("div");
  fig.className = "product-img";
  const img = document.createElement("img");
  img.src = p.imagen; img.alt = p.nombre + " " + p.ml + " ml"; img.loading = "lazy"; img.decoding = "async";
  fig.appendChild(img);
  const tag = document.createElement("span");
  tag.className = "tag tag-" + p.genero; tag.textContent = GENERO[p.genero];
  fig.appendChild(tag);
  if (p.original) {
    const o = document.createElement("span");
    o.className = "tag tag-original"; o.textContent = "Original";
    fig.appendChild(o);
  }
  const body = document.createElement("div");
  body.className = "product-body";
  const brand = document.createElement("p");
  brand.className = "product-brand"; brand.textContent = p.marca === "Otras marcas" ? "Fragancia importada" : p.marca;
  const name = document.createElement("h3"); name.textContent = p.nombre;
  const meta = document.createElement("p");
  meta.className = "product-meta";
  meta.textContent = p.ml + " ml · " + (p.kit ? "Kit" : p.conc);
  const price = document.createElement("p");
  price.className = "product-price";
  price.textContent = p.precio ? money(p.precio) : "Consultar precio";
  const btn = document.createElement("button");
  btn.type = "button"; btn.className = "button button-primary button-full add-btn";
  if (p.disponible === false) {
    btn.textContent = "Sin stock"; btn.disabled = true;
  } else {
    btn.dataset.add = p.id;
    btn.textContent = cardButtonText(p.id);
    btn.classList.toggle("in-cart", !!cart[p.id]);
    btn.addEventListener("click", () => addToCart(p.id));
  }
  body.append(brand, name, meta, price, btn);
  card.append(fig, body);
  return card;
}

function renderGrid() {
  const list = filtered();
  grid.textContent = "";
  const frag = document.createDocumentFragment();
  list.slice(0, state.shown).forEach((p) => frag.appendChild(makeCard(p)));
  grid.appendChild(frag);
  $("vacio").hidden = list.length > 0;
  $("verMas").hidden = list.length <= state.shown;
  $("resultados").textContent = list.length
    ? "Mostrando " + Math.min(state.shown, list.length) + " de " + list.length + " perfumes"
    : "";
}
function resetAndRender() { state.shown = config.porPagina; renderGrid(); }

let searchTimer;
$("buscar").addEventListener("input", (e) => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => { state.q = e.target.value; resetAndRender(); }, 150);
});
$("marca").addEventListener("change", (e) => { state.marca = e.target.value; resetAndRender(); });
function bindChips(containerId, key, attr) {
  $(containerId).addEventListener("click", (e) => {
    const b = e.target.closest(".chip");
    if (!b) return;
    $(containerId).querySelectorAll(".chip").forEach((c) => c.classList.remove("active"));
    b.classList.add("active");
    state[key] = b.dataset[attr];
    resetAndRender();
  });
}
bindChips("chipsGenero", "genero", "genero");
bindChips("chipsMl", "ml", "ml");
$("verMas").addEventListener("click", () => { state.shown += config.porPagina; renderGrid(); });

renderCart();
renderGrid();
