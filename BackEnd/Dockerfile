# 1. Usamos Node 22 (LTS), que es más estable para los runners actuales de 2026
FROM node:22-alpine

WORKDIR /app

# 2. Instalamos dependencias del sistema (mariadb-client y Chromium para PDF con Puppeteer)
RUN apk add --no-cache \
    mariadb-client \
    chromium \
    nss \
    freetype \
    harfbuzz \
    ca-certificates \
    ttf-freefont

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

# 3. Copiamos los archivos de dependencias
COPY package*.json ./

# 4. Seteamos la variable CI para indicarle a npm que es un entorno automatizado
ENV CI=true

# 5. IMPORTANTE: Usamos 'npm ci' en lugar de 'npm install'
RUN npm ci

# 6. Copiamos el resto del código fuente
COPY . .

EXPOSE 3000

# Tu comando de inicio se mantiene igual
CMD ["node", "src/config/index.js"]
