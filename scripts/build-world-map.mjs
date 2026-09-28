// Builds public/data/world.json: projected country outlines for the visitor map,
// plus a centroid for every country so small places (Hong Kong, Macao, Singapore)
// that have no outline at this scale can still be drawn as a dot.
//
// Run with: node scripts/build-world-map.mjs  (only needed when the map design changes)

import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { feature } from 'topojson-client';
import { geoEqualEarth, geoPath, geoCentroid } from 'd3-geo';
import countries from 'i18n-iso-countries';

const require = createRequire(import.meta.url);
countries.registerLocale(require('i18n-iso-countries/langs/en.json'));
countries.registerLocale(require('i18n-iso-countries/langs/zh.json'));

const WIDTH = 1000;
const HEIGHT = 470;

const topo110 = require('world-atlas/countries-110m.json');
const topo50 = require('world-atlas/countries-50m.json');

const land110 = feature(topo110, topo110.objects.countries).features.filter((f) => f.id !== '010'); // drop Antarctica
const land50 = feature(topo50, topo50.objects.countries).features.filter((f) => f.id !== '010');

const projection = geoEqualEarth().fitExtent([[4, 4], [WIDTH - 4, HEIGHT - 4]], { type: 'FeatureCollection', features: land110 });
const pathGen = geoPath(projection).digits(1);

// Short, neutral display names where the ISO names are long or formal.
const NAME_OVERRIDES = {
  en: {
    CN: 'China', US: 'United States', GB: 'United Kingdom', KR: 'South Korea', KP: 'North Korea', RU: 'Russia', TW: 'Taiwan',
    HK: 'Hong Kong SAR', MO: 'Macao SAR', VN: 'Vietnam', LA: 'Laos', IR: 'Iran', SY: 'Syria', BO: 'Bolivia',
    VE: 'Venezuela', TZ: 'Tanzania', MD: 'Moldova', CZ: 'Czechia', CD: 'DR Congo', CG: 'Congo', BN: 'Brunei',
    PS: 'Palestine', FM: 'Micronesia', MK: 'North Macedonia',
  },
  zh: { TW: '中国台湾', HK: '中国香港', MO: '中国澳门', EH: '西撒哈拉' },
};

function alpha2(feature) {
  const numeric = String(feature.id ?? '').padStart(3, '0');
  return countries.numericToAlpha2(numeric) || null;
}

function names(code, fallback) {
  return {
    en: NAME_OVERRIDES.en[code] || countries.getName(code, 'en') || fallback,
    zh: NAME_OVERRIDES.zh[code] || countries.getName(code, 'zh') || countries.getName(code, 'en') || fallback,
  };
}

const shapes = [];
for (const f of land110) {
  const code = alpha2(f);
  const d = pathGen(f);
  if (!d) continue;
  shapes.push({ code: code || `N${f.id}`, name: names(code, f.properties?.name || ''), d });
}

const centroids = {};
for (const f of land50) {
  const code = alpha2(f);
  if (!code) continue;
  const point = projection(geoCentroid(f));
  if (!point || !Number.isFinite(point[0])) continue;
  centroids[code] = { x: Math.round(point[0] * 10) / 10, y: Math.round(point[1] * 10) / 10, name: names(code, f.properties?.name || code) };
}

const outDir = path.join(process.cwd(), 'public', 'data');
fs.mkdirSync(outDir, { recursive: true });
const out = { width: WIDTH, height: HEIGHT, shapes, centroids };
fs.writeFileSync(path.join(outDir, 'world.json'), JSON.stringify(out));
const hasOutline = new Set(shapes.map((s) => s.code));
const dotsOnly = Object.keys(centroids).filter((c) => !hasOutline.has(c));
console.log(`shapes: ${shapes.length}, centroids: ${Object.keys(centroids).length}, dot-only places: ${dotsOnly.length}`);
console.log('dot-only sample:', dotsOnly.slice(0, 40).join(' '));
console.log(`size: ${(fs.statSync(path.join(outDir, 'world.json')).size / 1024).toFixed(1)} KB`);
