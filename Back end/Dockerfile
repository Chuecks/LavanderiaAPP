# Backend Lavadero - Node.js API
FROM node:20-alpine

WORKDIR /app

# Dependencias
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# Código
COPY . .

EXPOSE 4000

CMD ["node", "src/server.js"]
