// The owner's private "recent visits" page. It holds no data itself: it asks for the key once,
// keeps it in this browser only, and reads /recent.json with it.

export const ADMIN_HTML = `<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>访问明细</title>
<style>
  :root { --bg:#fcfbf9; --ink:#211b1c; --muted:#78716c; --line:#e7e4e0; --accent:#8b1e2d; --surface:#ffffff; }
  @media (prefers-color-scheme: dark) { :root { --bg:#141112; --ink:#f5f2f0; --muted:#a8a29e; --line:#332d2e; --accent:#e07a88; --surface:#1b1718; } }
  * { box-sizing: border-box; }
  body { margin:0; background:var(--bg); color:var(--ink); font:14px/1.5 -apple-system, "PingFang SC", "Segoe UI", Helvetica, Arial, sans-serif; }
  main { max-width:1100px; margin:0 auto; padding:24px 16px 48px; }
  h1 { font:700 24px Georgia, "Songti SC", serif; margin:0 0 4px; }
  p.note { color:var(--muted); margin:0 0 20px; }
  form { display:flex; gap:8px; margin-bottom:20px; flex-wrap:wrap; }
  input { flex:1; min-width:220px; padding:8px 10px; border:1px solid var(--line); border-radius:8px; background:var(--surface); color:var(--ink); }
  button { padding:8px 14px; border:0; border-radius:8px; background:var(--accent); color:#fff; font-weight:600; cursor:pointer; }
  .summary { display:flex; gap:12px; flex-wrap:wrap; margin-bottom:16px; }
  .tile { background:var(--surface); border:1px solid var(--line); border-radius:10px; padding:10px 14px; min-width:120px; }
  .tile b { display:block; font-size:22px; }
  .tile span { color:var(--muted); font-size:12px; }
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
  <h1>访问明细</h1>
  <p class="note">只有你能看。每条记录只有时间、页面、来源、大致地点和所属网络（运营商、大学或公司），不含 IP 地址。时间按香港时间显示。</p>
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

function cell(text, cls) { const td = document.createElement('td'); td.textContent = text == null || text === '' ? '–' : String(text); if (cls) td.className = cls; return td; }

async function load(key) {
  out.textContent = '加载中…';
  const res = await fetch('/recent.json', { headers: { authorization: 'Bearer ' + key } });
  if (!res.ok) { out.textContent = res.status === 401 ? '密钥不对。' : '暂时无法读取。'; return; }
  const { events } = await res.json();
  const fmt = new Intl.DateTimeFormat('zh-CN', { timeZone: 'Asia/Hong_Kong', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false });
  const region = new Intl.DisplayNames(['zh-CN'], { type: 'region' });
  const visits = events.filter((e) => e.new_visit).length;
  const downloads = events.filter((e) => e.kind === 'download').length;
  out.innerHTML = '';
  const summary = document.createElement('div'); summary.className = 'summary';
  for (const [n, label] of [[events.length, '最近记录'], [visits, '其中新访问'], [downloads, '其中下载简历']]) {
    const t = document.createElement('div'); t.className = 'tile';
    const b = document.createElement('b'); b.textContent = n; const s = document.createElement('span'); s.textContent = label;
    t.append(b, s); summary.append(t);
  }
  out.append(summary);
  const wrap = document.createElement('div'); wrap.className = 'wrap';
  const table = document.createElement('table');
  const head = document.createElement('tr');
  for (const h of ['时间', '类型', '页面', '来源', '城市', '国家或地区', '网络', '语言']) { const th = document.createElement('th'); th.textContent = h; head.append(th); }
  table.append(head);
  for (const e of events) {
    const tr = document.createElement('tr');
    if (e.kind === 'download') tr.className = 'dl';
    let place = e.country; try { place = e.country ? region.of(e.country) : ''; } catch (err) {}
    tr.append(
      cell(fmt.format(new Date(e.ts))),
      cell(e.kind === 'download' ? '下载' : (e.new_visit ? '新访问' : '浏览')),
      cell(e.path),
      cell(e.referrer || (e.new_visit ? '直接访问' : ''), 'muted'),
      cell(e.city),
      cell(place),
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
