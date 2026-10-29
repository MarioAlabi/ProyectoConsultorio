# --- ETAPA 1: Construcción (Node.js) ---
FROM node:20-alpine AS builder

WORKDIR /app

# Copiamos dependencias
COPY package*.json ./
RUN npm install

# Copiamos el código fuente
COPY . .
ARG VITE_API_URL=""
ENV VITE_API_URL=$VITE_API_URL

# CAMBIO CRÍTICO: Usamos el build script de Vite (definido en package.json)
# Esto generará la carpeta 'dist' con tu HTML/JS optimizado
RUN npm run build

# --- ETAPA 2: Servidor (Nginx) ---
FROM nginx:alpine

# Copiamos los archivos construidos (Vite genera 'dist')
COPY --from=builder /app/dist /usr/share/nginx/html

# Copiamos TU configuración personalizada de Nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Generar certificado SSL autofirmado de respaldo para que Nginx arranque siempre
RUN apk add --no-cache openssl && \
    mkdir -p /etc/nginx/certs && \
    openssl req -x509 -nodes -days 3650 -newkey rsa:2048 \
      -keyout /etc/nginx/certs/consultorio.key \
      -out /etc/nginx/certs/consultorio.crt \
      -subj "/CN=localhost"

# Exponemos los puertos 80 y 443 (internos del contenedor)
EXPOSE 80 443

CMD ["nginx", "-g", "daemon off;"]