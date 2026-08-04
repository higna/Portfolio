import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getWelcomeHtml(frontendUrl: string): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Hector Portfolio API – Documentation</title>
  <link rel="icon" href="/higna.png?v=2" type="image/png">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600;700&family=Inter:wght@300;400;500;600;700&family=Fira+Code:wght@400;500&display=swap" rel="stylesheet">
  <style>
    :root {
      --gold: #d4af37;
      --gold-light: #facc15;
      --dark: #0b0a08;
      --glass-bg: rgba(255,255,255,0.02);
      --glass-border: rgba(212,175,55,0.15);
    }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Inter', sans-serif;
      background: #000;
      color: #e2e8f0;
      display: flex;
      min-height: 100vh;
      overflow-x: hidden;
    }

    .bg-mesh {
      position: fixed;
      inset: 0;
      pointer-events: none;
      z-index: -1;
      opacity: 0.06;
      background-image:
        linear-gradient(#d4af37 1px, transparent 1px),
        linear-gradient(90deg, #d4af37 1px, transparent 1px);
      background-size: 80px 80px;
      animation: meshMove 20s linear infinite;
    }
    @keyframes meshMove {
      0% { background-position: 0 0, 0 0; }
      100% { background-position: 80px 0, 0 80px; }
    }

    a { color: var(--gold); text-decoration: none; transition: color 0.2s; }
    a:hover { color: var(--gold-light); }

    /* Sidebar */
    .sidebar {
      width: 260px;
      background: rgba(11, 10, 8, 0.95);
      backdrop-filter: blur(12px);
      border-right: 1px solid rgba(212, 175, 55, 0.15);
      position: fixed;
      top: 0;
      left: 0;
      bottom: 0;
      z-index: 100;
      display: flex;
      flex-direction: column;
      padding: 2rem 1.2rem;
      overflow-y: auto;
    }
    .sidebar .logo {
      font-family: 'Cormorant Garamond', serif;
      font-size: 2rem;
      font-weight: 700;
      color: var(--gold-light);
      margin-bottom: 2.5rem;
      letter-spacing: -0.02em;
      text-align: center;
    }
    .sidebar nav a {
      display: flex;
      align-items: center;
      gap: 0.7rem;
      padding: 0.65rem 1rem;
      margin-bottom: 0.15rem;
      border-radius: 0.5rem;
      color: #a8a29e;
      font-size: 0.9rem;
      font-weight: 500;
      transition: all 0.2s;
    }
    .sidebar nav a:hover,
    .sidebar nav a.active {
      background: rgba(250, 204, 21, 0.08);
      color: var(--gold-light);
    }
    .sidebar nav a svg {
      width: 1.1rem;
      height: 1.1rem;
      opacity: 0.7;
      flex-shrink: 0;
    }

    /* Main */
    .main {
      margin-left: 260px;
      flex: 1;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;  /* centers children horizontally */
    }
    .topbar {
      position: sticky;
      top: 0;
      z-index: 90;
      background: rgba(0, 0, 0, 0.8);
      backdrop-filter: blur(16px);
      padding: 0.9rem 2rem;
      display: flex;
      align-items: center;
      gap: 1rem;
      border-bottom: 1px solid rgba(212, 175, 55, 0.1);
      width: 100%;
    }
    .topbar .menu-btn {
      display: none;
      background: none;
      border: none;
      color: var(--gold);
      font-size: 1.8rem;
      cursor: pointer;
      line-height: 1;
    }
    .topbar .search-container {
      flex: 1;
      max-width: 440px;
      position: relative;
    }
    .topbar .search-container svg {
      position: absolute;
      left: 1rem;
      top: 50%;
      transform: translateY(-50%);
      color: #6b7280;
      width: 1.1rem;
      height: 1.1rem;
      pointer-events: none;
      transition: color 0.2s;
    }
    .topbar .search-container input {
      width: 100%;
      background: #1c1c1c;
      border: 1px solid rgba(212, 175, 55, 0.2);
      border-radius: 0.75rem;
      padding: 0.6rem 1rem 0.6rem 2.8rem;
      color: #e2e8f0;
      font-size: 0.95rem;
      outline: none;
      transition: border-color 0.2s, box-shadow 0.2s;
      font-family: 'Inter', sans-serif;
    }
    .topbar .search-container input:focus {
      border-color: var(--gold-light);
      box-shadow: 0 0 0 3px rgba(250, 204, 21, 0.1);
    }
    .topbar .frontend-link {
      margin-left: auto;
      display: flex;
      align-items: center;
      gap: 0.4rem;
      color: var(--gold);
      font-weight: 500;
      font-size: 0.9rem;
      white-space: nowrap;
      padding: 0.4rem 0.8rem;
      border-radius: 0.5rem;
      transition: background 0.2s;
    }
    .topbar .frontend-link:hover {
      background: rgba(250, 204, 21, 0.08);
    }
    .topbar .frontend-link svg {
      width: 1rem;
      height: 1rem;
    }

    .content {
      padding: 2.5rem 2rem;
      max-width: 1200px;
      width: 100%;
    }
    .hero {
      text-align: center;
      margin-bottom: 4rem;
      position: relative;
    }
    .hero h1 {
      font-family: 'Cormorant Garamond', serif;
      font-size: 3.5rem;
      font-weight: 700;
      background: linear-gradient(to right, #facc15, #d4af37);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      margin-bottom: 0.5rem;
      position: relative;
      z-index: 1;
    }
    .hero::before {
      content: '';
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 260px;
      height: 100px;
      background: radial-gradient(circle, rgba(250,204,21,0.15) 0%, transparent 70%);
      pointer-events: none;
      z-index: 0;
    }
    .hero p {
      font-size: 1.2rem;
      color: #a8a29e;
      max-width: 500px;
      margin: 0 auto;
      position: relative;
      z-index: 1;
    }

    .category {
      margin-bottom: 3rem;
    }
    .category h2 {
      font-family: 'Cormorant Garamond', serif;
      font-size: 1.8rem;
      color: var(--gold-light);
      margin-bottom: 1.25rem;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    .category h2::after {
      content: '';
      flex: 1;
      height: 1px;
      background: linear-gradient(to right, rgba(250,204,21,0.3), transparent);
    }
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: 1.2rem;
    }
    .card {
      background: linear-gradient(145deg, rgba(255,255,255,0.02) 0%, rgba(255,255,255,0.01) 100%);
      border: 1px solid rgba(212, 175, 55, 0.12);
      border-radius: 1rem;
      padding: 1.5rem;
      transition: all 0.3s ease;
      position: relative;
      backdrop-filter: blur(2px);
    }
    .card:hover {
      transform: translateY(-4px);
      box-shadow: 0 20px 35px rgba(0,0,0,0.4), 0 0 0 1px rgba(250,204,21,0.3) inset;
      border-color: rgba(250, 204, 21, 0.4);
    }
    .card .method {
      display: inline-block;
      font-size: 0.65rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.07em;
      padding: 0.25rem 0.7rem;
      border-radius: 0.35rem;
      margin-bottom: 0.8rem;
      background: rgba(250, 204, 21, 0.08);
      color: var(--gold-light);
      border: 1px solid rgba(250, 204, 21, 0.2);
      font-family: 'Fira Code', monospace;
      backdrop-filter: blur(4px);
    }
    .card .method.get  { color: #38bdf8; background: rgba(56, 189, 248, 0.1); border-color: rgba(56, 189, 248, 0.2); }
    .card .method.post { color: #34d399; background: rgba(52, 211, 153, 0.1); border-color: rgba(52, 211, 153, 0.2); }
    .card .method.put  { color: #fbbf24; background: rgba(251, 191, 36, 0.1); border-color: rgba(251, 191, 36, 0.2); }
    .card .method.delete { color: #f87171; background: rgba(248, 113, 113, 0.1); border-color: rgba(248, 113, 113, 0.2); }
    .card .path {
      font-family: 'Fira Code', monospace;
      font-size: 0.95rem;
      word-break: break-all;
      color: #f1f5f9;
      margin-bottom: 0.5rem;
      font-weight: 500;
    }
    .card .desc {
      font-size: 0.85rem;
      color: #9ca3af;
      line-height: 1.6;
      margin-bottom: 0.75rem;
    }
    .card .auth {
      font-size: 0.7rem;
      color: var(--gold);
      font-weight: 500;
      display: flex;
      align-items: center;
      gap: 0.3rem;
    }
    .card .auth::before {
      content: '';
      width: 0.4rem;
      height: 0.4rem;
      border-radius: 50%;
      background: var(--gold);
      opacity: 0.7;
    }

    footer {
      text-align: center;
      padding: 2.5rem 2rem;
      color: #6b7280;
      font-size: 0.85rem;
      border-top: 1px solid rgba(212, 175, 55, 0.1);
      margin-top: auto;
      width: 100%;
      display: flex;
      flex-direction: column;
      gap: 0.8rem;
    }
    footer .links {
      display: flex;
      justify-content: center;
      gap: 2rem;
      font-size: 0.8rem;
    }
    footer .links a {
      color: #9ca3af;
    }
    footer .links a:hover {
      color: var(--gold-light);
    }

    .scroll-top {
      position: fixed;
      bottom: 2rem;
      right: 2rem;
      width: 2.5rem;
      height: 2.5rem;
      background: rgba(250, 204, 21, 0.1);
      border: 1px solid rgba(250, 204, 21, 0.3);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--gold);
      cursor: pointer;
      opacity: 0;
      transform: translateY(10px);
      transition: opacity 0.3s, transform 0.3s;
      z-index: 50;
      backdrop-filter: blur(4px);
    }
    .scroll-top.visible {
      opacity: 1;
      transform: translateY(0);
    }
    .scroll-top:hover {
      background: rgba(250, 204, 21, 0.2);
    }

    .overlay {
      display: none;
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,0.7);
      z-index: 50;
      backdrop-filter: blur(2px);
    }
    .overlay.active { display: block; }

    @media (max-width: 768px) {
      .sidebar {
        transform: translateX(-100%);
        transition: transform 0.3s ease;
      }
      .sidebar.open {
        transform: translateX(0);
        box-shadow: 4px 0 20px rgba(0,0,0,0.5);
      }
      .main {
        margin-left: 0;
      }
      .topbar .menu-btn {
        display: block;
      }
      .grid {
        grid-template-columns: 1fr;
      }
      .hero h1 {
        font-size: 2.5rem;
      }
    }
  </style>
</head>
<body>
  <div class="bg-mesh"></div>
  <div class="overlay" id="overlay" onclick="closeSidebar()"></div>

  <aside class="sidebar" id="sidebar">
    <div class="logo">Hector API</div>
    <nav>
      <a href="#auth" onclick="closeSidebar()">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/></svg>
        Auth
      </a>
      <a href="#user" onclick="closeSidebar()">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
        User
      </a>
      <a href="#portfolio" onclick="closeSidebar()">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
        Portfolio
      </a>
      <a href="#chat" onclick="closeSidebar()">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
        Chat
      </a>
      <a href="#contact" onclick="closeSidebar()">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
        Contact
      </a>
      <a href="#data" onclick="closeSidebar()">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg>
        Data
      </a>
      <a href="#pdf" onclick="closeSidebar()">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
        PDF Tools
      </a>
      <a href="#dashboard" onclick="closeSidebar()">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><line x1="3" x2="21" y1="9" y2="9"/><line x1="9" x2="9" y1="21" y2="9"/></svg>
        Dashboard
      </a>
    </nav>
  </aside>

  <div class="main">
    <header class="topbar">
      <button class="menu-btn" onclick="toggleSidebar()" aria-label="Menu">☰</button>
      <div class="search-container">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
        <input type="text" id="search" placeholder="Find an endpoint..." oninput="filterEndpoints()" aria-label="Search endpoints">
      </div>
      <a href="${frontendUrl}" target="_blank" class="frontend-link">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
        Frontend
      </a>
    </header>

    <div class="content">
      <section class="hero">
        <h1>Hector Igna-Igboko</h1>
        <p>Full-Stack Developer & Data Engineer — API Documentation</p>
      </section>

      <div id="all-endpoints">
        <!-- AUTH -->
        <div class="category" id="auth">
          <h2>Authentication</h2>
          <div class="grid" data-filter="authentication signup login verify resend forgot reset google oauth avatar upload">
            <div class="card"><span class="method post">POST</span><div class="path">/auth/signup</div><div class="desc">Register a new account. Requires email, password, fullName, captchaToken. Sends verification email.</div><div class="auth">Public</div></div>
            <div class="card"><span class="method post">POST</span><div class="path">/auth/login</div><div class="desc">Login with email and password (and optional captchaToken). Returns JWT.</div><div class="auth">Public</div></div>
            <div class="card"><span class="method post">POST</span><div class="path">/auth/verify-email</div><div class="desc">Confirm email address using verification token.</div><div class="auth">Public</div></div>
            <div class="card"><span class="method post">POST</span><div class="path">/auth/resend-verification</div><div class="desc">Resend verification email for an existing user.</div><div class="auth">Public</div></div>
            <div class="card"><span class="method post">POST</span><div class="path">/auth/forgot-password</div><div class="desc">Request a password reset link.</div><div class="auth">Public</div></div>
            <div class="card"><span class="method post">POST</span><div class="path">/auth/reset-password</div><div class="desc">Reset password using token and new password.</div><div class="auth">Public (token)</div></div>
            <div class="card"><span class="method get">GET</span><div class="path">/auth/google</div><div class="desc">Initiate Google OAuth2 login.</div><div class="auth">Public (redirect)</div></div>
            <div class="card"><span class="method get">GET</span><div class="path">/auth/google/callback</div><div class="desc">Google OAuth2 callback – completes login.</div><div class="auth">Public (redirect)</div></div>
            <div class="card"><span class="method post">POST</span><div class="path">/auth/upload-avatar</div><div class="desc">Upload an avatar image (multipart). Returns Cloudinary URL.</div><div class="auth">Bearer token</div></div>
          </div>
        </div>

        <!-- USER -->
        <div class="category" id="user">
          <h2>User</h2>
          <div class="grid" data-filter="user profile me password users">
            <div class="card"><span class="method get">GET</span><div class="path">/users/me</div><div class="desc">Get current authenticated user profile.</div><div class="auth">Bearer token</div></div>
            <div class="card"><span class="method put">PUT</span><div class="path">/users/me</div><div class="desc">Update fullName, picture, or password.</div><div class="auth">Bearer token</div></div>
            <div class="card"><span class="method put">PUT</span><div class="path">/users/me/password</div><div class="desc">Change current user password.</div><div class="auth">Bearer token</div></div>
            <div class="card"><span class="method delete">DELETE</span><div class="path">/users/me</div><div class="desc">Delete current user account.</div><div class="auth">Bearer token</div></div>
            <div class="card"><span class="method get">GET</span><div class="path">/users</div><div class="desc">List all registered users.</div><div class="auth">Superadmin</div></div>
            <div class="card"><span class="method get">GET</span><div class="path">/users/:id</div><div class="desc">Get a single user by ID.</div><div class="auth">Superadmin</div></div>
            <div class="card"><span class="method delete">DELETE</span><div class="path">/users/:id</div><div class="desc">Delete a user by ID.</div><div class="auth">Superadmin</div></div>
            <div class="card"><span class="method put">PUT</span><div class="path">/users/:id/password</div><div class="desc">Reset another user's password (superadmin).</div><div class="auth">Superadmin</div></div>
          </div>
        </div>

        <!-- PORTFOLIO -->
        <div class="category" id="portfolio">
          <h2>Portfolio</h2>
          <div class="grid" data-filter="portfolio profile experience education skill project certification upload image">
            <div class="card"><span class="method get">GET</span><div class="path">/portfolio/profile</div><div class="desc">Get public CV profile.</div><div class="auth">Public</div></div>
            <div class="card"><span class="method put">PUT</span><div class="path">/portfolio/profile</div><div class="desc">Update public CV profile.</div><div class="auth">Superadmin</div></div>
            <div class="card"><span class="method get">GET</span><div class="path">/portfolio/experiences</div><div class="desc">List professional experiences.</div><div class="auth">Public</div></div>
            <div class="card"><span class="method post">POST</span><div class="path">/portfolio/experiences</div><div class="desc">Add a new experience.</div><div class="auth">Superadmin</div></div>
            <div class="card"><span class="method put">PUT</span><div class="path">/portfolio/experiences/:id</div><div class="desc">Update an experience.</div><div class="auth">Superadmin</div></div>
            <div class="card"><span class="method delete">DELETE</span><div class="path">/portfolio/experiences/:id</div><div class="desc">Delete an experience.</div><div class="auth">Superadmin</div></div>
            <div class="card"><span class="method get">GET</span><div class="path">/portfolio/educations</div><div class="desc">List education entries.</div><div class="auth">Public</div></div>
            <div class="card"><span class="method post">POST</span><div class="path">/portfolio/educations</div><div class="desc">Add an education entry.</div><div class="auth">Superadmin</div></div>
            <div class="card"><span class="method put">PUT</span><div class="path">/portfolio/educations/:id</div><div class="desc">Update an education entry.</div><div class="auth">Superadmin</div></div>
            <div class="card"><span class="method delete">DELETE</span><div class="path">/portfolio/educations/:id</div><div class="desc">Delete an education entry.</div><div class="auth">Superadmin</div></div>
            <div class="card"><span class="method get">GET</span><div class="path">/portfolio/skills</div><div class="desc">List skills by category.</div><div class="auth">Public</div></div>
            <div class="card"><span class="method post">POST</span><div class="path">/portfolio/skills</div><div class="desc">Add a new skill.</div><div class="auth">Superadmin</div></div>
            <div class="card"><span class="method put">PUT</span><div class="path">/portfolio/skills/:id</div><div class="desc">Update a skill.</div><div class="auth">Superadmin</div></div>
            <div class="card"><span class="method delete">DELETE</span><div class="path">/portfolio/skills/:id</div><div class="desc">Delete a skill.</div><div class="auth">Superadmin</div></div>
            <div class="card"><span class="method get">GET</span><div class="path">/portfolio/projects</div><div class="desc">List projects (optional ?featured=true).</div><div class="auth">Public</div></div>
            <div class="card"><span class="method post">POST</span><div class="path">/portfolio/projects</div><div class="desc">Add a new project.</div><div class="auth">Superadmin</div></div>
            <div class="card"><span class="method put">PUT</span><div class="path">/portfolio/projects/:id</div><div class="desc">Update a project.</div><div class="auth">Superadmin</div></div>
            <div class="card"><span class="method delete">DELETE</span><div class="path">/portfolio/projects/:id</div><div class="desc">Delete a project.</div><div class="auth">Superadmin</div></div>
            <div class="card"><span class="method get">GET</span><div class="path">/portfolio/certifications</div><div class="desc">List certifications.</div><div class="auth">Public</div></div>
            <div class="card"><span class="method post">POST</span><div class="path">/portfolio/certifications</div><div class="desc">Add a certification.</div><div class="auth">Superadmin</div></div>
            <div class="card"><span class="method put">PUT</span><div class="path">/portfolio/certifications/:id</div><div class="desc">Update a certification.</div><div class="auth">Superadmin</div></div>
            <div class="card"><span class="method delete">DELETE</span><div class="path">/portfolio/certifications/:id</div><div class="desc">Delete a certification.</div><div class="auth">Superadmin</div></div>
            <div class="card"><span class="method post">POST</span><div class="path">/portfolio/upload-project-image</div><div class="desc">Upload a project image to Cloudinary.</div><div class="auth">Superadmin</div></div>
          </div>
        </div>

        <!-- CHAT -->
        <div class="category" id="chat">
          <h2>Chat</h2>
          <div class="grid" data-filter="chat message conversation history">
            <div class="card"><span class="method post">POST</span><div class="path">/chat/message</div><div class="desc">Send a message to the AI chatbot. Optionally include a conversationId.</div><div class="auth">Public / Optional token</div></div>
            <div class="card"><span class="method get">GET</span><div class="path">/chat/conversations</div><div class="desc">List all conversations for the authenticated user.</div><div class="auth">Bearer token</div></div>
            <div class="card"><span class="method get">GET</span><div class="path">/chat/history/:conversationId</div><div class="desc">Get full history of a specific conversation.</div><div class="auth">Bearer token</div></div>
            <div class="card"><span class="method delete">DELETE</span><div class="path">/chat/conversations/:conversationId</div><div class="desc">Delete a conversation and all its messages.</div><div class="auth">Bearer token</div></div>
          </div>
        </div>

        <!-- CONTACT -->
        <div class="category" id="contact">
          <h2>Contact</h2>
          <div class="grid" data-filter="contact message email">
            <div class="card"><span class="method post">POST</span><div class="path">/contact</div><div class="desc">Send a contact message (name, email, subject, message). Emailed via Brevo.</div><div class="auth">Public</div></div>
          </div>
        </div>

        <!-- DATA ENGINEERING -->
        <div class="category" id="data">
          <h2>Data Engineering</h2>
          <div class="grid" data-filter="ona forms download pipeline run chart eval">
            <div class="card"><span class="method get">GET</span><div class="path">/ona/forms</div><div class="desc">List all ONA forms available to the configured API key.</div><div class="auth">Superadmin</div></div>
            <div class="card"><span class="method post">POST</span><div class="path">/ona/download</div><div class="desc">Download one or more ONA forms (with export options). Returns a file or ZIP.</div><div class="auth">Superadmin</div></div>
            <div class="card"><span class="method post">POST</span><div class="path">/pipeline/run</div><div class="desc">Run an ETL pipeline (clean_cocoa_farmer.py, clean_cocoa_farm.py, clean_cocoa_field_eval.py). Streams progress.</div><div class="auth">Superadmin</div></div>
            <div class="card"><span class="method get">GET</span><div class="path">/pipeline/download-cocoa-eval</div><div class="desc">Download generated charts and data from the last Cocoa Field Evaluation run.</div><div class="auth">Public</div></div>
          </div>
        </div>

        <!-- PDF TOOLS -->
        <div class="category" id="pdf">
          <h2>PDF Tools</h2>
          <div class="grid" data-filter="pdf merge image convert">
            <div class="card"><span class="method post">POST</span><div class="path">/pdf/merge</div><div class="desc">Merge multiple PDF files into one. Upload files via multipart.</div><div class="auth">Public</div></div>
            <div class="card"><span class="method post">POST</span><div class="path">/pdf/images-to-pdf</div><div class="desc">Convert multiple images to a single PDF. Upload images via multipart.</div><div class="auth">Public</div></div>
          </div>
        </div>

        <!-- DASHBOARD -->
        <div class="category" id="dashboard">
          <h2>Dashboard</h2>
          <div class="grid" data-filter="dashboard stats statistics">
            <div class="card"><span class="method get">GET</span><div class="path">/dashboard/stats</div><div class="desc">Get admin dashboard statistics (users, skills, projects, certifications).</div><div class="auth">Superadmin</div></div>
          </div>
        </div>
      </div>
    </div>

    <footer>
      <div class="links">
        <a href="${frontendUrl}">Portfolio</a>
        <a href="${frontendUrl}/chat">AI Chat</a>
        <a href="https://github.com/higna">GitHub</a>
      </div>
      <span>&copy; ${new Date().getFullYear()} Hector Igna-Igboko. Built with NestJS, React, and Python.</span>
    </footer>
  </div>

  <div class="scroll-top" id="scrollTop" onclick="window.scrollTo({top:0,behavior:'smooth'})">
    <svg xmlns="http://www.w3.org/2000/svg" width="1.2rem" height="1.2rem" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m18 15-6-6-6 6"/></svg>
  </div>

  <script>
    function toggleSidebar() {
      document.getElementById('sidebar').classList.toggle('open');
      document.getElementById('overlay').classList.toggle('active');
    }
    function closeSidebar() {
      document.getElementById('sidebar').classList.remove('open');
      document.getElementById('overlay').classList.remove('active');
    }
    function filterEndpoints() {
      const query = document.getElementById('search').value.toLowerCase();
      document.querySelectorAll('.card').forEach(card => {
        const parentGrid = card.closest('.grid');
        const filterData = parentGrid ? parentGrid.dataset.filter + ' ' + card.textContent.toLowerCase() : card.textContent.toLowerCase();
        card.style.display = filterData.includes(query) ? '' : 'none';
      });
    }
    window.addEventListener('scroll', () => {
      document.getElementById('scrollTop').classList.toggle('visible', window.scrollY > 300);
    });
  </script>
</body>
</html>`;
  }
}