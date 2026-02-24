// ============================================================
//  Cassini Dust Analyzer Explorer — Dashboard Application
// ============================================================

const CONFIG = {
  MASS_RANGE: [0, 200],
  NUM_BINS: 1280,
  SATURN_RADIUS_KM: 58232,
  MOON_ORBITS: [
    { name: "Mimas",     r_km: 185539,  color: "#666" },
    { name: "Enceladus", r_km: 238042,  color: "#88ddff" },
    { name: "Tethys",    r_km: 294672,  color: "#777" },
    { name: "Dione",     r_km: 377415,  color: "#888" },
    { name: "Rhea",      r_km: 527068,  color: "#999" },
    { name: "Titan",     r_km: 1221870, color: "#ffaa44" },
  ],
  CATEGORY_COLORS: {
    "0":   "#555555", "0*":  "#444444",
    "1L":  "#2277cc", "1M":  "#3399ee", "1H":  "#55bbff", "1S":  "#1155aa", "1S*": "#0e4488",
    "2O":  "#33aa55", "2W":  "#55cc77", "2O*": "#228844", "2W*": "#44bb66",
    "3L":  "#cc6622", "3M":  "#ee8833", "3W":  "#ff9944", "3C":  "#ffbb55", "3K":  "#ddaa33", "3K*": "#bb8822",
    "4I":  "#9944cc", "4S":  "#bb66ee", "4R":  "#aa55dd", "4S*": "#8833aa", "4R*": "#7722aa",
  },
  CATEGORY_LABELS: {
    "0": "Unclassified", "0*": "Unclassified (low conf)",
    "1L": "Water Ice (low)", "1M": "Water Ice (med)", "1H": "Water Ice (high)",
    "1S": "Water Ice (salt)", "1S*": "Water Ice (salt, low conf)",
    "2O": "Organic", "2W": "Organic-Water", "2O*": "Organic (low conf)", "2W*": "Organic-Water (low conf)",
    "3L": "Salt (low)", "3M": "Salt (moderate)", "3W": "Salt-Water",
    "3C": "Salt-Carbon", "3K": "Salt-Potassium", "3K*": "Salt-Potassium (low conf)",
    "4I": "Iron/Metal", "4S": "Silicate", "4R": "Refractory",
    "4S*": "Silicate (low conf)", "4R*": "Refractory (low conf)",
  },
  LAYOUT_KEY: "cassini_dashboard_layout",
};

// Periodic table element data: [symbol, atomicNumber, atomicMass, row, col, relevant]
const ELEMENTS = [
  ["H",1,1.008,0,0,true],["He",2,4.003,0,17,false],
  ["Li",3,6.941,1,0,false],["Be",4,9.012,1,1,false],
  ["B",5,10.81,1,12,false],["C",6,12.01,1,13,true],["N",7,14.01,1,14,true],["O",8,16.00,1,15,true],["F",9,19.00,1,16,true],["Ne",10,20.18,1,17,false],
  ["Na",11,22.99,2,0,true],["Mg",12,24.31,2,1,true],
  ["Al",13,26.98,2,12,true],["Si",14,28.09,2,13,true],["P",15,30.97,2,14,true],["S",16,32.07,2,15,true],["Cl",17,35.45,2,16,true],["Ar",18,39.95,2,17,false],
  ["K",19,39.10,3,0,true],["Ca",20,40.08,3,1,true],
  ["Sc",21,44.96,3,2,false],["Ti",22,47.87,3,3,true],["V",23,50.94,3,4,false],["Cr",24,52.00,3,5,true],["Mn",25,54.94,3,6,true],["Fe",26,55.85,3,7,true],["Co",27,58.93,3,8,true],["Ni",28,58.69,3,9,true],["Cu",29,63.55,3,10,true],["Zn",30,65.38,3,11,true],
  ["Ga",31,69.72,3,12,false],["Ge",32,72.63,3,13,false],["As",33,74.92,3,14,false],["Se",34,78.97,3,15,false],["Br",35,79.90,3,16,false],["Kr",36,83.80,3,17,false],
  ["Rb",37,85.47,4,0,true],["Sr",38,87.62,4,1,true],
  ["Y",39,88.91,4,2,false],["Zr",40,91.22,4,3,false],["Nb",41,92.91,4,4,false],["Mo",42,95.95,4,5,false],["Tc",43,98,4,6,false],["Ru",44,101.1,4,7,false],["Rh",45,102.9,4,8,false],["Pd",46,106.4,4,9,false],["Ag",47,107.9,4,10,false],["Cd",48,112.4,4,11,false],
  ["In",49,114.8,4,12,false],["Sn",50,118.7,4,13,false],["Sb",51,121.8,4,14,false],["Te",52,127.6,4,15,false],["I",53,126.9,4,16,false],["Xe",54,131.3,4,17,false],
];

const MOLECULES = [
  { name: "H₂O", mass: 18, color: "#55bbff" },
  { name: "CO",   mass: 28, color: "#55cc77" },
  { name: "SiO",  mass: 44, color: "#cc9944" },
  { name: "NaCl", mass: 58, color: "#ee8833" },
  { name: "SiO₂", mass: 60, color: "#cc6622" },
  { name: "CaCO₃",mass: 100,color: "#ddaa33" },
];

// ---- App State ----
const APP = {
  meta: null,
  rowCount: 0,
  filteredIndices: [],
  selectedIdx: -1,
  selectedSpectrum: null,
  hoveredIdx: -1,
  filters: {
    categories: null,
    timeMin: 0, timeMax: 1,
    rsatMin: 0, rsatMax: 160,
    incMin: -65, incMax: 65,
    confidence: 0.5,
    elements: new Set(),
  },
  streetView: { pos: 0, sortKey: "time", playing: false, playTimer: null },
  streetViewWidget: null,
  etMin: 0, etMax: 1,
  mapSketch: null,
  specSketch: null,
  grid: null,
  widgetsPresent: new Set(),
};

// ---- Utility ----
function massToBin(mass) {
  return Math.round(mass * (CONFIG.NUM_BINS - 1) / CONFIG.MASS_RANGE[1]);
}
function binToMass(bin) {
  return bin * CONFIG.MASS_RANGE[1] / (CONFIG.NUM_BINS - 1);
}
function catColor(cat) {
  return CONFIG.CATEGORY_COLORS[cat] || "#333";
}
function etToDateStr(et) {
  const j2000 = Date.UTC(2000, 0, 1, 11, 58, 55, 816);
  return new Date(j2000 + et * 1000).toISOString().slice(0, 10);
}

// ---- Data Loading ----
async function loadMetadata() {
  const resp = await fetch("/api/metadata");
  APP.meta = await resp.json();
  APP.rowCount = APP.meta._row_count;

  let etMin = Infinity, etMax = -Infinity;
  for (const v of APP.meta.ET) {
    if (v === null) continue;
    if (v < etMin) etMin = v;
    if (v > etMax) etMax = v;
  }
  APP.etMin = etMin;
  APP.etMax = etMax;
}

async function loadSpectrum(rowIdx) {
  const resp = await fetch(`/api/spectrum/${rowIdx}`);
  return resp.json();
}

// ---- Filtering ----
function applyFilters() {
  const m = APP.meta;
  const f = APP.filters;
  const etRange = APP.etMax - APP.etMin;
  const etLo = APP.etMin + f.timeMin * etRange;
  const etHi = APP.etMin + f.timeMax * etRange;

  const result = [];
  for (let i = 0; i < APP.rowCount; i++) {
    const rsat = m.R_sat[i];
    if (rsat !== null && (rsat < f.rsatMin || rsat > f.rsatMax)) continue;

    const inc = m.Inclination[i];
    if (inc !== null && (inc < f.incMin || inc > f.incMax)) continue;

    const et = m.ET[i];
    if (et !== null && (et < etLo || et > etHi)) continue;

    const conf = m.Confidence[i];
    if (conf !== null && conf < f.confidence) continue;

    if (f.categories) {
      const cat = m["M3 Category"][i];
      if (!f.categories.has(cat)) continue;
    }

    if (f.elements.size > 0) {
      const present = m.elements_present[i] || [];
      let hasAll = true;
      for (const el of f.elements) {
        if (!present.includes(el)) { hasAll = false; break; }
      }
      if (!hasAll) continue;
    }

    result.push(i);
  }
  APP.filteredIndices = result;
  updateStatsBar();
  sortStreetView();
  if (APP.mapSketch) APP.mapSketch.redraw();
  if (APP.specSketch) APP.specSketch.redraw();
}

function sortStreetView() {
  const m = APP.meta;
  const key = APP.streetView.sortKey;
  const sorted = [...APP.filteredIndices];
  const getter = {
    time: i => m.ET[i] ?? 0,
    radius: i => m.R_sat[i] ?? 0,
    inclination: i => m.Inclination[i] ?? 0,
    enceladus: i => m.Enceladus_Dist[i] ?? 999,
  }[key];
  sorted.sort((a, b) => getter(a) - getter(b));
  APP.filteredIndices = sorted;
  APP.streetView.pos = 0;
  updateStreetViewInfo();
}

// ---- Selection ----
async function selectPoint(rowIdx) {
  APP.selectedIdx = rowIdx;
  if (rowIdx < 0) {
    APP.selectedSpectrum = null;
    updateStatsBar();
    if (APP.specSketch) APP.specSketch.redraw();
    return;
  }
  const data = await loadSpectrum(rowIdx);
  APP.selectedSpectrum = data.spectrum;
  updateStatsBar();
  updateStreetViewInfo();
  if (APP.specSketch) APP.specSketch.redraw();
  if (APP.mapSketch) APP.mapSketch.redraw();
}

// ---- UI Updates ----
function updateStatsBar() {
  document.getElementById("stat-total").innerHTML = `Total: <b>${APP.rowCount.toLocaleString()}</b> grains`;
  document.getElementById("stat-filtered").innerHTML = `Filtered: <b>${APP.filteredIndices.length.toLocaleString()}</b>`;
  const selText = APP.selectedIdx >= 0
    ? `Selected: <b>Event ${APP.meta.EventID[APP.selectedIdx]}</b>`
    : "Selected: <b>none</b>";
  document.getElementById("stat-selected").innerHTML = selText;
}

function updateStreetViewInfo() {
  const pos = APP.streetView.pos;
  const total = APP.filteredIndices.length;
  if (!APP.streetViewWidget) return;
  const posEl = APP.streetViewWidget.querySelector(".sv-position");
  const detailEl = APP.streetViewWidget.querySelector(".sv-detail");
  if (!posEl || !detailEl) return;
  posEl.textContent = total > 0 ? `${pos + 1} / ${total}` : "No data";

  if (total > 0) {
    const idx = APP.filteredIndices[pos];
    const m = APP.meta;
    const parts = [
      m.UTC[idx] || "—",
      `R=${(m.R_sat[idx] ?? 0).toFixed(1)} Rₛ`,
      `Inc=${(m.Inclination[idx] ?? 0).toFixed(1)}°`,
      `Cat: ${m["M3 Category"][idx]}`,
    ];
    detailEl.textContent = parts.join("  ·  ");
  } else {
    detailEl.textContent = "";
  }
}

// ============================================================
//  Dashboard Grid & Widgets
// ============================================================
const DEFAULT_LAYOUT = [
  { id: "saturn-map", x: 0, y: 0, w: 2, h: 2 },
  { id: "spectrum", x: 2, y: 0, w: 2, h: 2 },
  { id: "street-view", x: 0, y: 2, w: 2, h: 1 },
  { id: "periodic", x: 2, y: 2, w: 2, h: 2 },
];

function initDashboard() {
  const gridEl = document.getElementById("dashboard-grid");
  gridEl.classList.add("gs-4");

  APP.grid = GridStack.init({
    column: 4,
    cellHeight: 120,
    float: true,
    animate: true,
    margin: 8,
  }, gridEl);

  APP.grid.on("resize stop drag stop", () => saveLayout());
  APP.grid.on("removed", (e, nodes) => {
    const list = Array.isArray(nodes) ? nodes : [nodes];
    list.forEach((node) => {
      const el = node?.el || node;
      const type = el?.getAttribute?.("data-widget-type") || el?.querySelector?.("[data-widget-type]")?.getAttribute("data-widget-type");
      if (type) {
        APP.widgetsPresent.delete(type);
        updatePaletteState();
        if (type === "saturn-map" && APP.mapSketch) {
          APP.mapSketch.remove();
          APP.mapSketch = null;
        }
        if (type === "spectrum" && APP.specSketch) {
          APP.specSketch.remove();
          APP.specSketch = null;
        }
        if (type === "street-view") APP.streetViewWidget = null;
      }
    });
  });

  initWidgetPalette();
  loadLayoutOrDefault();
}

function initWidgetPalette() {
  document.querySelectorAll(".palette-item").forEach((item) => {
    item.addEventListener("click", () => {
      const type = item.dataset.widget;
      if (APP.widgetsPresent.has(type)) return;
      addWidget(type);
    });
  });
}

function updatePaletteState() {
  document.querySelectorAll(".palette-item").forEach((item) => {
    const type = item.dataset.widget;
    item.classList.toggle("disabled", APP.widgetsPresent.has(type));
  });
}

function addWidget(type) {
  if (APP.widgetsPresent.has(type)) return;

  const tmpl = document.getElementById(`tmpl-${type}`);
  if (!tmpl) return;

  const clone = tmpl.content.cloneNode(true);
  const widgetEl = clone.querySelector(".grid-widget");
  const opts = { w: 2, h: 2, minW: 1, minH: 1, id: type };
  const node = APP.grid.addWidget(widgetEl, opts);
  const gsEl = node.el || node;
  if (gsEl) gsEl.setAttribute("data-widget-type", type);

  APP.widgetsPresent.add(type);
  updatePaletteState();

  setTimeout(() => initWidget(type, widgetEl), 50);
}

function initWidget(type, widgetEl) {
  const removeBtn = widgetEl.querySelector(".widget-remove");
  if (removeBtn) {
    removeBtn.addEventListener("click", () => {
      const gsItem = widgetEl.closest(".grid-stack-item");
      if (gsItem && APP.grid) APP.grid.removeWidget(gsItem, true);
    });
  }
  switch (type) {
    case "saturn-map": {
      const container = widgetEl.querySelector(".saturn-map-container");
      if (container) createSaturnMap(container);
      break;
    }
    case "street-view": {
      APP.streetViewWidget = widgetEl;
      initStreetViewInWidget(widgetEl);
      updateStreetViewInfo();
      break;
    }
    case "spectrum": {
      const container = widgetEl.querySelector(".spectrum-container");
      const logCb = widgetEl.querySelector(".spectrum-log");
      const elemCb = widgetEl.querySelector(".spectrum-show-elements");
      if (container) createSpectrumViewer(container, logCb, elemCb);
      break;
    }
    case "periodic": {
      const container = widgetEl.querySelector(".periodic-container");
      if (container) buildPeriodicTable(container);
      break;
    }
  }
}

function saveLayout() {
  const items = APP.grid.save(false).map((n) => {
    const id = n.el?.getAttribute("data-widget-type") || n.el?.querySelector("[data-widget-type]")?.getAttribute("data-widget-type") || n.id;
    return id ? { id, x: n.x, y: n.y, w: n.w, h: n.h } : null;
  }).filter(Boolean);
  try {
    localStorage.setItem(CONFIG.LAYOUT_KEY, JSON.stringify(items));
  } catch (e) {}
}

function loadLayoutOrDefault() {
  let layout = null;
  try {
    const s = localStorage.getItem(CONFIG.LAYOUT_KEY);
    if (s) layout = JSON.parse(s);
  } catch (e) {}
  if (!layout || !Array.isArray(layout) || layout.length === 0) {
    layout = DEFAULT_LAYOUT;
  }

  APP.widgetsPresent.clear();
  APP.grid.removeAll(true);
  layout.forEach((item) => {
    const type = item.id;
    if (!type || APP.widgetsPresent.has(type)) return;
    const tmpl = document.getElementById(`tmpl-${type}`);
    if (!tmpl) return;

    const clone = tmpl.content.cloneNode(true);
    const widgetEl = clone.querySelector(".grid-widget");
    const opts = {
      x: item.x ?? 0, y: item.y ?? 0,
      w: item.w ?? 2, h: item.h ?? 2,
      minW: 1, minH: 1, id: type,
    };
    const node = APP.grid.addWidget(widgetEl, opts);
    const gsEl = node?.el || node;
    if (gsEl) gsEl.setAttribute("data-widget-type", type);
    APP.widgetsPresent.add(type);
    initWidget(type, widgetEl);
  });
  updatePaletteState();
}

// ============================================================
//  Saturn Ring-Plane Map (p5.js instance)
// ============================================================
function createSaturnMap(container) {
  if (APP.mapSketch) return;
  const sketch = (p) => {
    let zoom = 1;
    let panX = 0, panY = 0;
    let dragging = false;
    let lastMX = 0, lastMY = 0;
    let pressX = 0, pressY = 0;
    const BASE_SCALE = 1 / 600000;

    function w2s(xKm, yKm) {
      const cx = p.width / 2, cy = p.height / 2;
      return {
        x: cx + xKm * BASE_SCALE * zoom * p.width / 2 + panX,
        y: cy - yKm * BASE_SCALE * zoom * p.height / 2 + panY,
      };
    }

    p.setup = () => {
      const w = container.clientWidth;
      const h = container.clientHeight;
      const cv = p.createCanvas(w, h);
      cv.parent(container);
      p.noLoop();
      p.textFont("monospace");
    };

    p.draw = () => {
      p.background(8, 10, 18);
      if (!APP.meta) return;

      const satPos = w2s(0, 0);
      const satR = CONFIG.SATURN_RADIUS_KM * BASE_SCALE * zoom * p.width / 2;

      p.noFill();
      p.strokeWeight(Math.max(1, satR * 0.3));
      p.stroke(80, 70, 50, 40);
      p.ellipse(satPos.x, satPos.y, satR * 4.2, satR * 4.2);
      p.strokeWeight(Math.max(1, satR * 0.4));
      p.stroke(90, 80, 60, 30);
      p.ellipse(satPos.x, satPos.y, satR * 3.4, satR * 3.4);

      p.strokeWeight(0.5);
      for (const moon of CONFIG.MOON_ORBITS) {
        const r = moon.r_km * BASE_SCALE * zoom * p.width / 2;
        if (r < 5 || r > p.width * 2) continue;
        p.stroke(p.color(moon.color + "40"));
        p.noFill();
        p.ellipse(satPos.x, satPos.y, r * 2, r * 2);
        if (r > 20) {
          p.noStroke();
          p.fill(p.color(moon.color + "80"));
          p.textSize(11);
          p.textAlign(p.LEFT, p.CENTER);
          p.text(moon.name, satPos.x + r + 6, satPos.y);
        }
      }

      p.noStroke();
      p.fill(180, 160, 100);
      p.ellipse(satPos.x, satPos.y, Math.max(4, satR * 2), Math.max(4, satR * 2));

      const m = APP.meta;
      const indices = APP.filteredIndices;
      const pointSize = Math.max(2.5, Math.min(7, 5 / Math.sqrt(zoom)));

      for (const i of indices) {
        const x2d = m.X2D[i], y2d = m.Y2D[i];
        if (x2d === null || y2d === null) continue;
        const sp = w2s(x2d, y2d);
        if (sp.x < -10 || sp.x > p.width + 10 || sp.y < -10 || sp.y > p.height + 10) continue;

        const col = p.color(catColor(m["M3 Category"][i]));
        if (i === APP.selectedIdx) {
          p.fill(255);
          p.noStroke();
          p.ellipse(sp.x, sp.y, pointSize + 8, pointSize + 8);
          p.fill(255, 100, 50);
          p.ellipse(sp.x, sp.y, pointSize + 3, pointSize + 3);
        } else {
          p.fill(col);
          p.noStroke();
          p.ellipse(sp.x, sp.y, pointSize, pointSize);
        }
      }

      const targetPx = 100;
      const kmPerPx = 1 / (BASE_SCALE * zoom * p.width / 2);
      const targetKm = targetPx * kmPerPx;
      const niceKm = Math.pow(10, Math.floor(Math.log10(targetKm)));
      const barPx = niceKm / kmPerPx;
      p.stroke(100);
      p.strokeWeight(2);
      const bx = 14, by = p.height - 20;
      p.line(bx, by, bx + barPx, by);
      p.noStroke();
      p.fill(150);
      p.textSize(12);
      p.textAlign(p.LEFT, p.BOTTOM);
      const label = niceKm >= 1e6 ? `${(niceKm/1e6).toFixed(0)}M km`
                  : niceKm >= 1000 ? `${(niceKm/1000).toFixed(0)}K km`
                  : `${niceKm} km`;
      p.text(label, bx, by - 4);
    };

    p.mouseWheel = (e) => {
      if (p.mouseX < 0 || p.mouseX > p.width || p.mouseY < 0 || p.mouseY > p.height) return true;
      const factor = e.delta > 0 ? 0.85 : 1.18;
      const mx = p.mouseX - p.width / 2 - panX;
      const my = p.mouseY - p.height / 2 - panY;
      const newZoom = p.constrain(zoom * factor, 0.02, 200);
      const actualFactor = newZoom / zoom;
      zoom = newZoom;
      panX -= mx * (actualFactor - 1);
      panY -= my * (actualFactor - 1);
      p.redraw();
      return false;
    };

    p.mousePressed = () => {
      if (p.mouseX < 0 || p.mouseX > p.width || p.mouseY < 0 || p.mouseY > p.height) return;
      dragging = true;
      pressX = p.mouseX;
      pressY = p.mouseY;
      lastMX = p.mouseX;
      lastMY = p.mouseY;
    };

    p.mouseDragged = () => {
      if (!dragging) return;
      panX += p.mouseX - lastMX;
      panY += p.mouseY - lastMY;
      lastMX = p.mouseX;
      lastMY = p.mouseY;
      p.redraw();
    };

    p.mouseReleased = () => {
      if (!dragging) return;
      dragging = false;
      const dx = Math.abs(p.mouseX - pressX);
      const dy = Math.abs(p.mouseY - pressY);
      if (dx < 5 && dy < 5) handleMapClick(p);
    };

    function handleMapClick(p) {
      if (!APP.meta) return;
      const m = APP.meta;
      let bestDist = 18;
      let bestIdx = -1;
      for (const i of APP.filteredIndices) {
        const x2d = m.X2D[i], y2d = m.Y2D[i];
        if (x2d === null) continue;
        const sp = w2s(x2d, y2d);
        const d = Math.hypot(sp.x - p.mouseX, sp.y - p.mouseY);
        if (d < bestDist) { bestDist = d; bestIdx = i; }
      }
      if (bestIdx >= 0) {
        const svIdx = APP.filteredIndices.indexOf(bestIdx);
        if (svIdx >= 0) APP.streetView.pos = svIdx;
        selectPoint(bestIdx);
      }
    }

    const ro = new ResizeObserver(() => {
      const w = container.clientWidth;
      const h = container.clientHeight;
      if (w > 0 && h > 0) {
        p.resizeCanvas(w, h);
        p.redraw();
      }
    });
    ro.observe(container);
  };

  APP.mapSketch = new p5(sketch);
}

// ============================================================
//  Spectrum Viewer (p5.js instance)
// ============================================================
function createSpectrumViewer(container, logCheckbox, elemCheckbox) {
  if (APP.specSketch) return;
  const sketch = (p) => {
    const MARGIN = { top: 28, right: 20, bottom: 42, left: 60 };
    let hoverBin = -1;

    p.setup = () => {
      const w = container.clientWidth;
      const h = container.clientHeight;
      const cv = p.createCanvas(w, h);
      cv.parent(container);
      p.noLoop();
      p.textFont("monospace");
    };

    p.draw = () => {
      p.background(8, 10, 18);
      const pw = p.width - MARGIN.left - MARGIN.right;
      const ph = p.height - MARGIN.top - MARGIN.bottom;

      if (!APP.selectedSpectrum) {
        p.fill(120);
        p.noStroke();
        p.textSize(16);
        p.textAlign(p.CENTER, p.CENTER);
        p.text("Click a data point on the map to view its spectrum", p.width / 2, p.height / 2);
        return;
      }

      const spec = APP.selectedSpectrum;
      const useLog = logCheckbox?.checked ?? true;
      const showElems = elemCheckbox?.checked ?? true;

      const vals = new Float64Array(spec.length);
      let maxVal = 0;
      for (let i = 0; i < spec.length; i++) {
        let v = spec[i];
        if (useLog) v = v > 0 ? Math.log10(v + 1) : 0;
        vals[i] = v;
        if (v > maxVal) maxVal = v;
      }
      if (maxVal === 0) maxVal = 1;

      p.stroke(25, 30, 50);
      p.strokeWeight(0.5);
      for (let m = 0; m <= 200; m += 20) {
        const x = MARGIN.left + (massToBin(m) / CONFIG.NUM_BINS) * pw;
        p.line(x, MARGIN.top, x, MARGIN.top + ph);
      }
      for (let frac = 0; frac <= 1; frac += 0.25) {
        const y = MARGIN.top + ph * (1 - frac);
        p.line(MARGIN.left, y, MARGIN.left + pw, y);
      }

      if (showElems) {
        for (const el of ELEMENTS) {
          if (!el[5]) continue;
          const bin = massToBin(el[2]);
          const x = MARGIN.left + (bin / CONFIG.NUM_BINS) * pw;
          const isActive = APP.filters.elements.has(el[0]);
          p.stroke(isActive ? p.color(0, 200, 240, 80) : p.color(60, 70, 90, 40));
          p.strokeWeight(isActive ? 1.5 : 0.5);
          p.line(x, MARGIN.top, x, MARGIN.top + ph);
        }
        for (const mol of MOLECULES) {
          const bin = massToBin(mol.mass);
          const x = MARGIN.left + (bin / CONFIG.NUM_BINS) * pw;
          p.stroke(p.color(mol.color + "30"));
          p.strokeWeight(0.5);
          p.drawingContext.setLineDash?.([3, 3]);
          p.line(x, MARGIN.top, x, MARGIN.top + ph);
          p.drawingContext.setLineDash?.([]);
        }
      }

      p.stroke(0, 190, 240);
      p.strokeWeight(1.5);
      p.noFill();
      p.beginShape();
      for (let i = 0; i < spec.length; i++) {
        const x = MARGIN.left + (i / CONFIG.NUM_BINS) * pw;
        const y = MARGIN.top + ph - (vals[i] / maxVal) * ph;
        p.vertex(x, y);
      }
      p.endShape();

      p.fill(0, 140, 200, 25);
      p.noStroke();
      p.beginShape();
      p.vertex(MARGIN.left, MARGIN.top + ph);
      for (let i = 0; i < spec.length; i++) {
        const x = MARGIN.left + (i / CONFIG.NUM_BINS) * pw;
        const y = MARGIN.top + ph - (vals[i] / maxVal) * ph;
        p.vertex(x, y);
      }
      p.vertex(MARGIN.left + pw, MARGIN.top + ph);
      p.endShape(p.CLOSE);

      if (showElems) {
        p.textSize(10);
        p.textAlign(p.CENTER, p.BOTTOM);
        for (const el of ELEMENTS) {
          if (!el[5]) continue;
          const bin = massToBin(el[2]);
          const x = MARGIN.left + (bin / CONFIG.NUM_BINS) * pw;
          const isActive = APP.filters.elements.has(el[0]);
          p.fill(isActive ? p.color(0, 220, 255) : p.color(80, 90, 120));
          p.noStroke();
          p.text(el[0], x, MARGIN.top - 2);
        }
      }

      p.fill(160);
      p.noStroke();
      p.textSize(12);
      p.textAlign(p.CENTER, p.TOP);
      for (let m = 0; m <= 200; m += 20) {
        const x = MARGIN.left + (massToBin(m) / CONFIG.NUM_BINS) * pw;
        p.text(m, x, MARGIN.top + ph + 6);
      }
      p.textSize(13);
      p.text("Mass (AMU)", MARGIN.left + pw / 2, MARGIN.top + ph + 24);

      p.push();
      p.translate(16, MARGIN.top + ph / 2);
      p.rotate(-p.HALF_PI);
      p.textAlign(p.CENTER, p.CENTER);
      p.text(useLog ? "Intensity (log)" : "Intensity", 0, 0);
      p.pop();

      if (hoverBin >= 0 && hoverBin < CONFIG.NUM_BINS) {
        const x = MARGIN.left + (hoverBin / CONFIG.NUM_BINS) * pw;
        p.stroke(255, 255, 255, 80);
        p.strokeWeight(0.5);
        p.line(x, MARGIN.top, x, MARGIN.top + ph);

        const mass = binToMass(hoverBin).toFixed(1);
        const intensity = spec[hoverBin].toFixed(2);
        p.noStroke();
        p.fill(0, 0, 0, 200);
        p.rect(x + 8, MARGIN.top + 6, 110, 32, 6);
        p.fill(220);
        p.textSize(12);
        p.textAlign(p.LEFT, p.TOP);
        p.text(`${mass} AMU`, x + 12, MARGIN.top + 10);
        p.text(`Int: ${intensity}`, x + 12, MARGIN.top + 24);
      }
    };

    p.mouseMoved = () => {
      const pw = p.width - MARGIN.left - MARGIN.right;
      if (p.mouseX >= MARGIN.left && p.mouseX <= MARGIN.left + pw &&
          p.mouseY >= MARGIN.top && p.mouseY <= MARGIN.top + p.height - MARGIN.top - MARGIN.bottom) {
        hoverBin = Math.floor(((p.mouseX - MARGIN.left) / pw) * CONFIG.NUM_BINS);
        hoverBin = Math.max(0, Math.min(CONFIG.NUM_BINS - 1, hoverBin));
      } else {
        hoverBin = -1;
      }
      p.redraw();
    };

    const ro = new ResizeObserver(() => {
      const w = container.clientWidth;
      const h = container.clientHeight;
      if (w > 0 && h > 0) {
        p.resizeCanvas(w, h);
        p.redraw();
      }
    });
    ro.observe(container);
  };

  APP.specSketch = new p5(sketch);

  if (logCheckbox) logCheckbox.addEventListener("change", () => APP.specSketch?.redraw());
  if (elemCheckbox) elemCheckbox.addEventListener("change", () => APP.specSketch?.redraw());
}

// ============================================================
//  Periodic Table
// ============================================================
function buildPeriodicTable(container) {
  container.innerHTML = "";
  container.classList.add("periodic-table");

  for (const [sym, num, mass, row, col, relevant] of ELEMENTS) {
    const cell = document.createElement("div");
    cell.className = `pt-cell ${relevant ? "relevant" : "irrelevant"}`;
    cell.style.gridRow = row + 1;
    cell.style.gridColumn = col + 1;
    cell.innerHTML = `<span class="pt-num">${num}</span><span class="pt-sym">${sym}</span><span class="pt-mass">${mass.toFixed(1)}</span>`;
    cell.title = `${sym} — ${mass.toFixed(2)} AMU`;

    if (relevant) {
      cell.addEventListener("click", () => {
        if (APP.filters.elements.has(sym)) {
          APP.filters.elements.delete(sym);
          cell.classList.remove("active");
        } else {
          APP.filters.elements.add(sym);
          cell.classList.add("active");
        }
        applyFilters();
      });
    }
    container.appendChild(cell);
  }
}

// ============================================================
//  Street View Navigator
// ============================================================
function initStreetViewInWidget(widgetEl) {
  const prevBtn = widgetEl.querySelector(".sv-prev");
  const nextBtn = widgetEl.querySelector(".sv-next");
  const sortSelect = widgetEl.querySelector(".sv-sort");
  const playBtn = widgetEl.querySelector(".sv-play");

  if (prevBtn) prevBtn.addEventListener("click", () => svNavigate(-1));
  if (nextBtn) nextBtn.addEventListener("click", () => svNavigate(1));
  if (sortSelect) {
    sortSelect.addEventListener("change", (e) => {
      APP.streetView.sortKey = e.target.value;
      sortStreetView();
    });
  }
  if (playBtn) playBtn.addEventListener("click", togglePlay);
}

function svNavigate(dir) {
  const total = APP.filteredIndices.length;
  if (total === 0) return;
  APP.streetView.pos = (APP.streetView.pos + dir + total) % total;
  const rowIdx = APP.filteredIndices[APP.streetView.pos];
  selectPoint(rowIdx);
}

function togglePlay() {
  const sv = APP.streetView;
  sv.playing = !sv.playing;
  const playBtn = APP.streetViewWidget?.querySelector(".sv-play");
  if (playBtn) playBtn.textContent = sv.playing ? "⏸ Pause" : "▶ Play";
  if (sv.playing) {
    sv.playTimer = setInterval(() => svNavigate(1), 600);
  } else {
    clearInterval(sv.playTimer);
    sv.playTimer = null;
  }
}

// ============================================================
//  Filter Controls
// ============================================================
function initFilters() {
  const cats = [...new Set(APP.meta["M3 Category"])].sort();
  const sel = document.getElementById("filter-category");
  for (const cat of cats) {
    const opt = document.createElement("option");
    opt.value = cat;
    opt.textContent = `${cat} — ${CONFIG.CATEGORY_LABELS[cat] || cat}`;
    sel.appendChild(opt);
  }
  sel.addEventListener("change", () => {
    const selected = [...sel.selectedOptions].map(o => o.value);
    if (selected.includes("__all__") || selected.length === 0) {
      APP.filters.categories = null;
    } else {
      APP.filters.categories = new Set(selected);
    }
    applyFilters();
  });

  const tMinEl = document.getElementById("filter-time-min");
  const tMaxEl = document.getElementById("filter-time-max");
  const tMinL = document.getElementById("filter-time-min-label");
  const tMaxL = document.getElementById("filter-time-max-label");

  function updateTimeLabels() {
    tMinL.textContent = etToDateStr(APP.etMin + parseFloat(tMinEl.value) * (APP.etMax - APP.etMin));
    tMaxL.textContent = etToDateStr(APP.etMin + parseFloat(tMaxEl.value) * (APP.etMax - APP.etMin));
  }
  updateTimeLabels();

  tMinEl.addEventListener("input", () => {
    APP.filters.timeMin = parseFloat(tMinEl.value);
    updateTimeLabels();
    applyFilters();
  });
  tMaxEl.addEventListener("input", () => {
    APP.filters.timeMax = parseFloat(tMaxEl.value);
    updateTimeLabels();
    applyFilters();
  });

  const rMinEl = document.getElementById("filter-rsat-min");
  const rMaxEl = document.getElementById("filter-rsat-max");
  rMinEl.addEventListener("input", () => {
    APP.filters.rsatMin = parseFloat(rMinEl.value);
    document.getElementById("filter-rsat-min-label").textContent = rMinEl.value;
    applyFilters();
  });
  rMaxEl.addEventListener("input", () => {
    APP.filters.rsatMax = parseFloat(rMaxEl.value);
    document.getElementById("filter-rsat-max-label").textContent = rMaxEl.value;
    applyFilters();
  });

  const iMinEl = document.getElementById("filter-inc-min");
  const iMaxEl = document.getElementById("filter-inc-max");
  iMinEl.addEventListener("input", () => {
    APP.filters.incMin = parseFloat(iMinEl.value);
    document.getElementById("filter-inc-min-label").textContent = `${iMinEl.value}°`;
    applyFilters();
  });
  iMaxEl.addEventListener("input", () => {
    APP.filters.incMax = parseFloat(iMaxEl.value);
    document.getElementById("filter-inc-max-label").textContent = `${iMaxEl.value}°`;
    applyFilters();
  });

  const confEl = document.getElementById("filter-confidence");
  confEl.addEventListener("input", () => {
    APP.filters.confidence = parseFloat(confEl.value);
    document.getElementById("filter-confidence-label").textContent = `≥ ${parseFloat(confEl.value).toFixed(2)}`;
    applyFilters();
  });

  document.getElementById("btn-reset-filters").addEventListener("click", () => {
    APP.filters = {
      categories: null,
      timeMin: 0, timeMax: 1,
      rsatMin: 0, rsatMax: 160,
      incMin: -65, incMax: 65,
      confidence: 0.5,
      elements: new Set(),
    };
    tMinEl.value = 0; tMaxEl.value = 1;
    rMinEl.value = 0; rMaxEl.value = 160;
    iMinEl.value = -65; iMaxEl.value = 65;
    confEl.value = 0.5;
    sel.selectedIndex = 0;
    updateTimeLabels();
    document.querySelectorAll(".pt-cell.active").forEach(c => c.classList.remove("active"));
    document.getElementById("filter-rsat-min-label").textContent = "0";
    document.getElementById("filter-rsat-max-label").textContent = "160";
    document.getElementById("filter-inc-min-label").textContent = "-65°";
    document.getElementById("filter-inc-max-label").textContent = "65°";
    document.getElementById("filter-confidence-label").textContent = "≥ 0.50";
    applyFilters();
  });
}

// ---- Keyboard navigation ----
function initKeyboard() {
  document.addEventListener("keydown", (e) => {
    if (e.key === "ArrowLeft") { svNavigate(-1); e.preventDefault(); }
    if (e.key === "ArrowRight") { svNavigate(1); e.preventDefault(); }
    if (e.key === " ") { togglePlay(); e.preventDefault(); }
  });
}

// ============================================================
//  Initialization
// ============================================================
async function init() {
  try {
    await loadMetadata();

    document.getElementById("loading-banner").classList.add("hidden");
    document.getElementById("stats-bar").classList.remove("hidden");

    initFilters();
    initKeyboard();
    initDashboard();

    APP.filteredIndices = Array.from({ length: APP.rowCount }, (_, i) => i);
    applyFilters();

  } catch (err) {
    document.getElementById("loading-banner").textContent = `Error: ${err.message}`;
    document.getElementById("loading-banner").style.color = "#ff4466";
    console.error(err);
  }
}

window.addEventListener("DOMContentLoaded", init);
