# ----- Giai đoạn 1: Build -----
    FROM node:22-alpine AS builder
    WORKDIR /app
    
    # Copy file package và cài dependencies
    COPY package*.json ./
    RUN npm install
    
    # Copy toàn bộ code
    COPY . .
    
    # Nếu bạn dùng TypeScript, thêm lệnh build ở đây
    # RUN npm run build
    
    # ----- Giai đoạn 2: Production -----
    FROM node:22-alpine AS production
    WORKDIR /app
    
    # Cài dependencies production
    COPY package*.json ./
    RUN npm install --omit=dev
    
    # Copy toàn bộ code từ builder
    COPY --from=builder /app ./
    
    # Mở port mà ứng dụng sẽ lắng nghe bên trong container
    EXPOSE 3100
    
    # Thiết lập biến môi trường PORT cho server.js
    ENV PORT=3100
    
    # Khởi chạy ứng dụng
    CMD ["node", "server.js"]
    