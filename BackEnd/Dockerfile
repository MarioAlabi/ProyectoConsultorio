# Usamos una imagen ligera de Node
FROM node:20-alpine

# Directorio de trabajo
WORKDIR /app

# Copiamos archivos de dependencias
COPY package*.json ./

# Instalamos dependencias
RUN npm install

# Copiamos el resto del código
COPY . .

# Exponemos el puerto del backend
EXPOSE 3000

# Comando para iniciar
CMD ["node", "index.js"]
