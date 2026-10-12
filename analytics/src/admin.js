// The owner's private statistics page. It holds no data itself: it asks for the key once,
// keeps it in this browser only, and reads /recent.json with it. The overview (map, totals,
// daily visits, top places and sources) comes from /stats.json and /map.svg?lang=zh, which is
// inlined so that hovering over a country or city shows its visits. Times are UK time.

export const ADMIN_HTML = `<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>访问统计</title>
<style>
  :root { --bg:#fcfbf9; --ink:#211b1c; --muted:#78716c; --line:#e7e4e0; --accent:#8b1e2d; --surface:#ffffff; --track:#f0edea; }
  @media (prefers-color-scheme: dark) { :root { --bg:#141112; --ink:#f5f2f0; --muted:#a8a29e; --line:#332d2e; --accent:#e07a88; --surface:#1b1718; --track:#2b2526; } }
  * { box-sizing: border-box; }
  body { margin:0; background:var(--bg); color:var(--ink); font:14px/1.5 -apple-system, "PingFang SC", "Segoe UI", Helvetica, Arial, sans-serif; }
  main { max-width:1100px; margin:0 auto; padding:24px 16px 48px; }
  h1 { font:700 24px Georgia, "Songti SC", serif; margin:0 0 4px; }
  h2 { font:700 18px Georgia, "Songti SC", serif; margin:32px 0 12px; }
  h3 { font-size:13px; margin:0 0 10px; }
  p.note { color:var(--muted); margin:0 0 20px; }
  form { display:flex; gap:8px; margin-bottom:20px; flex-wrap:wrap; }
  input { flex:1; min-width:220px; padding:8px 10px; border:1px solid var(--line); border-radius:8px; background:var(--surface); color:var(--ink); }
  button { padding:8px 14px; border:0; border-radius:8px; background:var(--accent); color:#fff; font-weight:600; cursor:pointer; }
  .summary { display:flex; gap:12px; flex-wrap:wrap; margin-bottom:16px; }
  .tile { background:var(--surface); border:1px solid var(--line); border-radius:10px; padding:10px 14px; min-width:120px; }
  .tile b { display:block; font-size:22px; }
  .tile span { color:var(--muted); font-size:12px; }
  .card { background:var(--surface); border:1px solid var(--line); border-radius:10px; padding:14px; margin-bottom:16px; }
  .mapbox { position:relative; }
  .mapbox svg { display:block; width:100%; height:auto; border-radius:8px; }
  .mapbox [data-code] { cursor:default; }
  .mapbox path[data-code]:hover { stroke:#211b1c; stroke-width:1.2; }
  .mapbox circle[data-code]:hover { stroke:#211b1c; }
  .tip { position:absolute; pointer-events:none; background:#211b1c; color:#fcfbf9; font-size:12px; line-height:1.4; padding:6px 9px; border-radius:6px; white-space:nowrap; transform:translate(-50%, calc(-100% - 10px)); display:none; z-index:2; }
  .tip b { display:block; font-size:13px; }
  .bars { display:flex; align-items:flex-end; gap:3px; height:120px; border-bottom:1px solid var(--line); }
  .bars div { flex:1; background:var(--accent); border-radius:3px 3px 0 0; min-height:1px; }
  .bars div.zero { background:var(--line); }
  .axis { display:flex; justify-content:space-between; color:var(--muted); font-size:12px; margin-top:4px; }
  .lists { display:grid; grid-template-columns:repeat(auto-fit, minmax(240px, 1fr)); gap:16px; }
  .lists .card { margin:0; }
  ol { list-style:none; margin:0; padding:0; }
  li { margin-bottom:8px; }
  li .row { display:flex; justify-content:space-between; gap:12px; }
  li .row span:first-child { overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
  li .track { height:5px; background:var(--track); border-radius:3px; margin-top:3px; overflow:hidden; }
  li .track div { height:100%; background:var(--accent); border-radius:3px; }
  .wrap { overflow-x:auto; background:var(--surface); border:1px solid var(--line); border-radius:10px; }
  table { border-collapse:collapse; width:100%; }
  th, td { text-align:left; padding:8px 10px; border-bottom:1px solid var(--line); white-space:nowrap; }
  th { color:var(--muted); font-weight:600; font-size:12px; }
  tr.dl td { color:var(--accent); font-weight:600; }
  .muted { color:var(--muted); }
</style>
</head>
<body>
<main>
  <h1>访问统计</h1>
  <p class="note">只有你能看，网站上不再公开。每条记录只有时间、页面、来源、大致地点和所属网络（运营商、大学或公司），不含 IP 地址。时间按英国时间显示（夏令时自动切换）。</p>
  <form id="f"><input id="k" type="password" autocomplete="current-password" placeholder="输入访问密钥（只保存在这台设备的浏览器里）"><button>查看</button></form>
  <div id="out"></div>
</main>
<script>
const KEY = 'jy-admin-key';
const form = document.getElementById('f');
const input = document.getElementById('k');
const out = document.getElementById('out');
const saved = localStorage.getItem(KEY);
if (saved) { input.value = saved; load(saved); }
form.addEventListener('submit', (e) => { e.preventDefault(); const k = input.value.trim(); if (k) { localStorage.setItem(KEY, k); load(k); } });

const region = new Intl.DisplayNames(['zh-CN'], { type: 'region' });
const num = new Intl.NumberFormat('zh-CN');
function placeName(code) { try { return code ? region.of(code) : ''; } catch (err) { return code; } }
function day(iso) { return new Intl.DateTimeFormat('zh-CN', { timeZone: 'UTC', year: 'numeric', month: 'long', day: 'numeric' }).format(new Date(iso.slice(0, 10) + 'T00:00:00Z')); }
function shortDay(iso) { return iso.slice(5, 10).replace('-', '/'); }

function el(tag, cls, text) { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }
function cell(text, cls) { return el('td', cls, text == null || text === '' ? '–' : String(text)); }
function tiles(items) {
  const summary = el('div', 'summary');
  for (const [n, label] of items) { const t = el('div', 'tile'); t.append(el('b', null, n), el('span', null, label)); summary.append(t); }
  return summary;
}

function ranked(title, rows) {
  const box = el('div', 'card');
  box.append(el('h3', null, title));
  if (!rows.length) { box.append(el('p', 'muted', '–')); return box; }
  const max = Math.max(1, ...rows.map((r) => r.value));
  const list = el('ol');
  for (const r of rows) {
    const li = el('li');
    const row = el('div', 'row');
    row.append(el('span', null, r.label), el('span', 'muted', num.format(r.value)));
    const track = el('div', 'track');
    const bar = el('div'); bar.style.width = Math.max(3, (r.value / max) * 100) + '%';
    track.append(bar);
    li.append(row, track);
    list.append(li);
  }
  box.append(list);
  return box;
}

function overview(stats) {
  const frag = document.createDocumentFragment();
  const t = stats.totals || {};
  const countries = (stats.countries || []).filter((c) => c.visitors > 0);
  frag.append(el('h2', null, '总览' + (stats.since ? '（自 ' + day(stats.since) + ' 起）' : '')));
  frag.append(tiles([[num.format(t.visitors || 0), '访问'], [num.format(t.pageviews || 0), '浏览量'], [num.format(t.downloads || 0), '简历下载'], [num.format(countries.length), '国家和地区']]));

  frag.append(mapCard());

  const daily = stats.daily || [];
  if (daily.length) {
    const chart = el('div', 'card');
    chart.append(el('h3', null, '最近 30 天每日访问'));
    const bars = el('div', 'bars');
    const max = Math.max(1, ...daily.map((d) => d.visitors));
    for (const d of daily) {
      const b = el('div', d.visitors ? null : 'zero');
      b.style.height = (d.visitors / max) * 100 + '%';
      b.title = day(d.date) + '：' + d.visitors + ' 次访问';
      bars.append(b);
    }
    const axis = el('div', 'axis');
    axis.append(el('span', null, shortDay(daily[0].date)), el('span', null, '最多 ' + max + ' 次/天'), el('span', null, shortDay(daily[daily.length - 1].date)));
    chart.append(bars, axis);
    frag.append(chart);
  }

  const top = (rows) => (rows || []).filter((r) => r.visitors > 0).sort((a, b) => b.visitors - a.visitors).slice(0, 10);
  const lists = el('div', 'lists');
  lists.append(
    ranked('国家和地区', top(stats.countries).map((c) => ({ label: placeName(c.code), value: c.visitors }))),
    ranked('城市', top(stats.cities).map((c) => ({ label: c.city + ' · ' + placeName(c.country), value: c.visitors }))),
    ranked('来源', top(stats.referrers).map((r) => ({ label: r.domain || '直接访问或书签', value: r.visitors }))),
  );
  frag.append(lists);
  return frag;
}

// The map is fetched as SVG text and inlined (an <img> cannot react to the mouse). Each country
// and city dot carries data-code / data-city / data-v, which the tooltip reads.
function mapCard() {
  const card = el('div', 'card');
  const box = el('div', 'mapbox');
  const tip = el('div', 'tip');
  card.append(box);
  fetch('/map.svg?lang=zh', { cache: 'no-cache' }).then((r) => (r.ok ? r.text() : Promise.reject())).then((text) => {
    const svg = new DOMParser().parseFromString(text, 'image/svg+xml').documentElement;
    if (svg.nodeName !== 'svg') throw new Error('bad map');
    svg.querySelectorAll('title').forEach((t) => t.remove());
    svg.removeAttribute('width'); svg.removeAttribute('height');
    box.append(document.importNode(svg, true), tip);
    box.addEventListener('mousemove', (e) => {
      const target = e.target.closest ? e.target.closest('[data-code]') : null;
      if (!target) { tip.style.display = 'none'; return; }
      const v = Number(target.dataset.v) || 0;
      const city = target.dataset.city;
      tip.innerHTML = '';
      tip.append(el('b', null, city ? city + ' · ' + placeName(target.dataset.code) : placeName(target.dataset.code)), el('span', null, v ? num.format(v) + ' 次访问' : '暂无访问'));
      const rect = box.getBoundingClientRect();
      tip.style.left = (e.clientX - rect.left) + 'px';
      tip.style.top = (e.clientY - rect.top) + 'px';
      tip.style.display = 'block';
    });
    box.addEventListener('mouseleave', () => { tip.style.display = 'none'; });
  }).catch(() => { box.append(el('p', 'muted', '地图暂时无法读取。')); });
  return card;
}

async function load(key) {
  out.textContent = '加载中…';
  const res = await fetch('/recent.json', { headers: { authorization: 'Bearer ' + key } });
  if (!res.ok) { out.textContent = res.status === 401 ? '密钥不对。' : '暂时无法读取。'; return; }
  const { events } = await res.json();
  let stats = null;
  try { const s = await fetch('/stats.json', { cache: 'no-cache' }); if (s.ok) stats = await s.json(); } catch (err) {}
  const fmt = new Intl.DateTimeFormat('zh-CN', { timeZone: 'Europe/London', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false });
  const visits = events.filter((e) => e.new_visit).length;
  const downloads = events.filter((e) => e.kind === 'download').length;
  out.innerHTML = '';
  if (stats) out.append(overview(stats));
  else out.append(el('p', 'muted', '总览暂时无法读取。'));

  out.append(el('h2', null, '最近访问明细'));
  out.append(tiles([[events.length, '最近记录'], [visits, '其中新访问'], [downloads, '其中下载简历']]));
  const wrap = el('div', 'wrap');
  const table = el('table');
  const head = el('tr');
  for (const h of ['时间', '类型', '页面', '来源', '城市', '国家或地区', '网络', '语言']) head.append(el('th', null, h));
  table.append(head);
  for (const e of events) {
    const tr = el('tr', e.kind === 'download' ? 'dl' : null);
    tr.append(
      cell(fmt.format(new Date(e.ts))),
      cell(e.kind === 'download' ? '下载' : (e.new_visit ? '新访问' : '浏览')),
      cell(e.path),
      cell(e.referrer || (e.new_visit ? '直接访问' : ''), 'muted'),
      cell(e.city),
      cell(placeName(e.country)),
      cell(e.network, 'muted'),
      cell(e.lang === 'zh' ? '中文' : 'English', 'muted'),
    );
    table.append(tr);
  }
  wrap.append(table);
  out.append(wrap);
}
</script>
</body>
</html>`;
