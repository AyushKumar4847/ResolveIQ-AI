# Stage 1: Build React App using Node.js
FROM node:20-alpine AS builder

WORKDIR /app

# Dependencies pehle copy karo (caching ke liye)
COPY package*.json ./
RUN npm install

# Source code copy karo aur build run karo
COPY . .
RUN npm run build

# Stage 2: Serve using lightweight Nginx
FROM nginx:alpine

# Custom Nginx configuration copy karo
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Builder stage se sirf 'dist' folder copy karo
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]