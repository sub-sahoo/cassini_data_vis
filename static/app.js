// ============================================================
//  Cassini Dust Analyzer Explorer — Dashboard Application
// ============================================================

const CONFIG = {
    MODE_KEY: "cassini_simple_mode",
    LAYOUT_KEY: "cassini_dashboard_layout",
    MASS_RANGE: [0, 200],
    NUM_BINS: 1280,
    SATURN_RADIUS_KM: 58232,
    MOON_ORBITS: [
        { name: "Mimas", r_km: 185539, color: "#666" },
        { name: "Enceladus", r_km: 238042, color: "#88ddff" },
        { name: "Tethys", r_km: 294672, color: "#777" },
        { name: "Dione", r_km: 377415, color: "#888" },
        { name: "Rhea", r_km: 527068, color: "#999" },
        { name: "Titan", r_km: 1221870, color: "#ffaa44" },
    ],
    CATEGORY_COLORS: {
        "0": "#555555", "0*": "#444444",
        "1L": "#0d4d8c", "1M": "#1a6bb8", "1H": "#2e9bda", "1S": "#7a9fdf", "1S*": "#6a8fd4",
        "2O": "#33aa55", "2W": "#55cc77", "2O*": "#228844", "2W*": "#44bb66",
        "3L": "#cc6622", "3M": "#ee8833", "3W": "#ff9944", "3C": "#ffbb55", "3K": "#ddaa33", "3K*": "#bb8822",
        "4I": "#9944cc", "4S": "#bb66ee", "4R": "#aa55dd", "4S*": "#8833aa", "4R*": "#7722aa",
    },
    CATEGORY_LABELS: {
        "0": "Unclassified", "0*": "Unclassified (low conf)",
        "1L": "Water Ice (low)", "1M": "Water Ice (med)", "1H": "Water Ice (high)",
        "1S": "Water Ice (high vel, m/19)", "1S*": "Water Ice (high vel, low conf)",
        "2O": "Organic", "2W": "Organic-Water", "2O*": "Organic (low conf)", "2W*": "Organic-Water (low conf)",
        "3L": "Salt (low)", "3M": "Salt (moderate)", "3W": "Salt-Water",
        "3C": "Salt-Carbon", "3K": "Salt-Potassium", "3K*": "Salt-Potassium (low conf)",
        "4I": "Iron/Metal", "4S": "Silicate", "4R": "Refractory",
        "4S*": "Silicate (low conf)", "4R*": "Refractory (low conf)",
    },
};

let CONFIG_OVERRIDES = { colors: {}, sizes: {} };
function loadConfigOverrides() {
    try {
        const s = localStorage.getItem("cassini_config_overrides");
        if (s) Object.assign(CONFIG_OVERRIDES, JSON.parse(s));
    } catch (e) { }
}
function saveConfigOverrides() {
    try {
        localStorage.setItem("cassini_config_overrides", JSON.stringify(CONFIG_OVERRIDES));
    } catch (e) { }
}

// Periodic table element data: [symbol, atomicNumber, atomicMass, row, col, relevant]
const ELEMENTS = [
    ["H", 1, 1.008, 0, 0, true], ["He", 2, 4.003, 0, 17, false],
    ["Li", 3, 6.941, 1, 0, false], ["Be", 4, 9.012, 1, 1, false],
    ["B", 5, 10.81, 1, 12, false], ["C", 6, 12.01, 1, 13, true], ["N", 7, 14.01, 1, 14, true], ["O", 8, 16.00, 1, 15, true], ["F", 9, 19.00, 1, 16, true], ["Ne", 10, 20.18, 1, 17, false],
    ["Na", 11, 22.99, 2, 0, true], ["Mg", 12, 24.31, 2, 1, true],
    ["Al", 13, 26.98, 2, 12, true], ["Si", 14, 28.09, 2, 13, true], ["P", 15, 30.97, 2, 14, true], ["S", 16, 32.07, 2, 15, true], ["Cl", 17, 35.45, 2, 16, true], ["Ar", 18, 39.95, 2, 17, false],
    ["K", 19, 39.10, 3, 0, true], ["Ca", 20, 40.08, 3, 1, true],
    ["Sc", 21, 44.96, 3, 2, false], ["Ti", 22, 47.87, 3, 3, true], ["V", 23, 50.94, 3, 4, false], ["Cr", 24, 52.00, 3, 5, true], ["Mn", 25, 54.94, 3, 6, true], ["Fe", 26, 55.85, 3, 7, true], ["Co", 27, 58.93, 3, 8, true], ["Ni", 28, 58.69, 3, 9, true], ["Cu", 29, 63.55, 3, 10, true], ["Zn", 30, 65.38, 3, 11, true],
    ["Ga", 31, 69.72, 3, 12, false], ["Ge", 32, 72.63, 3, 13, false], ["As", 33, 74.92, 3, 14, false], ["Se", 34, 78.97, 3, 15, false], ["Br", 35, 79.90, 3, 16, false], ["Kr", 36, 83.80, 3, 17, false],
    ["Rb", 37, 85.47, 4, 0, true], ["Sr", 38, 87.62, 4, 1, true],
    ["Y", 39, 88.91, 4, 2, false], ["Zr", 40, 91.22, 4, 3, false], ["Nb", 41, 92.91, 4, 4, false], ["Mo", 42, 95.95, 4, 5, false], ["Tc", 43, 98, 4, 6, false], ["Ru", 44, 101.1, 4, 7, false], ["Rh", 45, 102.9, 4, 8, false], ["Pd", 46, 106.4, 4, 9, false], ["Ag", 47, 107.9, 4, 10, false], ["Cd", 48, 112.4, 4, 11, false],
    ["In", 49, 114.8, 4, 12, false], ["Sn", 50, 118.7, 4, 13, false], ["Sb", 51, 121.8, 4, 14, false], ["Te", 52, 127.6, 4, 15, false], ["I", 53, 126.9, 4, 16, false], ["Xe", 54, 131.3, 4, 17, false],
];

// Species explicitly named in CompositionalClassificationTable.xlsx
const MOLECULES = [
    { name: "H₂O", mass: 18, color: "#55bbff" },
    { name: "HCN", mass: 27, color: "#55cc77" },
    { name: "HCO", mass: 29, color: "#66cc88" },
    { name: "C₆H₆", mass: 78, color: "#cc9944" },
];

// Chemical species (from CompositionalClassificationTable.xlsx). Maps to elements_present from preprocess.
const CHEMICAL_SPECIES = {
    Carbon: ["C", "C6H6"],       // 2O organics; 4S mass 12
    Nitrogen: ["N", "HCN"],      // 2W [HCN]+
    Oxygen: ["O", "H2O"],        // 1L, 2W, 3W
    Sodium: ["Na"],              // 1L, 2W, 3W, 3M; 4R
    Magnesium: ["Mg"],           // 4R silicates
    Silicon: ["Si"],             // 4R silicates
    Phosphorus: ["P"],           // 3M rare phosphates
    Sulfur: ["S"],               // 4I FeS
    Chlorine: ["Cl"],            // 3M chloride species
    Potassium: ["K"],            // 3K, 3M
    Calcium: ["Ca"],             // 4R silicates
    Iron: ["Fe"],                // 4I, 4R
};

// ---- Default config (Simple mode) ----
function getDefaultFilters() {
    return {
        categories: null,
        chemicalSpecies: new Set(),
        timeMin: 0, timeMax: 1,
        rsatMin: 0, rsatMax: 160,
        incMin: -65, incMax: 65,
        confidence: 0.6,
        elements: new Set(),
    };
}

// ---- App State ----
const APP = {
    meta: null,
    rowCount: 0,
    filteredIndices: [],
    selectedIdx: -1,
    selectedSpectrum: null,
    hoveredIdx: -1,
    simpleMode: true,
    filters: {
        categories: null,
        chemicalSpecies: new Set(),
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
    return CONFIG_OVERRIDES.colors?.[cat] ?? CONFIG.CATEGORY_COLORS[cat] ?? "#333";
}
function catSizeMultiplier(cat) {
    return CONFIG_OVERRIDES.sizes?.[cat] ?? 1;
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

        if (f.chemicalSpecies.size > 0) {
            const present = m.elements_present[i] || [];
            let hasAny = false;
            for (const species of f.chemicalSpecies) {
                const targets = CHEMICAL_SPECIES[species];
                if (targets && targets.some(t => present.includes(t))) { hasAny = true; break; }
            }
            if (!hasAny) continue;
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
    { id: "saturn-map", x: 0, y: 0, w: 4, h: 4 },
    { id: "spectrum", x: 0, y: 4, w: 2, h: 2 },
    { id: "periodic", x: 2, y: 4, w: 2, h: 2 },
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
        draggable: { handle: '.panel-header' },  // only header bar moves the widget; pan/scroll work in content
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
            if (APP.widgetsPresent.has(type)) {
                const gsItem = APP.grid.el?.querySelector(`[data-widget-type="${type}"]`);
                if (gsItem && APP.grid) APP.grid.removeWidget(gsItem, true);
            } else {
                addWidget(type);
            }
        });
    });
}

function updatePaletteState() {
    document.querySelectorAll(".palette-item").forEach((item) => {
        const type = item.dataset.widget;
        item.classList.toggle("on-grid", APP.widgetsPresent.has(type));
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
        case "config": {
            const container = widgetEl.querySelector(".config-container");
            if (container) buildConfigPanel(container, widgetEl);
            break;
        }
    }
}

function buildConfigPanel(container, widgetEl) {
    container.innerHTML = "";
    const cats = Object.keys(CONFIG.CATEGORY_LABELS);
    for (const cat of cats) {
        const row = document.createElement("div");
        row.className = "config-row";
        const label = document.createElement("span");
        label.className = "config-label";
        label.textContent = `${cat} — ${CONFIG.CATEGORY_LABELS[cat] || cat}`;
        const colorInp = document.createElement("input");
        colorInp.type = "color";
        colorInp.value = CONFIG_OVERRIDES.colors?.[cat] ?? CONFIG.CATEGORY_COLORS[cat] ?? "#333";
        colorInp.title = "Color";
        const sizeInp = document.createElement("input");
        sizeInp.type = "range";
        sizeInp.min = "0.5"; sizeInp.max = "2"; sizeInp.step = "0.1";
        sizeInp.value = String(CONFIG_OVERRIDES.sizes?.[cat] ?? 1);
        sizeInp.title = "Size multiplier";
        const sizeVal = document.createElement("span");
        sizeVal.className = "config-size-val";
        sizeVal.textContent = sizeInp.value + "×";
        sizeInp.addEventListener("input", () => {
            sizeVal.textContent = sizeInp.value + "×";
            CONFIG_OVERRIDES.sizes = CONFIG_OVERRIDES.sizes || {};
            CONFIG_OVERRIDES.sizes[cat] = parseFloat(sizeInp.value);
            saveConfigOverrides();
            if (APP.mapSketch) APP.mapSketch.redraw();
        });
        colorInp.addEventListener("input", () => {
            CONFIG_OVERRIDES.colors = CONFIG_OVERRIDES.colors || {};
            CONFIG_OVERRIDES.colors[cat] = colorInp.value;
            saveConfigOverrides();
            if (APP.mapSketch) APP.mapSketch.redraw();
        });
        row.appendChild(label);
        row.appendChild(colorInp);
        row.appendChild(sizeInp);
        row.appendChild(sizeVal);
        container.appendChild(row);
    }
    widgetEl.querySelector(".config-reset")?.addEventListener("click", () => {
        CONFIG_OVERRIDES = { colors: {}, sizes: {} };
        saveConfigOverrides();
        buildConfigPanel(container, widgetEl);
        if (APP.mapSketch) APP.mapSketch.redraw();
    });
}

function saveLayout() {
    const items = APP.grid.save(false).map((n) => {
        const id = n.el?.getAttribute("data-widget-type") || n.el?.querySelector("[data-widget-type]")?.getAttribute("data-widget-type") || n.id;
        return id ? { id, x: n.x, y: n.y, w: n.w, h: n.h } : null;
    }).filter(Boolean);
    try {
        localStorage.setItem(CONFIG.LAYOUT_KEY, JSON.stringify(items));
    } catch (e) { }
}

function loadLayoutOrDefault() {
    let layout = null;
    try {
        const s = localStorage.getItem(CONFIG.LAYOUT_KEY);
        if (s) layout = JSON.parse(s);
    } catch (e) { }
    if (!layout || !Array.isArray(layout) || layout.length < 2) {
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
            const baseSize = Math.max(2.5, Math.min(7, 5 / Math.sqrt(zoom)));

            for (const i of indices) {
                const x2d = m.X2D[i], y2d = m.Y2D[i];
                if (x2d === null || y2d === null) continue;
                const sp = w2s(x2d, y2d);
                if (sp.x < -10 || sp.x > p.width + 10 || sp.y < -10 || sp.y > p.height + 10) continue;

                const cat = m["M3 Category"][i];
                const pointSize = baseSize * catSizeMultiplier(cat);
                const col = p.color(catColor(cat));
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
            const label = niceKm >= 1e6 ? `${(niceKm / 1e6).toFixed(0)}M km`
                : niceKm >= 1000 ? `${(niceKm / 1000).toFixed(0)}K km`
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
            const showElems = (elemCheckbox?.checked ?? true) && APP.filters.elements.size > 0;

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
                const sel = APP.filters.elements;
                const MOL_ELEMENTS = { H2O: ["H", "O"], HCN: ["H", "C", "N"], HCO: ["H", "C", "O"], C6H6: ["C", "H"] };
                for (const el of ELEMENTS) {
                    if (!el[5] || !sel.has(el[0])) continue;
                    const bin = massToBin(el[2]);
                    const x = MARGIN.left + (bin / CONFIG.NUM_BINS) * pw;
                    p.stroke(p.color(0, 220, 255, 120));
                    p.strokeWeight(2.5);
                    p.line(x, MARGIN.top, x, MARGIN.top + ph);
                }
                for (const mol of MOLECULES) {
                    const molEls = MOL_ELEMENTS[mol.name.replace(/₂/g, "2").replace(/₃/g, "3").replace(/₆/g, "6")] || [];
                    if (!molEls.some(e => sel.has(e))) continue;
                    const bin = massToBin(mol.mass);
                    const x = MARGIN.left + (bin / CONFIG.NUM_BINS) * pw;
                    p.stroke(p.color(mol.color + "80"));
                    p.strokeWeight(1.5);
                    p.drawingContext.setLineDash?.([4, 4]);
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
                p.textSize(13);
                p.textAlign(p.CENTER, p.BOTTOM);
                const MIN_LABEL_SPACE = 28;
                let lastLabelX = -999;
                const sel = APP.filters.elements;
                const elementsToShow = [];
                for (const el of ELEMENTS) {
                    if (!el[5] || !sel.has(el[0])) continue;
                    const bin = massToBin(el[2]);
                    const x = MARGIN.left + (bin / CONFIG.NUM_BINS) * pw;
                    elementsToShow.push({ el, x });
                }
                for (const { el, x } of elementsToShow) {
                    if (x - lastLabelX >= MIN_LABEL_SPACE) {
                        p.fill(p.color(0, 255, 255));
                        p.noStroke();
                        p.text(el[0], x, MARGIN.top - 2);
                        lastLabelX = x;
                    }
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
const CATEGORY_GROUPS = {
    "Water": ["1L", "1M", "1H", "1S", "1S*"],
    "Organic": ["2O", "2W", "2O*", "2W*"],
    "Salt": ["3L", "3M", "3W", "3C", "3K", "3K*"],
    "Silicate/Refractory": ["4I", "4S", "4R", "4S*", "4R*"],
    "Unclassified": ["0", "0*"],
};

function buildCategoryChips() {
    const container = document.getElementById("filter-category-chips");
    if (!container) return;
    container.innerHTML = "";
    const allCats = [...new Set(APP.meta["M3 Category"])].sort();
    const grouped = new Set(Object.values(CATEGORY_GROUPS).flat());

    function addChip(cat, label) {
        const chip = document.createElement("button");
        chip.type = "button";
        chip.className = "category-chip";
        chip.dataset.cat = cat;
        chip.title = `${cat} — ${CONFIG.CATEGORY_LABELS[cat] || cat}`;
        const color = catColor(cat);
        chip.style.setProperty("--chip-color", color);
        chip.innerHTML = `<span class="chip-swatch"></span><span class="chip-label">${label || CONFIG.CATEGORY_LABELS[cat] || cat}</span>`;
        chip.addEventListener("click", () => {
            if (cat === "__all__") {
                APP.filters.categories = null;
                container.querySelectorAll(".category-chip").forEach(c => c.classList.remove("selected"));
                container.querySelector('[data-cat="__all__"]')?.classList.add("selected");
            } else {
                if (APP.filters.categories == null) APP.filters.categories = new Set();
                if (APP.filters.categories.has(cat)) {
                    APP.filters.categories.delete(cat);
                    chip.classList.remove("selected");
                } else {
                    APP.filters.categories.add(cat);
                    chip.classList.add("selected");
                }
                container.querySelector('[data-cat="__all__"]')?.classList.remove("selected");
                if (APP.filters.categories.size === 0) APP.filters.categories = null;
            }
            applyFilters();
        });
        container.appendChild(chip);
    }

    addChip("__all__", "All");
    for (const [groupName, groupCats] of Object.entries(CATEGORY_GROUPS)) {
        for (const cat of groupCats) {
            if (!allCats.includes(cat)) continue;
            addChip(cat, `${cat}`);
        }
    }
    for (const cat of allCats.filter(c => !grouped.has(c))) {
        addChip(cat, cat);
    }
}

function syncFilterControlsFromState() {
    const confEl = document.getElementById("filter-confidence");
    const confLab = document.getElementById("filter-confidence-label");
    if (confEl) confEl.value = String(APP.filters.confidence);
    if (confLab) confLab.textContent = `≥ ${APP.filters.confidence.toFixed(2)}`;

    const tMinEl = document.getElementById("filter-time-min");
    const tMaxEl = document.getElementById("filter-time-max");
    if (tMinEl) tMinEl.value = String(APP.filters.timeMin);
    if (tMaxEl) tMaxEl.value = String(APP.filters.timeMax);

    const rMinEl = document.getElementById("filter-rsat-min");
    const rMaxEl = document.getElementById("filter-rsat-max");
    if (rMinEl) rMinEl.value = String(APP.filters.rsatMin);
    if (rMaxEl) rMaxEl.value = String(APP.filters.rsatMax);
    document.getElementById("filter-rsat-min-label").textContent = APP.filters.rsatMin;
    document.getElementById("filter-rsat-max-label").textContent = APP.filters.rsatMax;

    const iMinEl = document.getElementById("filter-inc-min");
    const iMaxEl = document.getElementById("filter-inc-max");
    if (iMinEl) iMinEl.value = String(APP.filters.incMin);
    if (iMaxEl) iMaxEl.value = String(APP.filters.incMax);
    document.getElementById("filter-inc-min-label").textContent = `${APP.filters.incMin}°`;
    document.getElementById("filter-inc-max-label").textContent = `${APP.filters.incMax}°`;

    const speciesSel = document.getElementById("filter-species");
    if (speciesSel) {
        for (const opt of speciesSel.options) {
            opt.selected = APP.filters.chemicalSpecies.has(opt.value);
        }
    }

    document.querySelectorAll(".category-chip").forEach((chip) => {
        const cat = chip.dataset.cat;
        chip.classList.toggle("selected", cat === "__all__" ? APP.filters.categories == null : APP.filters.categories?.has(cat));
    });

    document.querySelectorAll(".pt-cell.active").forEach(c => c.classList.remove("active"));
    document.querySelectorAll(".pt-cell").forEach(cell => {
        const sym = cell.querySelector(".pt-sym")?.textContent;
        if (sym && APP.filters.elements.has(sym)) cell.classList.add("active");
    });
}

function applyModeUI() {
    const advanced = document.getElementById("filter-advanced");
    const palette = document.getElementById("widget-palette");
    const modeWrap = document.getElementById("mode-toggle-wrap");
    if (advanced) advanced.classList.toggle("hidden", APP.simpleMode);
    if (palette) palette.classList.toggle("simple-hidden", APP.simpleMode);
    if (modeWrap) modeWrap.classList.remove("hidden");
}

function initModeToggle() {
    try {
        const stored = localStorage.getItem(CONFIG.MODE_KEY);
        APP.simpleMode = stored !== "advanced";
    } catch (e) { }
    const cb = document.getElementById("mode-advanced");
    if (cb) {
        cb.checked = !APP.simpleMode;
        cb.addEventListener("change", () => {
            APP.simpleMode = !cb.checked;
            try { localStorage.setItem(CONFIG.MODE_KEY, APP.simpleMode ? "simple" : "advanced"); } catch (e) { }
            if (APP.simpleMode) {
                const df = getDefaultFilters();
                APP.filters = { ...df, chemicalSpecies: new Set(df.chemicalSpecies), elements: new Set(df.elements) };
                syncFilterControlsFromState();
                updateTimeLabels();
                applyFilters();
            }
            applyModeUI();
        });
    }
}

function initFilters() {
    buildCategoryChips();

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

    const speciesSel = document.getElementById("filter-species");
    speciesSel?.addEventListener("change", () => {
        const selected = [...speciesSel.selectedOptions].map(o => o.value).filter(v => v !== "__none__");
        APP.filters.chemicalSpecies = new Set(selected);
        applyFilters();
    });

    document.getElementById("btn-reset-filters").addEventListener("click", () => {
        const defaults = getDefaultFilters();
        APP.filters = {
            categories: defaults.categories,
            chemicalSpecies: new Set(defaults.chemicalSpecies),
            timeMin: defaults.timeMin, timeMax: defaults.timeMax,
            rsatMin: defaults.rsatMin, rsatMax: defaults.rsatMax,
            incMin: defaults.incMin, incMax: defaults.incMax,
            confidence: defaults.confidence,
            elements: new Set(defaults.elements),
        };
        syncFilterControlsFromState();
        updateTimeLabels();
        applyFilters();
    });
}

function updateTimeLabels() {
    const tMinEl = document.getElementById("filter-time-min");
    const tMaxEl = document.getElementById("filter-time-max");
    const tMinL = document.getElementById("filter-time-min-label");
    const tMaxL = document.getElementById("filter-time-max-label");
    if (tMinEl && tMinL) tMinL.textContent = etToDateStr(APP.etMin + parseFloat(tMinEl.value) * (APP.etMax - APP.etMin));
    if (tMaxEl && tMaxL) tMaxL.textContent = etToDateStr(APP.etMin + parseFloat(tMaxEl.value) * (APP.etMax - APP.etMin));
}

// ---- Download / Export ----
function escapeCsv(val) {
    if (val === null || val === undefined) return "";
    const s = String(val);
    if (s.includes(",") || s.includes('"') || s.includes("\n")) return '"' + s.replace(/"/g, '""') + '"';
    return s;
}

function downloadFilteredMetadata() {
    const m = APP.meta;
    if (!m) return;
    const cols = Object.keys(m).filter(k => k !== "_row_count");
    const header = cols.join(",");
    const rows = [header];
    for (const i of APP.filteredIndices) {
        const cells = cols.map(c => {
            const v = m[c][i];
            if (Array.isArray(v)) return escapeCsv(v.join(";"));
            return escapeCsv(v);
        });
        rows.push(cells.join(","));
    }
    const blob = new Blob([rows.join("\n")], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `cassini_metadata_filtered_${APP.filteredIndices.length}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
}

function downloadSelectedSpectrum() {
    if (!APP.selectedSpectrum || APP.selectedIdx < 0) return;
    const m = APP.meta;
    const row = {};
    if (m) {
        for (const k of Object.keys(m)) if (k !== "_row_count") row[k] = m[k][APP.selectedIdx];
    }
    const data = { row_index: APP.selectedIdx, metadata: row, spectrum: APP.selectedSpectrum };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `spectrum_${APP.selectedIdx}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
}

async function downloadFilteredSpectra() {
    const indices = APP.filteredIndices;
    if (indices.length === 0) return;
    const btn = document.getElementById("btn-download-spectra");
    if (btn) btn.disabled = true;
    const BATCH = 50;
    const allSpectra = {};
    try {
        for (let i = 0; i < indices.length; i += BATCH) {
            const chunk = indices.slice(i, i + BATCH);
            const resp = await fetch("/api/spectra_batch", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ indices: chunk }),
            });
            const data = await resp.json();
            for (let j = 0; j < data.indices.length; j++) {
                allSpectra[data.indices[j]] = data.spectra[j] ?? [];
            }
        }
        const m = APP.meta;
        const metadataRows = [];
        if (m) {
            const cols = Object.keys(m).filter(k => k !== "_row_count");
            for (const i of indices) {
                const row = { row_index: i };
                for (const k of cols) row[k] = m[k][i];
                metadataRows.push(row);
            }
        }
        const exportData = { indices, spectra: allSpectra, metadata: metadataRows };
        const blob = new Blob([JSON.stringify(exportData)], { type: "application/json" });
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = `cassini_spectra_filtered_${indices.length}.json`;
        a.click();
        URL.revokeObjectURL(a.href);
    } finally {
        if (btn) btn.disabled = false;
    }
}

function initDownloadButtons() {
    document.getElementById("btn-download-metadata")?.addEventListener("click", downloadFilteredMetadata);
    document.getElementById("btn-download-selected")?.addEventListener("click", downloadSelectedSpectrum);
    document.getElementById("btn-download-spectra")?.addEventListener("click", downloadFilteredSpectra);
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

        loadConfigOverrides();
        initModeToggle();
        if (APP.simpleMode) {
            const df = getDefaultFilters();
            APP.filters = { ...df, chemicalSpecies: new Set(df.chemicalSpecies), elements: new Set(df.elements) };
        }
        applyModeUI();
        initFilters();
        syncFilterControlsFromState();
        initDownloadButtons();
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
