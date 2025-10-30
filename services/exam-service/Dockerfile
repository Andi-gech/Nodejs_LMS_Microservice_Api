FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .
EXPOSE 3004
ENV PORT=3004
CMD ["node", "index.js"]
