// Cookie-free visit counter for jackyyangjq.github.io.
//
//   POST /v            beacon from the site: { p: path, r: document.referrer, n: 1 if a new visit, t: 'view'|'download', l: 'en'|'zh' }
//   GET  /stats.json   public aggregates for the visitor map (no individual visits)
//   GET  /map.svg      the same map as an image, for the GitHub profile README
//   GET  /admin        the owner's private page; reads /recent.json with a key
//
// Location comes from Cloudflare's own IP geolocation (request.cf). The IP address and the
// browser's user agent are never stored.

import { renderMapSvg } from './map.js';
import { ADMIN_HTML } from './admin.js';

const SITE_ORIGIN = 'https://jackyyangjq.github.io';
const SITE_HOST = 'jackyyangjq.github.io';
const BOT_UA = /bot|crawl|spider|slurp|headless|preview|lighthouse|pingdom|monitor|facebookexternalhit|embedly|curl|wget|python|httpclient|go-http|java\//i;

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    try {
      if (request.method === 'OPTIONS') return preflight();
      if (url.pathname === '/v' && request.method === 'POST') return await recordVisit(request, env);
      if (url.pathname === '/stats.json' && request.method === 'GET') return json(await getStats(env), 300);
      if (url.pathname === '/map.svg' && request.method === 'GET') {
        const svg = renderMapSvg(await getStats(env));
        return new Response(svg, {
          headers: {
            'content-type': 'image/svg+xml; charset=utf-8',
            'cache-control': 'public, max-age=3600',
            'access-control-allow-origin': '*',
          },
        });
      }
      if (url.pathname === '/recent.json' && request.method === 'GET') return await getRecent(request, env);
      if (url.pathname === '/admin') {
        return new Response(ADMIN_HTML, {
          headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store', 'x-robots-tag': 'noindex' },
        });
      }
      if (url.pathname === '/') return Response.redirect(`${SITE_ORIGIN}/visitors/`, 302);
      return new Response('Not found', { status: 404 });
    } catch (error) {
      console.error(error);
      return new Response('Server error', { status: 500 });
    }
  },

  async scheduled(event, env) {
    await env.DB.prepare("DELETE FROM events WHERE ts < strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-400 days')").run();
  },
};

function preflight() {
  return new Response(null, {
    status: 204,
    headers: {
      'access-control-allow-origin': '*',
      'access-control-allow-methods': 'GET, POST, OPTIONS',
      'access-control-allow-headers': 'authorization, content-type',
      'access-control-max-age': '86400',
    },
  });
}

function json(data, maxAge = 0, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': maxAge > 0 ? `public, max-age=${maxAge}` : 'no-store',
      'access-control-allow-origin': '*',
    },
  });
}

function cleanPath(value) {
  if (typeof value !== 'string' || !value.startsWith('/')) return null;
  const path = value.split(/[?#]/)[0].slice(0, 200);
  return /^[\w\-./%~]*$/.test(path) ? path : null;
}

function referrerDomain(value) {
  if (typeof value !== 'string' || !value) return null;
  try {
    const host = new URL(value).hostname.toLowerCase().replace(/^www\./, '').replace(/^m\./, '');
    if (!host || host === SITE_HOST || host === 'localhost') return null;
    return host.slice(0, 100);
  } catch {
    return null;
  }
}

function roundCoord(value) {
  const n = Number.parseFloat(value);
  return Number.isFinite(n) ? Math.round(n * 100) / 100 : null;
}

async function recordVisit(request, env) {
  // Only count beacons sent by pages on the site itself
  const origin = request.headers.get('origin') || '';
  if (origin !== SITE_ORIGIN) return new Response(null, { status: 403 });
  if (BOT_UA.test(request.headers.get('user-agent') || '')) return new Response(null, { status: 204 });

  const raw = await request.text();
  if (raw.length > 2000) return new Response(null, { status: 413 });
  let body;
  try {
    body = JSON.parse(raw);
  } catch {
    return new Response(null, { status: 400 });
  }

  const path = cleanPath(body.p);
  if (!path) return new Response(null, { status: 400 });
  const kind = body.t === 'download' ? 'download' : 'view';
  const newVisit = kind === 'view' && body.n === 1 ? 1 : 0;
  const referrer = newVisit ? referrerDomain(body.r) : null;
  const lang = body.l === 'zh' ? 'zh' : 'en';

  const cf = request.cf || {};
  const country = typeof cf.country === 'string' && /^[A-Z]{2}$/.test(cf.country) && cf.country !== 'T1' ? cf.country : null;
  const city = typeof cf.city === 'string' && cf.city ? cf.city.slice(0, 80) : null;
  const region = typeof cf.region === 'string' && cf.region ? cf.region.slice(0, 80) : null;
  const lat = roundCoord(cf.latitude);
  const lon = roundCoord(cf.longitude);
  // Name of the network the visit came from (an ISP, university or company); shown only in the private log
  const network = typeof cf.asOrganization === 'string' && cf.asOrganization ? cf.asOrganization.slice(0, 80) : null;

  const ts = new Date().toISOString();
  const day = ts.slice(0, 10);

  const statements = [
    env.DB.prepare('INSERT INTO events (ts, kind, path, referrer, country, region, city, network, new_visit, lang) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
      .bind(ts, kind, path, referrer, country, region, city, network, newVisit, lang),
    env.DB.prepare(
      `INSERT INTO daily (day, visits, pageviews, downloads) VALUES (?, ?, ?, ?)
       ON CONFLICT(day) DO UPDATE SET visits = visits + excluded.visits, pageviews = pageviews + excluded.pageviews, downloads = downloads + excluded.downloads`,
    ).bind(day, newVisit, kind === 'view' ? 1 : 0, kind === 'download' ? 1 : 0),
  ];
  if (newVisit) {
    if (country) {
      statements.push(
        env.DB.prepare('INSERT INTO countries (code, visits) VALUES (?, 1) ON CONFLICT(code) DO UPDATE SET visits = visits + 1').bind(country),
      );
    }
    if (city && country) {
      statements.push(
        env.DB.prepare(
          `INSERT INTO cities (city, country, lat, lon, visits) VALUES (?, ?, ?, ?, 1)
           ON CONFLICT(city, country) DO UPDATE SET visits = visits + 1, lat = COALESCE(cities.lat, excluded.lat), lon = COALESCE(cities.lon, excluded.lon)`,
        ).bind(city, country, lat, lon),
      );
    }
    statements.push(
      env.DB.prepare('INSERT INTO referrers (domain, visits) VALUES (?, 1) ON CONFLICT(domain) DO UPDATE SET visits = visits + 1').bind(referrer || ''),
    );
  }
  await env.DB.batch(statements);
  return new Response(null, { status: 204, headers: { 'access-control-allow-origin': SITE_ORIGIN } });
}

async function getStats(env) {
  const [totals, countries, cities, referrers, daily] = await env.DB.batch([
    env.DB.prepare('SELECT COALESCE(SUM(visits), 0) AS visits, COALESCE(SUM(pageviews), 0) AS pageviews, COALESCE(SUM(downloads), 0) AS downloads, MIN(day) AS since FROM daily'),
    env.DB.prepare('SELECT code, visits FROM countries WHERE visits > 0 ORDER BY visits DESC'),
    env.DB.prepare('SELECT city, country, lat, lon, visits FROM cities WHERE visits > 0 ORDER BY visits DESC LIMIT 100'),
    env.DB.prepare('SELECT domain, visits FROM referrers WHERE visits > 0 ORDER BY visits DESC LIMIT 20'),
    env.DB.prepare("SELECT day, visits FROM daily WHERE day >= date('now', '-29 days') ORDER BY day"),
  ]);

  const t = totals.results[0] || {};
  const byDay = new Map(daily.results.map((row) => [row.day, row.visits]));
  const days = [];
  const today = new Date();
  for (let i = 29; i >= 0; i--) {
    const d = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() - i)).toISOString().slice(0, 10);
    days.push({ date: d, visitors: byDay.get(d) || 0 });
  }

  return {
    generated_at: new Date().toISOString(),
    since: t.since || null,
    totals: { visitors: t.visits || 0, pageviews: t.pageviews || 0, downloads: t.downloads || 0 },
    countries: countries.results.map((row) => ({ code: row.code, visitors: row.visits })),
    cities: cities.results.map((row) => ({ city: row.city, country: row.country, lat: row.lat, lon: row.lon, visitors: row.visits })),
    referrers: referrers.results.map((row) => ({ domain: row.domain, visitors: row.visits })),
    daily: days,
  };
}

async function getRecent(request, env) {
  const auth = request.headers.get('authorization') || '';
  const key = auth.startsWith('Bearer ') ? auth.slice(7) : '';
  if (!env.ADMIN_KEY || key.length < 16 || !(await sameSecret(key, env.ADMIN_KEY))) {
    return json({ error: 'unauthorised' }, 0, 401);
  }
  const { results } = await env.DB.prepare(
    'SELECT ts, kind, path, referrer, country, region, city, network, new_visit, lang FROM events ORDER BY id DESC LIMIT 300',
  ).all();
  return json({ events: results }, 0);
}

// Constant-time comparison of two strings via their SHA-256 digests
async function sameSecret(a, b) {
  const enc = new TextEncoder();
  const [da, db] = await Promise.all([crypto.subtle.digest('SHA-256', enc.encode(a)), crypto.subtle.digest('SHA-256', enc.encode(b))]);
  const x = new Uint8Array(da);
  const y = new Uint8Array(db);
  let diff = 0;
  for (let i = 0; i < x.length; i++) diff |= x[i] ^ y[i];
  return diff === 0;
}
