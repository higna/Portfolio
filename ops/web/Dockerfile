# Build from the repository root:
#   docker build -f ops/web/Dockerfile --build-arg VITE_API_URL=https://api.example.com -t portfolio-web .

FROM node:20-alpine AS build
ARG VITE_API_URL
ENV VITE_API_URL=${VITE_API_URL}

WORKDIR /repo
COPY . .
RUN test -n "$VITE_API_URL" || { echo "VITE_API_URL build arg is required" >&2; exit 1; }
RUN npm ci --no-audit --no-fund
RUN npm run build -w apps/client

FROM nginxinc/nginx-unprivileged:1.27-alpine AS runtime
COPY ops/web/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /repo/apps/client/dist /usr/share/nginx/html
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s \
  CMD wget -qO- http://127.0.0.1:8080/healthz || exit 1
