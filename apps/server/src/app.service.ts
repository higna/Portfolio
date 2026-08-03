import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getWelcomeHtml(): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Hector Portfolio API – Documentation</title>
  <link rel="icon" href="data:,">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600;700&family=Inter:wght@300;400;500;600&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Inter', system-ui, sans-serif;
      background: #000000;
      color: #f1f5f9;
      min-height: 100vh;
    }
    a { color: #facc15; text-decoration: none; transition: color 0.2s; }
    a:hover { color: #fbbf24; }

    .navbar {
      position: sticky;
      top: 0;
      z-index: 50;
      background: rgba(0, 0, 0, 0.9);
      backdrop-filter: blur(16px);
      border-bottom: 1px solid rgba(250, 204, 21, 0.15);
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 1rem 2rem;
    }
    .navbar .logo {
      font-family: 'Cormorant Garamond', serif;
      font-size: 1.8rem;
      font-weight: 700;
      letter-spacing: -0.02em;
      color: #facc15;
    }
    .nav-links { display: flex; gap: 2rem; }
    .nav-links a {
      font-weight: 500;
      color: #d4af37;
      position: relative;
    }
    .nav-links a::after {
      content: '';
      position: absolute;
      width: 0;
      height: 1px;
      bottom: -2px;
      left: 0;
      background: #facc15;
      transition: width 0.2s;
    }
    .nav-links a:hover::after { width: 100%; }

    .hero {
      padding: 5rem 2rem 4rem;
      text-align: center;
      background: radial-gradient(ellipse at center, #1a1a1a 0%, #000000 70%);
    }
    .hero h1 {
      font-family: 'Cormorant Garamond', serif;
      font-size: 4rem;
      font-weight: 700;
      background: linear-gradient(to right, #facc15, #d4af37, #f5d742);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      margin-bottom: 0.5rem;
      letter-spacing: -0.02em;
    }
    .hero p.subtitle {
      font-size: 1.5rem;
      color: #d4af37;
      font-weight: 300;
      font-family: 'Inter', sans-serif;
    }
    .hero p.desc {
      margin-top: 1.5rem;
      max-width: 600px;
      margin-left: auto;
      margin-right: auto;
      color: #a8a29e;
      line-height: 1.6;
    }

    .endpoints {
      max-width: 1100px;
      margin: 4rem auto;
      padding: 0 2rem;
    }
    .endpoints h2 {
      font-family: 'Cormorant Garamond', serif;
      font-size: 2.5rem;
      margin-bottom: 2.5rem;
      color: #facc15;
      text-align: center;
    }
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 1.5rem;
    }
    .card {
      background: rgba(255, 255, 255, 0.02);
      border: 1px solid rgba(212, 175, 55, 0.15);
      border-radius: 0.75rem;
      padding: 1.5rem;
      transition: transform 0.2s, border-color 0.2s, box-shadow 0.2s;
    }
    .card:hover {
      transform: translateY(-3px);
      border-color: rgba(250, 204, 21, 0.6);
      box-shadow: 0 8px 20px rgba(250, 204, 21, 0.08);
    }
    .card .method {
      display: inline-block;
      font-size: 0.7rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      padding: 0.2rem 0.6rem;
      border-radius: 0.25rem;
      margin-bottom: 0.6rem;
      background: #1a1a1a;
      color: #facc15;
      border: 1px solid rgba(250, 204, 21, 0.3);
    }
    .card .method.post { color: #38bdf8; border-color: rgba(56, 189, 248, 0.3); }
    .card .method.put { color: #f97316; border-color: rgba(249, 115, 22, 0.3); }
    .card .method.delete { color: #ef4444; border-color: rgba(239, 68, 68, 0.3); }
    .card .path {
      font-family: 'Fira Code', monospace;
      font-size: 0.9rem;
      word-break: break-all;
      color: #e2e8f0;
      margin-bottom: 0.5rem;
    }
    .card .desc {
      font-size: 0.85rem;
      color: #a8a29e;
      line-height: 1.5;
    }
    .card .auth {
      font-size: 0.7rem;
      color: #d4af37;
      margin-top: 0.6rem;
      font-weight: 500;
    }

    footer {
      text-align: center;
      padding: 2rem;
      color: #78716c;
      font-size: 0.8rem;
      border-top: 1px solid rgba(212, 175, 55, 0.15);
    }

    @media (max-width: 640px) {
      .navbar { padding: 1rem; }
      .hero h1 { font-size: 2.8rem; }
      .hero p.subtitle { font-size: 1.2rem; }
      .endpoints { padding: 0 1rem; }
    }
  </style>
</head>
<body>
  <nav class="navbar" id="top">
    <div class="logo">Hector Portfolio API</div>
    <div class="nav-links">
      <a href="#top">Home</a>
      <a href="#endpoints">Endpoints</a>
      <a href="http://localhost:2000" target="_blank">Frontend</a>
    </div>
  </nav>

  <section class="hero">
    <h1>Hector Igna-Igboko</h1>
    <p class="subtitle">Full‑Stack Developer & Data Engineer</p>
    <p class="desc">
      Welcome to the backend API for my portfolio and automation command centre.
      Explore the endpoints below to understand how data, AI, and automation
      are orchestrated.
    </p>
  </section>

  <section class="endpoints" id="endpoints">
    <h2>API Endpoints</h2>
    <div class="grid">
      <div class="card">
        <span class="method post">POST</span>
        <div class="path">/auth/signup</div>
        <div class="desc">Register a new account (local). Requires email, password. Sends verification email.</div>
        <div class="auth">Public</div>
      </div>
      <div class="card">
        <span class="method post">POST</span>
        <div class="path">/auth/login</div>
        <div class="desc">Login with email and password. Returns JWT access token.</div>
        <div class="auth">Public</div>
      </div>
      <div class="card">
        <span class="method post">POST</span>
        <div class="path">/auth/verify-email</div>
        <div class="desc">Confirm email address using verification token.</div>
        <div class="auth">Public</div>
      </div>
      <div class="card">
        <span class="method post">POST</span>
        <div class="path">/auth/resend-verification</div>
        <div class="desc">Resend the verification email.</div>
        <div class="auth">Public</div>
      </div>
      <div class="card">
        <span class="method post">POST</span>
        <div class="path">/auth/forgot-password</div>
        <div class="desc">Request a password reset link.</div>
        <div class="auth">Public</div>
      </div>
      <div class="card">
        <span class="method post">POST</span>
        <div class="path">/auth/reset-password</div>
        <div class="desc">Reset password using token and new password.</div>
        <div class="auth">Public (token required)</div>
      </div>
      <div class="card">
        <span class="method">GET</span>
        <div class="path">/users/me</div>
        <div class="desc">Get current authenticated user's profile.</div>
        <div class="auth">Bearer token</div>
      </div>
      <div class="card">
        <span class="method put">PUT</span>
        <div class="path">/users/me</div>
        <div class="desc">Update email or password of current user.</div>
        <div class="auth">Bearer token</div>
      </div>
      <div class="card">
        <span class="method delete">DELETE</span>
        <div class="path">/users/me</div>
        <div class="desc">Delete current user account.</div>
        <div class="auth">Bearer token</div>
      </div>
      <div class="card">
        <span class="method">GET</span>
        <div class="path">/portfolio/experiences</div>
        <div class="desc">List all professional experiences.</div>
        <div class="auth">Public</div>
      </div>
      <div class="card">
        <span class="method">GET</span>
        <div class="path">/portfolio/educations</div>
        <div class="desc">List all education entries.</div>
        <div class="auth">Public</div>
      </div>
      <div class="card">
        <span class="method">GET</span>
        <div class="path">/portfolio/skills</div>
        <div class="desc">List all skills by category.</div>
        <div class="auth">Public</div>
      </div>
      <div class="card">
        <span class="method">GET</span>
        <div class="path">/portfolio/projects</div>
        <div class="desc">List all projects.</div>
        <div class="auth">Public</div>
      </div>
      <div class="card">
        <span class="method">GET</span>
        <div class="path">/portfolio/certifications</div>
        <div class="desc">List all certifications.</div>
        <div class="auth">Public</div>
      </div>
      <div class="card">
        <span class="method post">POST</span>
        <div class="path">/chat/message</div>
        <div class="desc">Send a message to the AI chatbot (Gemini).</div>
        <div class="auth">Public / Optional token for history</div>
      </div>
      <div class="card">
        <span class="method post">POST</span>
        <div class="path">/sandbox/upload</div>
        <div class="desc">Upload a CSV for cleaning and receive processed file.</div>
        <div class="auth">Public</div>
      </div>
      <div class="card">
        <span class="method">GET</span>
        <div class="path">/dashboard/todos</div>
        <div class="desc">Get all todos for current user.</div>
        <div class="auth">Bearer token</div>
      </div>
      <div class="card">
        <span class="method post">POST</span>
        <div class="path">/dashboard/todos</div>
        <div class="desc">Create a new todo item.</div>
        <div class="auth">Bearer token</div>
      </div>
      <div class="card">
        <span class="method post">POST</span>
        <div class="path">/dashboard/cv-generate</div>
        <div class="desc">Generate a tailored CV based on job description.</div>
        <div class="auth">Bearer token</div>
      </div>
      <div class="card">
        <span class="method post">POST</span>
        <div class="path">/admin/scripts/:id/run</div>
        <div class="desc">Run an automation script (Selenium/Playwright).</div>
        <div class="auth">Superadmin</div>
      </div>
      <div class="card">
        <span class="method">GET</span>
        <div class="path">/admin/scripts</div>
        <div class="desc">List all available automation scripts.</div>
        <div class="auth">Superadmin</div>
      </div>
    </div>
  </section>

  <footer>
    &copy; ${new Date().getFullYear()} Hector Igna-Igboko. Built with NestJS, React, and Python.
  </footer>
</body>
</html>`;
  }
}