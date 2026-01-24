# ETAPA 1: Construcción
FROM node:20-alpine AS builder

WORKDIR /app

# Copiar package.json y lock para instalar dependencias primero
COPY package*.json ./
RUN npm install

# Copiamos el resto del código
COPY . .

# Generar la versión web estática de Expo
RUN npx expo export -p web

# ETAPA 2: Servidor Web (Nginx)
FROM nginx:alpine

# Copiar los archivos generados en la etapa anterior a la carpeta de Nginx
COPY --from=builder /app/dist /usr/share/nginx/html

# Exponer el puerto 80 (el estándar para web)
EXPOSE 80

# Arrancamos Nginx
CMD ["nginx", "-g", "daemon off;"]