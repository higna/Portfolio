# Hector Igna-Igboko Portfolio

An npm workspace containing a NestJS API (`apps/server`) and a Vite/React client (`apps/client`).

## Local development

1. Copy `.env.example` to `.env` and fill in the required local and third-party values.
2. Run `npm ci`.
3. Run `npm run setup:worker` to create the Python worker environment and install its dependencies.
4. Run `npm run db:up` to start PostgreSQL and Redis.
5. Run `npm run dev` to apply pending migrations and start the API and client.

The API uses port `2500`, the web client `2000`, PostgreSQL `2555`, and Redis `2525`. PostgreSQL and Redis are bound to loopback by Docker Compose.

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

**Fresh database note:** the repository currently has no initial baseline migration. A new empty PostgreSQL volume will not be initialized by the migration runner until a reviewed baseline migration is committed. Generate that baseline against a separate empty scratch database before relying on this guide for a fresh VPS database.

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
