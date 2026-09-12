// Deterministic SVG art generator for demo imagery.
// Every tile is derived from a string seed so the same dish always renders the
// same artwork. Replace these with real photography from the admin panel.

export function rng(seed) {
  let h = 1779033703 ^ seed.length;
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(h ^ seed.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  let a = h >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const PALETTES = {
  starters: { bg: ["#2b1a12", "#120b08"], glow: "#f0a63a", food: ["#d9702f", "#e89b3c", "#b5411f"], garnish: "#5f9c46" },
  main: { bg: ["#31190f", "#150a06"], glow: "#e8802a", food: ["#c9541c", "#e0873a", "#8e2f13"], garnish: "#6aa64c" },
  breads: { bg: ["#2e2318", "#14100a"], glow: "#e8bd6a", food: ["#e0bb7a", "#c99a4e", "#a87a34"], garnish: "#7fa95c" },
  rice: { bg: ["#2a2014", "#100c07"], glow: "#f0c667", food: ["#e9dcc0", "#d8b878", "#b98b3f"], garnish: "#6e9f4a" },
  desserts: { bg: ["#241726", "#0e080f"], glow: "#e9a0b8", food: ["#e8c37a", "#f2ddb8", "#c97f52"], garnish: "#bf5f7f" },
  beverages: { bg: ["#12251f", "#06100d"], glow: "#6fd3a1", food: ["#f2c14e", "#e8e2c0", "#8fd6a8"], garnish: "#4f9e63" },
  ambience: { bg: ["#221610", "#0b0705"], glow: "#f0a63a", food: ["#d98f3a", "#8e5a2b", "#3c2a1e"], garnish: "#c9a24a" },
};

function defs(p, seed, r) {
  const rot = Math.floor(r() * 40) - 20;
  return `
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0.4" y2="1">
      <stop offset="0%" stop-color="${p.bg[0]}"/>
      <stop offset="100%" stop-color="${p.bg[1]}"/>
    </linearGradient>
    <radialGradient id="glow" cx="28%" cy="18%" r="72%">
      <stop offset="0%" stop-color="${p.glow}" stop-opacity="0.55"/>
      <stop offset="55%" stop-color="${p.glow}" stop-opacity="0.12"/>
      <stop offset="100%" stop-color="${p.glow}" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="plate" cx="42%" cy="36%" r="66%">
      <stop offset="0%" stop-color="#fbf4e8"/>
      <stop offset="72%" stop-color="#e6dbc9"/>
      <stop offset="100%" stop-color="#c4b49c"/>
    </radialGradient>
    <radialGradient id="vig" cx="50%" cy="45%" r="72%">
      <stop offset="60%" stop-color="#000" stop-opacity="0"/>
      <stop offset="100%" stop-color="#000" stop-opacity="0.55"/>
    </radialGradient>
    <filter id="grain" x="0" y="0" width="100%" height="100%">
      <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="3" seed="${Math.floor(r() * 100)}"/>
      <feColorMatrix type="saturate" values="0"/>
    </filter>
    <filter id="soft" x="-30%" y="-30%" width="160%" height="160%">
      <feGaussianBlur stdDeviation="14"/>
    </filter>
    <filter id="soft2" x="-30%" y="-30%" width="160%" height="160%">
      <feGaussianBlur stdDeviation="3"/>
    </filter>
    <filter id="tint" x="-10%" y="-10%" width="120%" height="120%">
      <feColorMatrix type="hueRotate" values="${(r() * 14 - 7).toFixed(1)}"/>
      <feComponentTransfer>
        <feFuncA type="identity"/>
      </feComponentTransfer>
    </filter>
    <g id="rot" transform="rotate(${rot})"></g>
  </defs>`;
}

function blob(cx, cy, radius, wobble, points, r) {
  const pts = [];
  for (let i = 0; i < points; i++) {
    const a = (i / points) * Math.PI * 2;
    const rad = radius * (1 - wobble / 2 + r() * wobble);
    pts.push([cx + Math.cos(a) * rad, cy + Math.sin(a) * rad]);
  }
  let d = `M ${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`;
  for (let i = 0; i < pts.length; i++) {
    const cur = pts[i];
    const next = pts[(i + 1) % pts.length];
    const mid = [(cur[0] + next[0]) / 2, (cur[1] + next[1]) / 2];
    d += ` Q ${cur[0].toFixed(1)} ${cur[1].toFixed(1)} ${mid[0].toFixed(1)} ${mid[1].toFixed(1)}`;
  }
  return d + " Z";
}

function garnishDots(cx, cy, spread, n, colors, r) {
  let out = "";
  for (let i = 0; i < n; i++) {
    const a = r() * Math.PI * 2;
    const d = spread * (0.35 + r() * 0.65);
    const x = cx + Math.cos(a) * d;
    const y = cy + Math.sin(a) * d * 0.85;
    const rad = 3 + r() * 7;
    out += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${rad.toFixed(1)}" fill="${colors[i % colors.length]}" opacity="${(0.55 + r() * 0.4).toFixed(2)}"/>`;
  }
  return out;
}

function leaf(x, y, s, rot, color) {
  return `<path transform="translate(${x} ${y}) rotate(${rot}) scale(${s})" d="M0 0 C 18 -14 42 -10 52 4 C 38 20 12 18 0 0 Z" fill="${color}" opacity="0.9"/>`;
}

function steam(cx, cy, r) {
  let out = "";
  for (let i = 0; i < 3; i++) {
    const x = cx - 60 + i * 60;
    out += `<path d="M${x} ${cy} c -22 -40 22 -60 0 -104 c -18 -34 14 -52 6 -78" stroke="#fff" stroke-opacity="${(0.12 + r() * 0.1).toFixed(2)}" stroke-width="${(8 + r() * 6).toFixed(1)}" fill="none" stroke-linecap="round" filter="url(#soft2)"/>`;
  }
  return out;
}

// --- dish tiles -------------------------------------------------------------

function curryBowl(w, h, p, r) {
  const cx = w * 0.5, cy = h * 0.54, rad = Math.min(w, h) * 0.33;
  return `
    <ellipse cx="${cx}" cy="${cy + rad * 0.9}" rx="${rad * 1.25}" ry="${rad * 0.3}" fill="#000" opacity="0.45" filter="url(#soft)"/>
    <circle cx="${cx}" cy="${cy}" r="${rad * 1.16}" fill="url(#plate)"/>
    <circle cx="${cx}" cy="${cy}" r="${rad * 1.16}" fill="none" stroke="${p.food[2]}" stroke-opacity="0.35" stroke-width="6"/>
    <circle cx="${cx}" cy="${cy}" r="${rad * 0.98}" fill="#2a1c12" opacity="0.5"/>
    <path d="${blob(cx, cy, rad * 0.92, 0.16, 11, r)}" fill="${p.food[0]}"/>
    <path d="${blob(cx, cy - rad * 0.06, rad * 0.7, 0.22, 9, r)}" fill="${p.food[1]}" opacity="0.92"/>
    <path d="${blob(cx - rad * 0.2, cy - rad * 0.2, rad * 0.34, 0.3, 8, r)}" fill="#fdf3e2" opacity="0.85"/>
    ${garnishDots(cx, cy, rad * 0.8, 12, [p.garnish, "#fff6e6", p.food[2]], r)}
    ${leaf(cx + rad * 0.15, cy - rad * 0.45, 0.5 + r() * 0.3, -18, p.garnish)}
    ${steam(cx, cy - rad, r)}`;
}

function tandooriPlatter(w, h, p, r) {
  const cx = w * 0.5, cy = h * 0.55, rad = Math.min(w, h) * 0.34;
  const pieces = 3 + Math.floor(r() * 4);
  let skewers = "";
  for (let i = 0; i < pieces; i++) {
    const x = cx - rad * 0.75 + (i * rad * 1.5) / Math.max(pieces - 1, 1);
    const yOff = (r() - 0.5) * 40;
    const wdt = 38 + r() * 26;
    const hgt = rad * (0.85 + r() * 0.6);
    skewers += `<rect x="${x - wdt / 2}" y="${cy - hgt / 2 + yOff}" width="${wdt}" height="${hgt}" rx="${wdt / 2}" fill="${p.food[i % 3]}" opacity="0.96"/>`;
    skewers += `<rect x="${x - wdt / 2}" y="${cy - hgt / 2 + yOff}" width="${wdt}" height="${hgt}" rx="${wdt / 2}" fill="none" stroke="#5c2410" stroke-opacity="0.5" stroke-width="3"/>`;
    skewers += `<circle cx="${x}" cy="${cy + yOff}" r="${5 + r() * 5}" fill="#3d1a0c" opacity="0.45"/>`;
  }
  return `
    <ellipse cx="${cx}" cy="${cy + rad * 0.95}" rx="${rad * 1.3}" ry="${rad * 0.3}" fill="#000" opacity="0.45" filter="url(#soft)"/>
    <circle cx="${cx}" cy="${cy}" r="${rad * 1.18}" fill="url(#plate)"/>
    <circle cx="${cx}" cy="${cy}" r="${rad * 1.0}" fill="#25170f" opacity="0.35"/>
    ${skewers}
    <path d="M${cx - rad * 0.9} ${cy + rad * 0.72} q ${rad * 0.9} ${rad * 0.28} ${rad * 1.8} 0" stroke="#c26a2a" stroke-width="14" fill="none" stroke-linecap="round" opacity="0.85"/>
    ${garnishDots(cx, cy + rad * 0.5, rad * 0.8, 9, [p.garnish, "#f6e3b8"], r)}
    ${leaf(cx - rad * 0.6, cy - rad * 0.6, 0.45, 22, p.garnish)}
    ${steam(cx, cy - rad * 0.9, r)}`;
}

function breadTile(w, h, p, r) {
  const cx = w * 0.5, cy = h * 0.54, rad = Math.min(w, h) * 0.32;
  let spots = "";
  for (let i = 0; i < 16; i++) {
    const a = r() * Math.PI * 2, d = rad * r() * 0.85;
    spots += `<ellipse cx="${(cx + Math.cos(a) * d).toFixed(1)}" cy="${(cy + Math.sin(a) * d * 0.8).toFixed(1)}" rx="${(6 + r() * 12).toFixed(1)}" ry="${(4 + r() * 8).toFixed(1)}" fill="#7a4a1c" opacity="${(0.25 + r() * 0.35).toFixed(2)}"/>`;
  }
  return `
    <ellipse cx="${cx}" cy="${cy + rad}" rx="${rad * 1.2}" ry="${rad * 0.26}" fill="#000" opacity="0.4" filter="url(#soft)"/>
    <path d="${blob(cx, cy, rad * 1.1, 0.18, 10, r)}" fill="${p.food[0]}"/>
    <path d="${blob(cx, cy, rad * 0.96, 0.2, 10, r)}" fill="${p.food[1]}" opacity="0.55"/>
    ${spots}
    <path d="M${cx - rad * 0.6} ${cy - rad * 0.1} q ${rad * 0.6} ${rad * 0.35} ${rad * 1.2} -${rad * 0.05}" stroke="#8a5a24" stroke-width="5" fill="none" opacity="0.4"/>
    <circle cx="${cx + rad * 0.5}" cy="${cy - rad * 0.55}" r="${rad * 0.16}" fill="#f6d99a" opacity="0.9"/>
    ${leaf(cx - rad * 0.85, cy + rad * 0.5, 0.4, -12, p.garnish)}`;
}

function riceTile(w, h, p, r) {
  const cx = w * 0.5, cy = h * 0.56, rad = Math.min(w, h) * 0.33;
  let grains = "";
  for (let i = 0; i < 70; i++) {
    const a = r() * Math.PI * 2, d = rad * 0.85 * Math.sqrt(r());
    const x = cx + Math.cos(a) * d, y = cy + Math.sin(a) * d * 0.82;
    grains += `<ellipse cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" rx="${(9 + r() * 5).toFixed(1)}" ry="${(3.5 + r() * 2).toFixed(1)}" transform="rotate(${(r() * 180).toFixed(0)} ${x.toFixed(1)} ${y.toFixed(1)})" fill="${r() > 0.78 ? p.food[2] : p.food[0]}" opacity="${(0.7 + r() * 0.3).toFixed(2)}"/>`;
  }
  return `
    <ellipse cx="${cx}" cy="${cy + rad * 0.95}" rx="${rad * 1.28}" ry="${rad * 0.3}" fill="#000" opacity="0.45" filter="url(#soft)"/>
    <circle cx="${cx}" cy="${cy}" r="${rad * 1.16}" fill="url(#plate)"/>
    <circle cx="${cx}" cy="${cy}" r="${rad * 1.0}" fill="#2a1c12" opacity="0.45"/>
    <path d="${blob(cx, cy, rad * 0.95, 0.12, 12, r)}" fill="${p.food[1]}" opacity="0.6"/>
    ${grains}
    ${garnishDots(cx, cy, rad * 0.7, 8, ["#b5411f", p.garnish, "#f0c05a"], r)}
    ${leaf(cx + rad * 0.35, cy - rad * 0.5, 0.42, 30, p.garnish)}
    ${steam(cx, cy - rad * 0.85, r)}`;
}

function dessertTile(w, h, p, r) {
  const cx = w * 0.5, cy = h * 0.56, rad = Math.min(w, h) * 0.3;
  let domes = "";
  for (let i = 0; i < 3; i++) {
    const x = cx - rad * 0.55 + i * rad * 0.55;
    const y = cy + (i % 2 === 0 ? 0 : -rad * 0.22);
    domes += `<circle cx="${x}" cy="${y}" r="${rad * 0.34}" fill="${p.food[i % 3]}"/>`;
    domes += `<circle cx="${x - rad * 0.1}" cy="${y - rad * 0.12}" r="${rad * 0.12}" fill="#fff" opacity="0.35"/>`;
  }
  return `
    <ellipse cx="${cx}" cy="${cy + rad * 0.95}" rx="${rad * 1.3}" ry="${rad * 0.28}" fill="#000" opacity="0.4" filter="url(#soft)"/>
    <circle cx="${cx}" cy="${cy}" r="${rad * 1.25}" fill="url(#plate)"/>
    <path d="${blob(cx, cy + rad * 0.2, rad * 0.95, 0.14, 10, r)}" fill="#d8a05c" opacity="0.5"/>
    ${domes}
    ${garnishDots(cx, cy, rad * 0.95, 10, ["#f7e7c4", p.garnish, "#b2648a"], r)}`;
}

function beverageTile(w, h, p, r) {
  const cx = w * 0.5, cy = h * 0.52, gw = Math.min(w, h) * 0.26, gh = Math.min(w, h) * 0.56;
  return `
    <ellipse cx="${cx}" cy="${cy + gh * 0.58}" rx="${gw * 1.1}" ry="${gw * 0.24}" fill="#000" opacity="0.45" filter="url(#soft)"/>
    <path d="M${cx - gw / 2} ${cy - gh / 2} L${cx + gw / 2} ${cy - gh / 2} L${cx + gw * 0.38} ${cy + gh / 2} L${cx - gw * 0.38} ${cy + gh / 2} Z" fill="#ffffff" opacity="0.16"/>
    <path d="M${cx - gw * 0.46} ${cy - gh * 0.22} L${cx + gw * 0.46} ${cy - gh * 0.22} L${cx + gw * 0.38} ${cy + gh / 2} L${cx - gw * 0.38} ${cy + gh / 2} Z" fill="${p.food[0]}"/>
    <path d="M${cx - gw * 0.46} ${cy - gh * 0.22} L${cx + gw * 0.46} ${cy - gh * 0.22} L${cx + gw * 0.42} ${cy - gh * 0.02} L${cx - gw * 0.42} ${cy - gh * 0.02} Z" fill="#fff" opacity="0.35"/>
    <path d="M${cx - gw / 2} ${cy - gh / 2} L${cx + gw / 2} ${cy - gh / 2} L${cx + gw * 0.38} ${cy + gh / 2} L${cx - gw * 0.38} ${cy + gh / 2} Z" fill="none" stroke="#fff" stroke-opacity="0.5" stroke-width="4"/>
    <rect x="${cx + gw * 0.1}" y="${cy - gh * 0.62}" width="10" height="${gh * 0.5}" rx="5" transform="rotate(12 ${cx} ${cy})" fill="#e8e2c0" opacity="0.8"/>
    ${leaf(cx - gw * 0.1, cy - gh * 0.34, 0.34, -30, p.garnish)}
    ${garnishDots(cx, cy + gh * 0.1, gw * 0.3, 6, ["#fff", p.food[1]], r)}`;
}

const KINDS = {
  starters: tandooriPlatter,
  main: curryBowl,
  breads: breadTile,
  rice: riceTile,
  desserts: dessertTile,
  beverages: beverageTile,
};

export function dishSvg(seed, kind = "main", w = 1200, h = 900) {
  const p = PALETTES[kind] || PALETTES.main;
  const r = rng(seed);
  const draw = KINDS[kind] || curryBowl;

  // Per-dish composition shift so two dishes in the same category never look
  // like the same photograph.
  const rotate = (r() * 16 - 8).toFixed(2);
  const scale = (0.88 + r() * 0.24).toFixed(3);
  const dx = ((r() - 0.5) * w * 0.12).toFixed(1);
  const dy = ((r() - 0.5) * h * 0.08).toFixed(1);
  const props = [
    r() > 0.45
      ? `<circle cx="${(w * (0.08 + r() * 0.12)).toFixed(0)}" cy="${(h * (0.78 + r() * 0.14)).toFixed(0)}" r="${(w * 0.06).toFixed(0)}" fill="#000" opacity="0.35"/>`
      : "",
    r() > 0.55
      ? `<ellipse cx="${(w * (0.8 + r() * 0.12)).toFixed(0)}" cy="${(h * 0.8).toFixed(0)}" rx="${(w * 0.09).toFixed(0)}" ry="${(h * 0.05).toFixed(0)}" fill="${p.food[2]}" opacity="0.28" filter="url(#soft)"/>`
      : "",
  ].join("");

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  ${defs(p, seed, r)}
  <rect width="${w}" height="${h}" fill="url(#bg)"/>
  <rect width="${w}" height="${h}" fill="url(#glow)"/>
  <g opacity="0.5">
    <path d="M0 ${h * 0.72} Q ${w * 0.5} ${h * 0.62} ${w} ${h * 0.76} L${w} ${h} L0 ${h} Z" fill="#000" opacity="0.35"/>
  </g>
  ${props}
  <g filter="url(#tint)">
    <g transform="translate(${dx} ${dy}) rotate(${rotate} ${w / 2} ${h / 2}) translate(${(w / 2).toFixed(1)} ${(h / 2).toFixed(1)}) scale(${scale}) translate(${(-w / 2).toFixed(1)} ${(-h / 2).toFixed(1)})">
      ${draw(w, h, p, r)}
    </g>
  </g>
  <rect width="${w}" height="${h}" fill="url(#vig)"/>
  <rect width="${w}" height="${h}" filter="url(#grain)" opacity="0.12"/>
</svg>`;
}

// --- scenes (gallery / hero / about) ---------------------------------------

export function sceneSvg(seed, variant = "interior", w = 1400, h = 1000) {
  const p = PALETTES.ambience;
  const r = rng(seed);
  let scene = "";
  if (variant === "interior") {
    let lamps = "";
    for (let i = 0; i < 5; i++) {
      const x = w * (0.14 + i * 0.18);
      const drop = h * (0.12 + r() * 0.16);
      lamps += `<line x1="${x}" y1="0" x2="${x}" y2="${drop}" stroke="#3a291d" stroke-width="3"/>
        <path d="M${x - 46} ${drop + 54} L${x + 46} ${drop + 54} L${x + 26} ${drop} L${x - 26} ${drop} Z" fill="#c98a3c"/>
        <ellipse cx="${x}" cy="${drop + 60}" rx="30" ry="12" fill="#ffd89a" opacity="0.9"/>
        <circle cx="${x}" cy="${drop + 70}" r="120" fill="#ffc46b" opacity="0.12" filter="url(#soft)"/>`;
    }
    scene = `
      <rect y="${h * 0.62}" width="${w}" height="${h * 0.38}" fill="#2a1a11"/>
      ${Array.from({ length: 3 }, (_, i) => {
        const x = w * (0.16 + i * 0.34);
        return `<rect x="${x - 110}" y="${h * 0.66}" width="220" height="16" rx="8" fill="#6b4423"/>
                <rect x="${x - 90}" y="${h * 0.68}" width="180" height="${h * 0.2}" fill="#3a281b" opacity="0.8"/>
                <circle cx="${x - 40}" cy="${h * 0.645}" r="18" fill="#e8dcc8" opacity="0.9"/>
                <circle cx="${x + 40}" cy="${h * 0.645}" r="14" fill="#d9c7a8" opacity="0.8"/>`;
      }).join("")}
      ${lamps}
      <rect x="${w * 0.05}" y="${h * 0.1}" width="${w * 0.9}" height="${h * 0.45}" fill="none" stroke="#4a3524" stroke-width="8" opacity="0.5"/>`;
  } else if (variant === "kitchen") {
    scene = `
      <rect y="${h * 0.58}" width="${w}" height="${h * 0.42}" fill="#241812"/>
      <circle cx="${w * 0.5}" cy="${h * 0.6}" r="${h * 0.26}" fill="#1a0f08"/>
      <circle cx="${w * 0.5}" cy="${h * 0.6}" r="${h * 0.2}" fill="#e2611f" opacity="0.9"/>
      <circle cx="${w * 0.5}" cy="${h * 0.6}" r="${h * 0.13}" fill="#f6b545" opacity="0.95"/>
      <circle cx="${w * 0.5}" cy="${h * 0.6}" r="${h * 0.42}" fill="#ff9a3c" opacity="0.18" filter="url(#soft)"/>
      ${steam(w * 0.5, h * 0.42, r)}
      ${Array.from({ length: 6 }, (_, i) => `<rect x="${w * (0.1 + i * 0.14)}" y="${h * 0.16}" width="12" height="${h * 0.22}" rx="6" fill="#5a4128"/><circle cx="${w * (0.1 + i * 0.14) + 6}" cy="${h * 0.4}" r="26" fill="#8a6a3a" opacity="0.8"/>`).join("")}`;
  } else if (variant === "events") {
    scene = `
      <rect y="${h * 0.66}" width="${w}" height="${h * 0.34}" fill="#2b1c12"/>
      ${Array.from({ length: 22 }, () => {
        const x = r() * w, y = r() * h * 0.6;
        return `<circle cx="${x.toFixed(0)}" cy="${y.toFixed(0)}" r="${(2 + r() * 5).toFixed(1)}" fill="#ffd89a" opacity="${(0.3 + r() * 0.6).toFixed(2)}"/>`;
      }).join("")}
      <path d="M0 ${h * 0.2} Q ${w * 0.25} ${h * 0.3} ${w * 0.5} ${h * 0.18} T ${w} ${h * 0.24}" stroke="#c9a24a" stroke-width="4" fill="none" opacity="0.7"/>
      ${Array.from({ length: 9 }, (_, i) => `<path d="M${w * (0.06 + i * 0.11)} ${h * 0.21} l 26 0 l -13 44 Z" fill="${["#d0453f", "#f2a71b", "#1f8a4c"][i % 3]}" opacity="0.85"/>`).join("")}
      <ellipse cx="${w * 0.5}" cy="${h * 0.78}" rx="${w * 0.3}" ry="${h * 0.09}" fill="#6b4423"/>
      <ellipse cx="${w * 0.5}" cy="${h * 0.75}" rx="${w * 0.26}" ry="${h * 0.07}" fill="#8a5a2c"/>`;
  } else {
    // exterior / street
    scene = `
      <rect y="${h * 0.7}" width="${w}" height="${h * 0.3}" fill="#1b120c"/>
      <rect x="${w * 0.08}" y="${h * 0.28}" width="${w * 0.84}" height="${h * 0.42}" fill="#2e2016"/>
      <rect x="${w * 0.08}" y="${h * 0.28}" width="${w * 0.84}" height="${h * 0.1}" fill="#8e2f13"/>
      ${Array.from({ length: 4 }, (_, i) => `<rect x="${w * (0.16 + i * 0.19)}" y="${h * 0.44}" width="${w * 0.12}" height="${h * 0.22}" rx="${w * 0.06}" fill="#f6b545" opacity="0.8"/>`).join("")}
      <circle cx="${w * 0.5}" cy="${h * 0.33}" r="${h * 0.3}" fill="#ffb45c" opacity="0.14" filter="url(#soft)"/>`;
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  ${defs(p, seed, r)}
  <rect width="${w}" height="${h}" fill="url(#bg)"/>
  <rect width="${w}" height="${h}" fill="url(#glow)"/>
  ${scene}
  <rect width="${w}" height="${h}" fill="url(#vig)"/>
  <rect width="${w}" height="${h}" filter="url(#grain)" opacity="0.12"/>
</svg>`;
}

export function heroSvg(w = 2000, h = 1200) {
  const r = rng("hero-muchhad");
  const p = PALETTES.main;
  let sparks = "";
  for (let i = 0; i < 40; i++) {
    sparks += `<circle cx="${(r() * w).toFixed(0)}" cy="${(r() * h * 0.8).toFixed(0)}" r="${(1 + r() * 3).toFixed(1)}" fill="#ffce7a" opacity="${(0.15 + r() * 0.5).toFixed(2)}"/>`;
  }
  const bowls = [
    [w * 0.28, h * 0.62, h * 0.2, "#c9541c"],
    [w * 0.52, h * 0.72, h * 0.15, "#e0873a"],
    [w * 0.72, h * 0.6, h * 0.17, "#8e2f13"],
  ]
    .map(
      ([cx, cy, rad, col]) => `
      <ellipse cx="${cx}" cy="${cy + rad * 0.95}" rx="${rad * 1.25}" ry="${rad * 0.28}" fill="#000" opacity="0.5" filter="url(#soft)"/>
      <circle cx="${cx}" cy="${cy}" r="${rad * 1.12}" fill="url(#plate)"/>
      <circle cx="${cx}" cy="${cy}" r="${rad * 0.95}" fill="#241509" opacity="0.45"/>
      <path d="${blob(cx, cy, rad * 0.88, 0.15, 11, r)}" fill="${col}"/>
      ${garnishDots(cx, cy, rad * 0.7, 9, ["#6aa64c", "#fdf3e2", "#f2a71b"], r)}
      ${steam(cx, cy - rad, r)}`,
    )
    .join("");

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  ${defs(p, "hero", r)}
  <rect width="${w}" height="${h}" fill="url(#bg)"/>
  <rect width="${w}" height="${h}" fill="url(#glow)"/>
  ${sparks}
  <path d="M0 ${h * 0.78} Q ${w * 0.5} ${h * 0.68} ${w} ${h * 0.82} L${w} ${h} L0 ${h} Z" fill="#0d0705" opacity="0.6"/>
  ${bowls}
  <rect width="${w}" height="${h}" fill="url(#vig)"/>
  <rect width="${w}" height="${h}" filter="url(#grain)" opacity="0.1"/>
</svg>`;
}
