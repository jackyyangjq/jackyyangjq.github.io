// Renders public/visitor-map.svg: a static world map of the website's visitors, for places
// that cannot run scripts (the GitHub profile README embeds it as an image).
// Reads public/data/world.json and public/data/visitors.json. Run before `next build`.

import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const world = JSON.parse(fs.readFileSync(path.join(root, 'public/data/world.json'), 'utf8'));
let stats = {};
try {
  stats = JSON.parse(fs.readFileSync(path.join(root, 'public/data/visitors.json'), 'utf8'));
} catch {
  stats = {};
}

// Same bins and light-mode ramp as the on-site map (src/app/globals.css)
const EDGES = [1, 3, 10, 30, 100];
const RAMP = ['#dc93a0', '#c56677', '#a93f53', '#8b1e2d', '#5e0f1b'];
const EMPTY = '#ebe7e3';
const SURFACE = '#fcfbf9';

const bin = (v) => EDGES.reduce((b, edge, i) => (v >= edge ? i : b), -1);
const fill = (v) => (bin(v) < 0 ? EMPTY : RAMP[bin(v)]);
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const byCountry = new Map((stats.countries || []).map((c) => [c.code, c.visitors]));
const outlined = new Set(world.shapes.map((s) => s.code));

const W = world.width;
const mapH = world.height;
const footer = 46;
const H = mapH + footer;

const parts = [];
parts.push(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="World map of visitors to jackieyangjq.github.io">`);
parts.push(`<rect width="${W}" height="${H}" rx="14" fill="${SURFACE}"/>`);
for (const shape of world.shapes) {
  const v = byCountry.get(shape.code) || 0;
  const title = v > 0 ? `<title>${esc(shape.name.en)}: ${v}</title>` : '';
  parts.push(`<path d="${shape.d}" fill="${fill(v)}" stroke="${SURFACE}" stroke-width="0.6">${title}</path>`);
}
for (const [code, v] of byCountry) {
  if (v > 0 && !outlined.has(code) && world.centroids[code]) {
    const c = world.centroids[code];
    parts.push(`<circle cx="${c.x}" cy="${c.y}" r="5.5" fill="${fill(v)}" stroke="${SURFACE}" stroke-width="2.5"><title>${esc(c.name.en)}: ${v}</title></circle>`);
  }
}

// Footer: totals on the left, colour key on the right
const visitors = stats.totals?.visitors ?? 0;
const countries = [...byCountry.values()].filter((v) => v > 0).length;
const y = mapH + 28;
const label = visitors > 0
  ? `${visitors.toLocaleString('en-GB')} visitors from ${countries} ${countries === 1 ? 'country or region' : 'countries and regions'}`
  : 'Visitor counting has just started';
parts.push(`<text x="24" y="${y}" font-family="Inter, Helvetica, Arial, sans-serif" font-size="16" fill="#44403c">${esc(label)}</text>`);
const keyLabels = ['1–2', '3–9', '10–29', '30–99', '100+'];
let kx = W - 24 - keyLabels.length * 64;
for (let i = 0; i < RAMP.length; i++) {
  parts.push(`<rect x="${kx}" y="${y - 12}" width="14" height="14" rx="3" fill="${RAMP[i]}"/>`);
  parts.push(`<text x="${kx + 20}" y="${y}" font-family="Inter, Helvetica, Arial, sans-serif" font-size="13" fill="#78716c">${keyLabels[i]}</text>`);
  kx += 64;
}
parts.push('</svg>');

fs.writeFileSync(path.join(root, 'public/visitor-map.svg'), parts.join(''));
console.log(`visitor-map.svg: ${visitors} visitors, ${countries} countries`);
