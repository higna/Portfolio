# Hector Igna-Igboko Portfolio

An npm workspace containing a NestJS API (`apps/server`) and a Vite/React client (`apps/client`).

## Local development

1. Copy `.env.example` to `.env` and fill in the required local and third-party values.
2. Run `npm ci`.
3. Run `npm run dev`. It creates or repairs the Python worker environment and installs missing dependencies, starts PostgreSQL and Redis, applies pending migrations, and starts the API and client.

The API uses port `2500`, the web client `2000`, PostgreSQL `2555`, and Redis `2525`. PostgreSQL and Redis are bound to loopback by Docker Compose.
To prepare the Python worker without starting the app, run `npm run setup:worker`.

## Editing CV data

Superadmins can edit the complete portfolio CV document in **Dashboard > Portfolio > CV JSON**. The chatbot reads `apps/server/src/chat/data/cv-data.json` for each new request. Changes from the JSON editor and the profile, experience, education, skills, projects, and certifications admin pages regenerate that file, so additions and edits are available to the next chatbot response. JSON imports are validated and saved to PostgreSQL and the file is refreshed from the saved data. Saving a full document replaces its CV sections; export a backup before importing a full replacement. Docker Compose keeps the chat data directory in the persistent `portfolio_chatdata` volume.

Signed-in users can ask the AI chat for a general CV and download its response as a PDF. Superadmins can use **Dashboard > Portfolio > Tailor CV** to provide a job description, generate a factual role-specific draft from the latest CV data, preview it, and download it using the ATS-friendly, Modern, or Classic PDF style. Tailored drafts are generated on demand and are not saved to the CV data.

## VPS deployment with Docker Compose

This setup runs the server, static client, PostgreSQL, and Redis on one VPS. A host-level Caddy reverse proxy provides HTTPS and forwards public traffic to the local-only Compose ports.

### 1. Prepare the server

- Create a Linux VPS with Docker Engine and the Docker Compose plugin installed.
- Point DNS `A` records for `example.com` and `api.example.com` to the VPS address.
- Allow SSH, HTTP, and HTTPS in the cloud firewall. Do not open ports `2000`, `2500`, `2525`, or `2555` to the public internet.

### 2. Configure the app

Clone the repository and prepare the production environment file:

```sh
git clone https://github.com/higna/Portfolio.git
cd Portfolio
cp .env.example .env
```

Edit `.env` and set strong production secrets and these public URLs:

```dotenv
NODE_ENV=production
FRONTEND_URL=https://example.com
BACKEND_URL=https://api.example.com
VITE_API_URL=https://api.example.com
GOOGLE_CALLBACK_URL=https://api.example.com/auth/google/callback
POSTGRES_PASSWORD=<long-random-password>
JWT_SECRET=<long-random-secret>
```

Also configure the email, OAuth, captcha, storage, and AI variables needed by the features you use. The Compose file supplies the server with the internal PostgreSQL and Redis URLs. Keep `.env` out of Git.

### 3. Start the stack

```sh
npm run db:up
docker compose up -d --build
docker compose ps
docker compose logs -f server
```

The server container runs pending migrations before Nest starts. The client image embeds `VITE_API_URL` during its build. The database and Redis use named Docker volumes and only bind to `127.0.0.1` on the VPS.

**Fresh database note:** the initial baseline migration creates the schema for a new empty PostgreSQL database. On an existing database, it skips schema creation when the `users` table is present.

### 4. Add Caddy for HTTPS

Install Caddy on the VPS and use a site configuration like this, replacing the example domains:

```caddyfile
example.com {
    reverse_proxy 127.0.0.1:2000
}

api.example.com {
    reverse_proxy 127.0.0.1:2500
}
```

Caddy obtains and renews certificates automatically when DNS points to the VPS and ports `80` and `443` are reachable. Open those two ports and SSH in the firewall; keep the Compose ports private.

Check the API at `https://api.example.com/health/live` and the site at `https://example.com`.

### Updates and backups

Update from the connected Git branch and rebuild the services:

```sh
git pull
docker compose up -d --build --remove-orphans
```

Back up PostgreSQL before upgrades and periodically:

```sh
mkdir -p backups
docker compose exec -T postgres sh -c 'pg_dump -U "$POSTGRES_USER" "$POSTGRES_DB"' > "backups/portfolio-$(date +%F-%H%M%S).sql"
```

Copy backups off the VPS. Docker volumes survive container recreation, but they are not a backup.

## Render and Vercel

See [deploy.md](deploy.md) for the Render API and Vercel client settings.
