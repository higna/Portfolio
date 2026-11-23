import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AppService {
  constructor(private readonly config: ConfigService) {}

  getWelcomeHtml(frontendUrl: string): string {
    const environment = this.config.get<string>('NODE_ENV', 'development');
    const swaggerEnabled =
      environment !== 'production' ||
      this.config.get<string>('SWAGGER_ENABLED') === 'true';
    const year = new Date().getFullYear();

    return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="description" content="Hector Igna-Igboko portfolio API and service links.">
  <title>Portfolio API</title>
  <style>
    :root{color-scheme:dark;--bg:#061710;--panel:#0d241a;--border:rgba(87,220,164,.2);--green:#5ee0a5;--muted:#a3b8ac;--text:#effbf4}
    *{box-sizing:border-box}body{margin:0;min-height:100vh;padding:32px 18px;display:grid;place-items:center;background:radial-gradient(ellipse at 15% 5%,rgba(52,211,153,.12),transparent 40%),radial-gradient(ellipse at 90% 90%,rgba(52,211,153,.08),transparent 40%),var(--bg);font:16px/1.6 system-ui,-apple-system,sans-serif;color:var(--text)}
    main{width:min(640px,100%);text-align:center}.badge{display:inline-flex;align-items:center;gap:9px;padding:6px 12px;border:1px solid var(--border);border-radius:99px;color:var(--green);font-size:12px;letter-spacing:.08em;text-transform:uppercase}.dot{width:7px;height:7px;border-radius:50%;background:var(--green);box-shadow:0 0 12px var(--green)}
    h1{margin:22px 0 10px;font-size:clamp(34px,7vw,54px);line-height:1.08;letter-spacing:-.04em}h1 span{color:var(--green)}.intro{max-width:490px;margin:0 auto 26px;color:var(--muted)}
    .links{display:flex;justify-content:center;gap:10px;flex-wrap:wrap;margin:26px 0}.link{display:inline-flex;align-items:center;justify-content:center;min-height:44px;padding:10px 16px;border:1px solid var(--border);border-radius:10px;color:var(--text);text-decoration:none;background:rgba(255,255,255,.025);font-weight:600}.link:hover{border-color:var(--green);background:rgba(52,211,153,.08)}.link.primary{background:var(--green);border-color:var(--green);color:#062014}.link.primary:hover{background:#8af0bd}
    .meta{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;margin-top:28px;text-align:left}.item{padding:15px 17px;border:1px solid var(--border);border-radius:12px;background:rgba(13,36,26,.85)}.label{display:block;color:var(--muted);font-size:12px;text-transform:uppercase;letter-spacing:.07em}.value{display:block;margin-top:4px;font-family:ui-monospace,monospace;font-size:14px;overflow-wrap:anywhere}footer{margin-top:26px;color:#789183;font-size:12px}
    @media(max-width:480px){.meta{grid-template-columns:1fr}.link{flex:1 1 130px}}
    @media(prefers-reduced-motion:reduce){*,*::before,*::after{animation-duration:.01ms!important;transition-duration:.01ms!important}}
  </style>
</head>
<body>
  <main>
    <div class="badge"><span class="dot"></span> API service · ${environment}</div>
    <h1>Hector's <span>Portfolio API</span></h1>
    <p class="intro">The service behind the portfolio, account, and data workflows. Use the links below to open the API reference, check service health, or visit the web app.</p>
    <nav class="links" aria-label="Service links">
      ${swaggerEnabled ? '<a class="link primary" href="/api/docs">API documentation</a>' : ''}
      <a class="link" href="/health">Health status</a>
      <a class="link" href="${frontendUrl}">Open portfolio</a>
    </nav>
    <section class="meta" aria-label="Service details">
      <div class="item"><span class="label">Environment</span><span class="value">${environment}</span></div>
      <div class="item"><span class="label">Health endpoint</span><span class="value"><a href="/health/live" style="color:var(--green)">/health/live</a></span></div>
    </section>
    <footer>© ${year} Hector Igna-Igboko · Portfolio API</footer>
  </main>
</body>
</html>`;
  }
}
