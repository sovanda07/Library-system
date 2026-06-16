FROM node:20-alpine
WORKDIR /app
COPY API_Gateway/package*.json ./
RUN npm install
COPY API_Gateway/ .
COPY shared/ /shared/
WORKDIR /shared
RUN npm install
WORKDIR /app
EXPOSE 4000
CMD ["node", "index.js"]