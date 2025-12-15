const SQRT3 = Math.sqrt(3);

// drawing help funcs
function axialToPixel(q, r, size) {
  const x = size * SQRT3 * (q + r / 2);
  const y = size * 1.5 * r;
  return { x, y };
}

function hexPoints(cx, cy, size) {
  const pts = [];
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 180) * (60 * i - 30);
    const x = cx + size * Math.cos(angle);
    const y = cy + size * Math.sin(angle);
    pts.push(`${x.toFixed(2)},${y.toFixed(2)}`);
  }
  return pts.join(" ");
}

const MAX_RING = 32;
const MIN_SHOW_RING = 4;
const START_RING = 16;

const PIN_RINGS = new Set([2, 4, 8, 16, 32]);
const ORIGIN_COLOR = "#ffeab8";
const PIN_COLOR = "#f2f4fb";
const BASE_COLOR = "#ffffff";

let showRing = START_RING;

let shapeEnabled = false;
let shapeType = "circle";

let selected = new Map();
let circles = [];
let triangles = [];
let triPending = [];

let svg = null;
let msg = null;

function coordKey(q, r, s) { return `${q},${r},${s}`; }
function parseKey(k) {
  const [q, r, s] = k.split(",").map((x) => parseInt(x, 10));
  return { q, r, s };
}

// limit canvas
function clampShowRing(v) {
  const x = Math.max(MIN_SHOW_RING, Math.min(MAX_RING, v));
  const pins = [2, 4, 8, 16, 32];
  let best = pins[0];
  let bestD = Math.abs(x - best);
  for (const p of pins) {
    const d = Math.abs(x - p);
    if (d < bestD) { bestD = d; best = p; }
  }
  return best;
}

// calculate modified size
function computeSizeForShowRing(svgEl, R) {
  const maxByW = (svgEl.viewBox.baseVal.width * 0.46) / (SQRT3 * (R + 0.5));
  const maxByH = (svgEl.viewBox.baseVal.height * 0.46) / (1.5 * (R + 0.5));
  return Math.max(1, Math.min(maxByW, maxByH));
}

// draw hexes
function buildHexes(RADIUS) {
  const hexes = [];
  for (let q = -RADIUS; q <= RADIUS; q++) {
    for (let r = -RADIUS; r <= RADIUS; r++) {
      const s = -q - r;
      if (Math.max(Math.abs(q), Math.abs(r), Math.abs(s)) <= RADIUS) {
        hexes.push({ q, r, s });
      }
    }
  }
  hexes.sort((a, b) => (a.r - b.r) || (a.q - b.q));
  return hexes;
}

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function randomHighlightColor() {
  const h = randInt(0, 359);
  const s = randInt(70, 95);
  const l = randInt(55, 70);
  return `hsl(${h} ${s}% ${l}%)`;
}

// add effect for on-click
function applyHighlight(poly, color) {
  poly.classList.add("isSelected");
  poly.style.stroke = color;
  poly.style.fill = color;
  poly.style.filter = `drop-shadow(0 0 10px ${color})`;
}

function resetPoly(poly) {
  poly.classList.remove("isSelected");
  poly.style.stroke = "";
  poly.style.filter = "";
  poly.style.fill = poly.dataset.baseFill || "";
}

// clear canvas without clearing db
function clearCanvasOnly(svgEl) {
  selected.clear();
  circles = [];
  triangles = [];
  triPending = [];
  svgEl.querySelectorAll(".hex").forEach(resetPoly);
  svgEl.querySelectorAll(".triLine").forEach((n) => n.remove());
}

// draw connecting lines for triangles
function drawTriangle(svgEl, a, b, c) {
  const overlay = svgEl.querySelector("#overlay") || svgEl;
  const path = document.createElementNS("http://www.w3.org/2000/svg", "polyline");
  path.setAttribute("class", "triLine");
  path.setAttribute("points", `${a.x},${a.y} ${b.x},${b.y} ${c.x},${c.y} ${a.x},${a.y}`);
  overlay.appendChild(path);
}

// draw canvas
function render(svgEl) {
  while (svgEl.firstChild) svgEl.removeChild(svgEl.firstChild);

  const SIZE = computeSizeForShowRing(svgEl, showRing);
  const hexes = buildHexes(showRing);
  const originPx = { x: 490, y: 345 };

  const gHex = document.createElementNS("http://www.w3.org/2000/svg", "g");
  svgEl.appendChild(gHex);

  const gOverlay = document.createElementNS("http://www.w3.org/2000/svg", "g");
  gOverlay.setAttribute("id", "overlay");
  svgEl.appendChild(gOverlay);

  const showText = (showRing <= 8);
  const polyByKey = new Map();

  hexes.forEach(({ q, r, s }) => {
    const p = axialToPixel(q, r, SIZE);
    const cx = originPx.x + p.x;
    const cy = originPx.y + p.y;

    const ring = Math.max(Math.abs(q), Math.abs(r), Math.abs(s));

    const poly = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
    poly.setAttribute("points", hexPoints(cx, cy, SIZE));
    poly.setAttribute("class", "hex");

    const isOrigin = (q === 0 && r === 0 && s === 0);
    const isPinned = PIN_RINGS.has(ring);

    const baseFill = isOrigin ? ORIGIN_COLOR : (isPinned ? PIN_COLOR : BASE_COLOR);
    poly.setAttribute("fill", baseFill);
    poly.dataset.baseFill = baseFill;
    poly.setAttribute("opacity", isOrigin ? "0.98" : (isPinned ? "0.96" : "0.94"));

    poly.dataset.q = q;
    poly.dataset.r = r;
    poly.dataset.s = s;

    gHex.appendChild(poly);

    const k = coordKey(q, r, s);
    polyByKey.set(k, { poly, cx, cy });
    
    // show coordinates and ring number
    if (showText) {
      if (q === 0 && r === 0) {
        const t = document.createElementNS("http://www.w3.org/2000/svg", "text");
        t.setAttribute("x", cx);
        t.setAttribute("y", cy + 6);
        t.setAttribute("text-anchor", "middle");
        t.setAttribute("class", "centerLabel");
        t.textContent = "q r s";
        gHex.appendChild(t);
      } else {
        const t = document.createElementNS("http://www.w3.org/2000/svg", "text");
        t.setAttribute("x", cx);
        t.setAttribute("y", cy + 4);
        t.setAttribute("text-anchor", "middle");
        t.setAttribute("class", "label");
        t.textContent = `${q},${r},${s}`;
        gHex.appendChild(t);
      }
    }
  });

  // draw shapes when creating shape is asserted
  circles.forEach((c) => {
    const center = parseKey(c.centerKey);
    for (const [k, info] of polyByKey.entries()) {
      const p = parseKey(k);
      const d = Math.max(Math.abs(center.q - p.q), Math.abs(center.r - p.r), Math.abs(center.s - p.s));
      if (d <= c.radius) {
        if (!selected.has(k)) info.poly.style.fill = "rgba(35, 26, 66, 0.1)";
      }
    }
  });

  for (const [k, v] of selected.entries()) {
    const info = polyByKey.get(k);
    if (info) applyHighlight(info.poly, v.color);
  }

  triangles.forEach((t) => {
    const a = polyByKey.get(t.a);
    const b = polyByKey.get(t.b);
    const c = polyByKey.get(t.c);
    if (a && b && c) drawTriangle(svgEl, { x: a.cx, y: a.cy }, { x: b.cx, y: b.cy }, { x: c.cx, y: c.cy });
  });
}

// placeholder csrf
function getCsrfToken() {
  const m = document.querySelector('meta[name="csrf-token"]');
  return m ? m.getAttribute("content") : "";
}

function fireAndForgetJSON(url, payload) {
  try {
    fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-CSRFToken": getCsrfToken() },
      body: JSON.stringify(payload),
      credentials: "same-origin",
      keepalive: true,
    }).catch(() => {});
  } catch {}
}

function getRadius() {
  const radiusInput = document.getElementById("radiusInput");
  if (!shapeEnabled || shapeType !== "circle") return null;
  const v = (radiusInput?.value || "").trim();
  if (v === "") return null;
  const n = parseInt(v, 10);
  if (!Number.isFinite(n) || n < 0) return null;
  return n;
}

// hex onclick
function handleHexClick(poly) {
  const q = parseInt(poly.dataset.q, 10);
  const r = parseInt(poly.dataset.r, 10);
  const s = parseInt(poly.dataset.s, 10);
  const k = coordKey(q, r, s);

  if (!shapeEnabled) {
    if (!selected.has(k)) {
      selected.clear();
      selected.set(k, { color: randomHighlightColor() });
    }
    msg.innerHTML = `clicked <strong>(q=${q}, r=${r}, s=${s})</strong>`;
    render(svg);
    return;
  }

  if (!selected.has(k)) selected.set(k, { color: randomHighlightColor() });

  if (shapeType === "circle") {
    const rad = getRadius();
    if (rad !== null) {
      circles.push({ centerKey: k, radius: rad });
      fireAndForgetJSON("/api/create-circle/", { origin: { q, r, s }, magnitude: rad });
    }
  } else if (shapeType === "triangle") {
    triPending.push(k);
    if (triPending.length === 3) {
      triangles.push({ a: triPending[0], b: triPending[1], c: triPending[2] });
      const v0 = parseKey(triPending[0]);
      const v1 = parseKey(triPending[1]);
      const v2 = parseKey(triPending[2]);
      triPending = [];
      fireAndForgetJSON("/api/create-triangle/", { vertices: [v0, v1, v2], magnitude: 0 });
    }
  }

  msg.innerHTML = `clicked <strong>(q=${q}, r=${r}, s=${s})</strong>`;
  render(svg);
}

// clk handler for all btns
document.addEventListener("DOMContentLoaded", () => {
  svg = document.getElementById("svg");
  msg = document.getElementById("msg");

  const shapeBtn = document.getElementById("shapeBtn");
  const clearCanvasBtn = document.getElementById("clearBtn");
  const shapeDot = document.getElementById("shapeDot");
  const shapePanel = document.getElementById("shapePanel");
  const circleControls = document.getElementById("circleControls");

  const exportCsvBtn = document.getElementById("exportCsvBtn");
  const clearDbBtn = document.getElementById("clearDbBtn");

  function syncPanel() {
    shapeDot.classList.toggle("filled", shapeEnabled);
    shapePanel.classList.toggle("hidden", !shapeEnabled);
    circleControls.classList.toggle("hidden", !shapeEnabled || shapeType !== "circle");
    shapeBtn.setAttribute("aria-pressed", shapeEnabled ? "true" : "false");
  }

  render(svg);
  syncPanel();

  svg.addEventListener("click", (e) => {
    const poly = e.target?.closest?.(".hex");
    if (!poly) return;
    handleHexClick(poly);
  });

  svg.addEventListener("wheel", (e) => {
    e.preventDefault();
    const dir = Math.sign(e.deltaY);
    if (dir > 0) showRing = clampShowRing(showRing * 2);
    else if (dir < 0) showRing = clampShowRing(Math.floor(showRing / 2));
    render(svg);
  }, { passive: false });

  svg.addEventListener("dblclick", (e) => {
    e.preventDefault();
    showRing = START_RING;
    render(svg);
  });

  shapeBtn.addEventListener("click", () => {
    shapeEnabled = !shapeEnabled;
    triPending = [];
    syncPanel();
  });

  document.querySelectorAll('input[name="shapeType"]').forEach((el) => {
    el.addEventListener("change", () => {
      shapeType = el.value;
      triPending = [];
      syncPanel();
    });
  });

  document.getElementById("radiusInput")?.addEventListener("input", () => {
    if (!shapeEnabled || shapeType !== "circle") return;
    render(svg);
  });

  clearCanvasBtn.addEventListener("click", () => {
    clearCanvasOnly(svg);
    msg.innerHTML = `Canvas cleared | Click any hexagon`;
    render(svg);
  });

  exportCsvBtn.addEventListener("click", () => {
    window.location.href = "/api/export-shapes-xlsx/";
  });

  clearDbBtn.addEventListener("click", async () => {
    try {
      const res = await fetch("/api/clear-db/", {
        method: "POST",
        headers: {
          "X-CSRFToken": getCsrfToken(),
        },
        credentials: "same-origin",
      });
      const out = await res.json().catch(() => null);
      if (!res.ok || !out || !out.ok) {
        msg.innerHTML = `Clear DB failed`;
        return;
      }
      clearCanvasOnly(svg);
      render(svg);
      msg.innerHTML = `DB cleared`;
    } catch {
      msg.innerHTML = `Clear DB failed`;
    }
  });
});
