FROM node:20-alpine

WORKDIR /app

COPY package*.json ./

RUN apk add --no-cache mariadb-client


RUN npm install


COPY . .

EXPOSE 3000

CMD ["node", "src/config/index.js"]
