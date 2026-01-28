# --- ETAPA 1: Construcción (Node.js) ---
FROM node:20-alpine AS builder

WORKDIR /app

# Copiamos dependencias
COPY package*.json ./
RUN npm install

# Copiamos el código fuente
COPY . .

# CAMBIO CRÍTICO: Usamos el build script de Vite (definido en package.json)
# Esto generará la carpeta 'dist' con tu HTML/JS optimizado
RUN npm run build

# --- ETAPA 2: Servidor (Nginx) ---
FROM nginx:alpine

# Copiamos los archivos construidos (Vite genera 'dist')
COPY --from=builder /app/dist /usr/share/nginx/html

# Copiamos TU configuración personalizada de Nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Exponemos el puerto 80 (interno del contenedor)
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]