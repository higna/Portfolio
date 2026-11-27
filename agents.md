# Project Guide for Agents

## Project overview

This repository is an npm workspace for a personal portfolio and its data tools.

- `apps/client` is a React, TypeScript, and Vite application.
- `apps/server` is a NestJS API backed by PostgreSQL and Redis.
- `apps/server/worker/scripts` contains Python utilities and data pipelines used by the API.
- The root `README.md` documents environment setup and deployment.

Keep changes focused on the feature being worked on. Check the surrounding component or pipeline before introducing a new pattern, and preserve existing user data and configuration.

## Application entry points

### Client

`apps/client/src/main.tsx` is the browser entry point. It imports global styles, mounts React in `StrictMode`, and wraps the app with `ThemeProvider` and `AuthProvider`. The router is rendered inside `App`; toast notifications are configured here.

Routes live in `apps/client/src/router.tsx`. Public pages are grouped under the public layout. Signed-in dashboard pages use `ProtectedRoute` and `DashboardLayout`; superadmin pages add `RequireRole`. Keep authorization in route guards and enforce it again on the server for protected operations.

Feature code belongs under `apps/client/src/features`. Shared layout, navigation, and common controls belong under `apps/client/src/common`. Use `apps/client/src/lib/api.ts` for API requests and `createLogger` from `apps/client/src/lib/logger` for application logging.

### Server

`apps/server/src/main.ts` creates the Nest application, calls `configureApp` from `app.setup.ts`, serves files from `apps/server/public`, and listens on the configured backend port (normally `2500`). `app.setup.ts` owns shared HTTP configuration such as CORS, validation, and Swagger.

Server modules live under `apps/server/src/<feature>`. Keep HTTP handling in controllers and business logic in services. Use DTO validation and the existing JWT, role, and public-route guards where appropriate.

### Python worker

Worker scripts live in `apps/server/worker/scripts`. Pipeline scripts emit newline-delimited JSON progress records so the Nest API and admin UI can report each step. Use the configured Python runtime helper when starting scripts from Node. Spreadsheet IDs belong in `apps/server/worker/config/spreadsheets.json`; credentials and API keys belong in environment configuration and must not be committed.

File uploads used by a worker should be stored temporarily and removed after processing. Validate workbook structure and non-empty output before clearing or replacing a remote worksheet.

## Design conventions

- The app uses Tailwind CSS v4 and daisyUI v5. Prefer existing utilities and components over adding another styling system.
- The supported daisyUI themes are `bumblebee` (default) and `luxury`, configured in `apps/client/src/styles/global.css` and selected through `ThemeContext`.
- Use theme tokens such as `bg-base-100`, `text-base-content`, `bg-primary`, and `border-base-content/10` so both themes work. Avoid hard-coded colors except for established brand treatments.
- The brand treatment uses a near-black banner (`#090909`) with warm gold (`#D4AF37`) accents. Dashboard page banners and the Projects hero are visual references for page headers.
- Use the existing responsive spacing, rounded cards, subtle borders, and restrained shadows. Keep important actions visible and controls easy to scan on small screens.
- The global display font is Cormorant Garamond. Use it for prominent headings where it matches nearby pages; keep dense controls and data tables legible.
- Use semantic buttons, labels, headings, and accessible names. Preserve keyboard operation and visible focus states.

## Data sandbox

The Sandbox runs locally in the browser. Its synthetic sample data is for demonstrations only; uploaded CSV/XLSX files are not sent to the API. Keep transformations in client state and ensure exports reflect the previewed transformations. Duplicate removal should remove rows while preserving all columns in the retained row.

## Local development and builds

From the repository root:

```bash
npm run dev
npm run build
```

The development command prepares the Python worker, starts PostgreSQL and Redis, runs server migrations, and starts the client and API. The client normally uses port `2000`; the API normally uses port `2500`.

Build a single workspace with:

```bash
npm run build:client
npm run build:server
```

Do not run data pipelines against production services as part of a build. Confirm the intended target before replacing remote data.
