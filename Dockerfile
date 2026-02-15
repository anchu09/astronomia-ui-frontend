# Build
FROM node:20-alpine AS build
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

COPY . .
# El navegador del usuario llama al BFF en localhost:3000
ENV VITE_API_URL=http://localhost:3000
RUN npm run build

# Serve con nginx
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
