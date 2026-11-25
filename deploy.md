# Render and Vercel deployment

The production web app is hosted on Vercel and the NestJS API is hosted on Render. Keep the API and web app as separate services.

## Render: API server

Create or update a Render **Web Service** connected to `higna/Portfolio`:

| Setting | Value |
| --- | --- |
| Root directory | Repository root |
| Runtime | Docker |
| Dockerfile path | `ops/server/Dockerfile` |
| Docker build context | Repository root (`.`) |
| Docker command | Leave blank to use the Dockerfile `CMD` |
| Health check path | `/health/live` |

Use Docker on Render so the service has Python and the packages in `apps/server/worker/requirements.txt` available at runtime. The image sets `PYTHON_BIN` to that installed environment. It also includes the native libraries required by OpenCV and pyzbar. The Dockerfile's start command runs pending TypeORM migrations before starting Nest. Render provides `PORT`; the server listens on that port and binds to `0.0.0.0` (Render's default is `10000`).

Set the server variables in the Render service's **Environment** page. Import the ignored `.env.production.server` with **Add from .env**, then replace the Redis placeholder with the Render Key Value internal URL. The separate `.env.production.client` contains only `VITE_*` values for Vercel.

| Variable | Production value |
| --- | --- |
| `NODE_ENV` | `production` |
| `FRONTEND_URL` | `https://higna.vercel.app` |
| `BACKEND_URL` | `https://portfolio-z8wx.onrender.com` |
| `DATABASE_URL` | Production PostgreSQL connection string |
| `REDIS_URL` | Internal URL for the Render Key Value service |
| `GOOGLE_CALLBACK_URL` | `https://portfolio-z8wx.onrender.com/auth/google/callback` |
| `JWT_SECRET` | A long, randomly generated secret |
| `SWAGGER_ENABLED` | `false` |
| `KEEP_ALIVE_ENABLED` | `true` |
| `KEEP_ALIVE_PING_PATH` | `/health/live` |

Keep `.env.production.server` and `.env.production.client` out of Git. Create a Render Key Value instance in the same region as the API, then copy its **internal** connection URL into `REDIS_URL`; this app requires Redis for global request throttling. Render assigns internal and external URLs separately and recommends the internal URL for services in the same region ([Render Key Value docs](https://render.com/docs/key-value)).

The current production API and frontend URLs are already used in the local production environment file. If either service URL changes, update `FRONTEND_URL` on Render and `VITE_API_URL` on Vercel, and update the Google OAuth callback URL in both Render and the Google OAuth client configuration.

## Vercel: client

Create or update a Vercel project connected to the same Git repository:

| Setting | Value |
| --- | --- |
| Root directory | `apps/client` |
| Framework preset | Vite |
| Build command | `npm run build` |
| Output directory | `dist` |

Keep Vercel's monorepo source access enabled so the app can use the repository's npm workspace and root lockfile ([Vercel monorepo docs](https://vercel.com/docs/monorepos/monorepo-faq)). The client includes `apps/client/vercel.json` for SPA route rewrites.

Import `.env.production.client` in the Vercel project settings, or set these variables for the Vercel **Production** environment:

| Variable | Value |
| --- | --- |
| `VITE_API_URL` | `https://portfolio-z8wx.onrender.com` |
| `VITE_RECAPTCHA_SITE_KEY` | The public reCAPTCHA site key, if enabled |

Vite embeds `VITE_*` values at build time, so redeploy the client after changing them ([Vercel Vite docs](https://vercel.com/docs/frameworks/frontend/vite)).

## Database migration notes

The initial baseline migration creates the schema on an empty PostgreSQL database. If the `users` table already exists, it skips schema creation so an existing database and its data are preserved. Future schema changes should be generated and reviewed locally, committed, and applied by the Render start command.

The existing production database already has a schema matching the entities. Its first deployment with the baseline migration records the migration without recreating that schema.

## Deploy flow

1. Commit the code and any reviewed migrations.
2. Push to the branch connected to Render and Vercel.
3. Render builds the server and runs migrations before starting it.
4. Vercel builds and publishes `apps/client` with its production `VITE_API_URL`.
5. Check `https://portfolio-z8wx.onrender.com/health` and `https://higna.vercel.app`.

Render's build and start commands are configured per service in the dashboard; the start command runs on each deploy ([Render deploy docs](https://render.com/docs/deploys)).
