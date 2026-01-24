# --- ETAPA 1: Construcción (Node.js) ---
FROM node:20-alpine AS builder

WORKDIR /app

# Copiamos dependencias
COPY package*.json ./
RUN npm install

# Copiamos el código fuente
COPY . .

# Construimos la versión web estática de Expo
# Esto generará una carpeta 'dist' con tu HTML/JS
RUN npx expo export --platform web

# --- ETAPA 2: Servidor (Nginx) ---
FROM nginx:alpine

# Copiamos los archivos construidos en la etapa anterior a la carpeta de Nginx
COPY --from=builder /app/dist /usr/share/nginx/html

# Copiamos TU configuración personalizada de Nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Exponemos el puerto 80 (interno del contenedor)
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]