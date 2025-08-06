FROM node:20-bullseye-slim

RUN apt-get update && apt-get install -y chromium \
    libx11-xcb1 libxcomposite1 libxdamage1 libxrandr2 libgtk-3-0 \
    libasound2 libnss3 libxss1 libxshmfence1 libatk-bridge2.0-0 \
    libdrm2 libgbm1 libxfixes3 xdg-utils fonts-liberation \
    --no-install-recommends && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY . .

RUN npm install --legacy-peer-deps

CMD ["node", "index.js"]