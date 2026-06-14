FROM node:20-alpine
WORKDIR /app
COPY Auth_service/package*.json ./
RUN npm install
COPY Auth_service/ .
COPY shared/ /shared/
WORKDIR /shared
RUN npm install
WORKDIR /app
EXPOSE 3000
CMD ["node", "server.js"]