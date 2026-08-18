FROM node:20-slim

RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    python3-venv \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY . .

RUN npm install --include=dev

RUN npm run build -w apps/server

RUN cd worker && pip install --no-cache-dir -r requirements.txt

EXPOSE 2500

CMD ["npm", "run", "start:prod", "-w", "apps/server"]