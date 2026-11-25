FROM node:22-bookworm-slim AS build

WORKDIR /repo
COPY package.json package-lock.json ./
COPY apps/server/package.json ./apps/server/package.json
COPY apps/client/package.json ./apps/client/package.json
RUN npm ci --no-audit --no-fund
COPY apps/server ./apps/server
RUN npm run build:server

FROM python:3.11-slim-bookworm AS worker
ENV VIRTUAL_ENV=/opt/worker-venv
RUN python -m venv "$VIRTUAL_ENV"
ENV PATH="$VIRTUAL_ENV/bin:$PATH"
COPY apps/server/worker/requirements.txt /tmp/worker-requirements.txt
RUN python -m pip install --no-cache-dir --upgrade pip \
    && python -m pip install --no-cache-dir -r /tmp/worker-requirements.txt \
    && rm /tmp/worker-requirements.txt

FROM node:22-bookworm-slim AS runtime
ENV NODE_ENV=production
WORKDIR /repo

RUN apt-get update && apt-get install -y --no-install-recommends \
    libssl3 libzbar0 libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*
ENV PYTHON_BIN=/opt/worker-venv/bin/python
COPY --from=worker /usr/local /usr/local
COPY --from=worker /opt/worker-venv /opt/worker-venv

COPY --from=build /repo/package.json ./package.json
COPY --from=build /repo/package-lock.json ./package-lock.json
COPY --from=build /repo/node_modules ./node_modules
COPY --from=build /repo/apps/server/package.json ./apps/server/package.json
COPY --from=build /repo/apps/server/dist ./apps/server/dist
COPY --from=build /repo/apps/server/public ./apps/server/public
COPY --from=build /repo/apps/server/src/chat/data ./apps/server/src/chat/data
COPY --from=build /repo/apps/server/worker/scripts ./apps/server/worker/scripts
COPY --from=build /repo/apps/server/worker/config ./apps/server/worker/config

WORKDIR /repo/apps/server
EXPOSE 2500
CMD ["npm", "run", "start:prod"]
