# Stage 1: Build the React/Vite application
FROM node:20-alpine AS builder
WORKDIR /app

# Sao chép package.json và cài đặt dependencies bằng npm ci để đảm bảo tính đồng nhất
COPY package*.json ./
RUN npm ci

# Sao chép toàn bộ mã nguồn và build ứng dụng
COPY . .
RUN npm run build

# Stage 2: Serve static files using Nginx
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html

# Cấu hình Nginx fallback về index.html cho các route của Single Page Application (SPA)
RUN echo 'server { \
    listen 80; \
    location / { \
        root /usr/share/nginx/html; \
        index index.html index.htm; \
        try_files $uri $uri/ /index.html; \
    } \
}' > /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
