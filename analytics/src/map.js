// Static SVG world map of the site's visits, for places that cannot run scripts (the GitHub
// profile README). Same bins, colours and projection as the map on the website.

import world from '../../public/data/world.json';

const EDGES = [1, 3, 10, 30, 100];
const RAMP = ['#dc93a0', '#c56677', '#a93f53', '#8b1e2d', '#5e0f1b'];
const EMPTY = '#ebe7e3';
const SURFACE = '#fcfbf9';
const INK = '#211b1c';

const A1 = 1.340264;
const A2 = -0.081106;
const A3 = 0.000893;
const A4 = 0.003796;
const M = Math.sqrt(3) / 2;

function project(lon, lat) {
  const { scale, translate } = world.projection;
  const lambda = (lon * Math.PI) / 180;
  const phi = (lat * Math.PI) / 180;
  const l = Math.asin(M * Math.sin(phi));
  const l2 = l * l;
  const l6 = l2 * l2 * l2;
  const x = (lambda * Math.cos(l)) / (M * (A1 + 3 * A2 * l2 + l6 * (7 * A3 + 9 * A4 * l2)));
  const y = l * (A1 + A2 * l2 + l6 * (A3 + A4 * l2));
  return [translate[0] + scale * x, translate[1] - scale * y];
}

const bin = (v) => EDGES.reduce((b, edge, i) => (v >= edge ? i : b), -1);
const fill = (v) => (bin(v) < 0 ? EMPTY : RAMP[bin(v)]);
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

export function renderMapSvg(stats) {
  const byCountry = new Map((stats.countries || []).map((c) => [c.code, c.visitors]));
  const outlined = new Set(world.shapes.map((s) => s.code));
  const W = world.width;
  const mapH = world.height;
  const H = mapH + 46;

  const parts = [];
  parts.push(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="World map of visits to jackieyangjq.github.io">`);
  parts.push(`<rect width="${W}" height="${H}" rx="14" fill="${SURFACE}"/>`);
  for (const shape of world.shapes) {
    const v = byCountry.get(shape.code) || 0;
    const title = v > 0 ? `<title>${esc(shape.name.en)}: ${v}</title>` : '';
    parts.push(`<path d="${shape.d}" fill="${fill(v)}" stroke="${SURFACE}" stroke-width="0.6">${title}</path>`);
  }
  // Places too small to have an outline at this scale (Hong Kong, Macao, Singapore)
  for (const [code, v] of byCountry) {
    if (v > 0 && !outlined.has(code) && world.centroids[code]) {
      const c = world.centroids[code];
      parts.push(`<circle cx="${c.x}" cy="${c.y}" r="5.5" fill="${fill(v)}" stroke="${SURFACE}" stroke-width="2.5"><title>${esc(c.name.en)}: ${v}</title></circle>`);
    }
  }
  // City dots, sized by visits
  const cities = (stats.cities || []).filter((c) => Number.isFinite(c.lat) && Number.isFinite(c.lon) && c.visitors > 0);
  const maxCity = Math.max(1, ...cities.map((c) => c.visitors));
  for (const c of [...cities].sort((a, b) => b.visitors - a.visitors)) {
    const [x, y] = project(c.lon, c.lat);
    const r = 3 + 5 * Math.sqrt(c.visitors / maxCity);
    parts.push(`<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r.toFixed(1)}" fill="${INK}" fill-opacity="0.85" stroke="${SURFACE}" stroke-width="1.5"><title>${esc(c.city)}: ${c.visitors}</title></circle>`);
  }

  const visits = stats.totals?.visitors ?? 0;
  const countryCount = [...byCountry.values()].filter((v) => v > 0).length;
  const y = mapH + 28;
  const label = visits > 0
    ? `${visits.toLocaleString('en-GB')} ${visits === 1 ? 'visit' : 'visits'} from ${countryCount} ${countryCount === 1 ? 'country or region' : 'countries and regions'}`
    : 'Visit counting has just started';
  parts.push(`<text x="24" y="${y}" font-family="Inter, Helvetica, Arial, sans-serif" font-size="16" fill="#44403c">${esc(label)}</text>`);
  const keyLabels = ['1–2', '3–9', '10–29', '30–99', '100+'];
  let kx = W - 24 - keyLabels.length * 64;
  for (let i = 0; i < RAMP.length; i++) {
    parts.push(`<rect x="${kx}" y="${y - 12}" width="14" height="14" rx="3" fill="${RAMP[i]}"/>`);
    parts.push(`<text x="${kx + 20}" y="${y}" font-family="Inter, Helvetica, Arial, sans-serif" font-size="13" fill="#78716c">${keyLabels[i]}</text>`);
    kx += 64;
  }
  parts.push('</svg>');
  return parts.join('');
}
