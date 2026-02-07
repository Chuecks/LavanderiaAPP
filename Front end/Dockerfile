# Frontend Lavadero - Expo Web + nginx
# Build: EXPO_PUBLIC_API_URL=/api para que la app use la API por el mismo origen (nginx hace proxy)

# Stage 1: build Expo web
FROM node:20-alpine AS builder

WORKDIR /app

# Dependencias
COPY package.json package-lock.json* ./
RUN npm ci

# API base URL: mismo origen, nginx hará proxy /api -> backend
ENV EXPO_PUBLIC_API_URL=/api

COPY . .
RUN npx expo export --platform web

# Stage 2: servir con nginx
FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
