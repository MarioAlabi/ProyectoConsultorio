# 1. Usamos Node 22 (LTS), que es más estable para los runners actuales de 2026
FROM node:22-alpine

WORKDIR /app

# 2. Instalamos dependencias del sistema primero para aprovechar la caché de capas
RUN apk add --no-cache mariadb-client

# 3. Copiamos los archivos de dependencias
COPY package*.json ./

# 4. Seteamos la variable CI para indicarle a npm que es un entorno automatizado
# Esto ayuda a evitar bugs de rutas interactivas
ENV CI=true

# 5. IMPORTANTE: Usamos 'npm ci' en lugar de 'npm install'
# 'npm ci' es más rápido, más seguro para CI/CD y no intenta modificar el lockfile
RUN npm ci

# 6. Copiamos el resto del código fuente
COPY . .

EXPOSE 3000

# Tu comando de inicio se mantiene igual
CMD ["node", "src/config/index.js"]
