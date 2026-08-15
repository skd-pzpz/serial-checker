FROM node:20-alpine
WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# 构建阶段需要这些环境变量占位，避免 next build 报错
# 运行时会被 CloudBase 注入的真实值覆盖
ENV DATABASE_URL="postgresql://placeholder:placeholder@localhost:5432/postgres"
ENV NEXTAUTH_SECRET="placeholder"
ENV NEXTAUTH_URL="http://localhost:3000"
ENV ADMIN_USERNAME="admin"
ENV ADMIN_PASSWORD_HASH="placeholder"

RUN npm run build

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["npm", "start"]