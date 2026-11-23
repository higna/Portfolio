import { Injectable } from '@nestjs/common';

@Injectable()
export class HealthPageService {
  getHtml(): string {
    return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Health · Portfolio API</title>
  <style>
    :root{color-scheme:dark;--bg:#061710;--panel:#0d241a;--border:rgba(87,220,164,.2);--green:#5ee0a5;--muted:#a3b8ac;--text:#effbf4;--red:#fb7185;--amber:#fbbf24}
    *{box-sizing:border-box}body{margin:0;min-height:100vh;padding:30px 18px;background:radial-gradient(ellipse at 10% 0,rgba(52,211,153,.1),transparent 42%),var(--bg);font:15px/1.6 system-ui,-apple-system,sans-serif;color:var(--text)}main{max-width:900px;margin:auto}
    header{display:flex;justify-content:space-between;align-items:center;gap:14px;flex-wrap:wrap;margin-bottom:22px}h1{margin:0;font-size:28px;letter-spacing:-.03em}.sub{color:var(--muted);font-size:13px}.links{display:flex;gap:8px}.link,button{padding:9px 13px;border:1px solid var(--border);border-radius:9px;background:var(--panel);color:var(--text);text-decoration:none;font:600 13px system-ui;cursor:pointer}.link:hover,button:hover{border-color:var(--green)}
    .overall,.card{border:1px solid var(--border);border-radius:14px;background:rgba(13,36,26,.88)}.overall{display:flex;align-items:center;gap:16px;padding:22px;margin-bottom:14px}.orb{width:48px;height:48px;display:grid;place-items:center;border-radius:50%;background:rgba(94,224,165,.12)}.orb span{width:13px;height:13px;border-radius:50%;background:var(--green);box-shadow:0 0 16px var(--green)}.orb.error span{background:var(--red);box-shadow:0 0 16px var(--red)}.orb.loading span{background:var(--amber);box-shadow:0 0 16px var(--amber)}.status-label{font-size:11px;text-transform:uppercase;letter-spacing:.1em;color:var(--muted)}.status-value{font-size:22px;font-weight:700}.status-meta{font:12px ui-monospace,monospace;color:var(--muted);overflow-wrap:anywhere}
    .grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:12px}.card{padding:17px}.label{font-size:11px;color:var(--muted);text-transform:uppercase;letter-spacing:.08em}.value{display:block;margin-top:8px;font-size:17px;font-weight:600;overflow-wrap:anywhere}.hint{margin-top:4px;font-size:12px;color:var(--muted)}.ok{color:var(--green)}.error-text{color:var(--red)}footer{margin-top:20px;text-align:center;color:#789183;font-size:12px}
    @media(max-width:560px){header{align-items:flex-start;flex-direction:column}.links{width:100%}.link{flex:1;text-align:center}.overall{padding:17px}}
  </style>
</head>
<body><main>
  <header><div><h1>Service health</h1><div class="sub">Hector Portfolio API · automatic refresh every 30 seconds</div></div><nav class="links"><a class="link" href="/">API home</a><button id="refresh" type="button">Refresh</button></nav></header>
  <section class="overall"><div class="orb loading" id="orb"><span></span></div><div><div class="status-label">Overall status</div><div class="status-value" id="status">Checking…</div><div class="status-meta" id="service">Connecting to the health endpoint</div></div></section>
  <section class="grid" aria-live="polite">
    <article class="card"><div class="label">Version</div><span class="value" id="version">—</span><div class="hint">Running API build</div></article>
    <article class="card"><div class="label">Uptime</div><span class="value" id="uptime">—</span><div class="hint">Current process</div></article>
    <article class="card"><div class="label">Keep-alive</div><span class="value" id="keepAlive">—</span><div class="hint" id="keepAliveHint">Scheduled service ping</div></article>
    <article class="card"><div class="label">Last ping</div><span class="value" id="lastPing">—</span><div class="hint" id="lastPingHint">No ping recorded</div></article>
  </section>
  <footer>Status is informational. Keep-alive controls are available to superadmins in the dashboard.</footer>
</main>
<script>
const $=id=>document.getElementById(id);
function duration(seconds){const s=Math.floor(seconds||0),d=Math.floor(s/86400),h=Math.floor(s%86400/3600),m=Math.floor(s%3600/60);return d?d+'d '+h+'h '+m+'m':h?h+'h '+m+'m':m+'m '+s%60+'s'}
async function refresh(){try{const response=await fetch('/health/data',{cache:'no-store'});if(!response.ok)throw new Error('HTTP '+response.status);const data=await response.json();$('orb').className='orb';$('status').textContent='Operational';$('status').className='status-value ok';$('service').textContent=data.service||'portfolio-api';$('version').textContent=data.version||'Unknown';$('uptime').textContent=duration(data.uptime);const keep=data.keepAlive||{};$('keepAlive').textContent=keep.enabled?'Enabled':'Disabled';$('keepAlive').className='value '+(keep.enabled?'ok':'');$('keepAliveHint').textContent=keep.intervalMinutes?'Every '+keep.intervalMinutes+' minutes': 'Scheduled service ping';$('lastPing').textContent=keep.lastPingAt?new Date(keep.lastPingAt).toLocaleString():'Not yet';$('lastPingHint').textContent=keep.lastPingAt?(keep.lastPingOk?'Successful':keep.lastPingError||'Failed'):'No ping recorded';$('lastPingHint').className='hint '+(keep.lastPingAt?(keep.lastPingOk?'ok':'error-text'):'')}catch(error){$('orb').className='orb error';$('status').textContent='Unreachable';$('status').className='status-value error-text';$('service').textContent=String(error)}}
$('refresh').addEventListener('click',refresh);refresh();setInterval(refresh,30000);
</script></body></html>`;
  }
}
