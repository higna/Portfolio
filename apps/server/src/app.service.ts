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
  <link rel="icon" type="image/png" href="/higna.png">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600;700&display=swap" rel="stylesheet">
  <title>Portfolio API</title>
  <style>
    :root{color-scheme:dark;--color-base-100:#101014;--color-base-200:#1c1b20;--color-base-content:#e8bc78;--bg:var(--color-base-100);--panel:var(--color-base-200);--border:color-mix(in oklab,var(--color-base-content) 24%,transparent);--gold:var(--color-base-content);--muted:#aaa6a0;--text:#f3f0e9}
    *{box-sizing:border-box}body{margin:0;min-height:100vh;padding:32px 18px;display:grid;place-items:center;background:radial-gradient(ellipse at 15% 5%,rgba(232,188,120,.10),transparent 40%),radial-gradient(ellipse at 90% 90%,rgba(232,188,120,.06),transparent 40%),var(--bg);font:16px/1.6 'Cormorant Garamond',Georgia,serif;color:var(--text)}
    main{width:min(640px,100%);text-align:center}.badge{display:inline-flex;align-items:center;gap:9px;padding:6px 12px;border:1px solid var(--border);border-radius:99px;color:var(--gold);font-size:14px;letter-spacing:.08em;text-transform:uppercase}.dot{width:7px;height:7px;border-radius:50%;background:var(--gold);box-shadow:0 0 12px var(--gold)}
    h1{margin:22px 0 10px;font-size:clamp(40px,7vw,62px);font-weight:500;line-height:1.08;letter-spacing:-.02em}h1 span{color:var(--gold)}.intro{max-width:490px;margin:0 auto 26px;color:var(--muted);font-size:20px}
    .links{display:flex;justify-content:center;gap:10px;flex-wrap:wrap;margin:26px 0}.link{display:inline-flex;align-items:center;justify-content:center;min-height:44px;padding:10px 16px;border:1px solid var(--border);border-radius:10px;color:var(--text);text-decoration:none;background:rgba(255,255,255,.025);font-size:17px;font-weight:600}.link:hover{border-color:var(--gold);background:rgba(232,188,120,.08)}.link.primary{background:var(--gold);border-color:var(--gold);color:#17130d}.link.primary:hover{background:#f0d09d}
    .meta{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;margin-top:28px;text-align:left}.item{padding:15px 17px;border:1px solid var(--border);border-radius:12px;background:var(--panel)}.label{display:block;color:var(--muted);font-size:14px;text-transform:uppercase;letter-spacing:.07em}.value{display:block;margin-top:4px;font:14px ui-monospace,monospace;overflow-wrap:anywhere}footer{margin-top:26px;color:var(--muted);font-size:14px}
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
      <div class="item"><span class="label">Health endpoint</span><span class="value"><a href="/health/live" style="color:var(--gold)">/health/live</a></span></div>
    </section>
    <footer>© ${year} Hector Igna-Igboko · Portfolio API</footer>
  </main>
</body>
</html>`;
  }
}
