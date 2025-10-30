# Dockerfile for tenant-service
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 3010

CMD ["npx", "ts-node", "index.ts"]
