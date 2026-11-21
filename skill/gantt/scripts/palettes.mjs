// Built-in palettes. Each phase takes the next color; more phases than colors cycle.
export const PALETTES = [
  { id: "bloom",  name: "Bloom",  note: "Bright and friendly",        colors: ["#e5487f", "#4fae5c", "#ef8a3a", "#7867e0"], today: "#4b44c8" },
  { id: "harbor", name: "Harbor", note: "Calm blues and sand",        colors: ["#2a7fa8", "#2aa198", "#d9a43b", "#d0644f"], today: "#1d3d5c" },
  { id: "studio", name: "Studio", note: "Muted, editorial",           colors: ["#3f6f73", "#8a6a35", "#4b5d8f", "#87495a"], today: "#b4442f" },
  { id: "citrus", name: "Citrus", note: "High energy for kickoffs",   colors: ["#f2613f", "#f5a524", "#3fb489", "#3d7be0"], today: "#22232a" },
  { id: "ink",    name: "Ink",    note: "One accent, print friendly", colors: ["#22232a", "#4f5160", "#7c7f8f", "#a8abb9"], today: "#e5487f" },
];

const HEX = /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i;
export const isHex = (s) => HEX.test(String(s).trim());

// Accepts a palette id, or {colors:[...], today?}. Returns a normalized value or throws.
export function normalizePalette(p) {
  if (p === undefined || p === null || p === "") return "bloom";
  if (typeof p === "string") {
    if (PALETTES.some((x) => x.id === p)) return p;
    throw new Error(`Unknown palette "${p}". Use one of: ${PALETTES.map((x) => x.id).join(", ")}, or {"colors": ["#hex", ...]}.`);
  }
  if (typeof p === "object" && Array.isArray(p.colors) && p.colors.length) {
    const bad = p.colors.filter((c) => !isHex(c));
    if (bad.length) throw new Error(`Palette colors must be hex codes like #0b5fff. Bad: ${bad.join(", ")}`);
    if (p.today && !isHex(p.today)) throw new Error(`Palette "today" must be a hex code. Got: ${p.today}`);
    return { name: p.name || "Custom", colors: p.colors.map((c) => c.trim()), today: (p.today || "#22232a").trim() };
  }
  throw new Error('Palette must be an id string or {"colors": ["#hex", ...], "today": "#hex"}.');
}
