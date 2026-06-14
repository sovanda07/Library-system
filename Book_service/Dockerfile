FROM node:20
WORKDIR /app
COPY Book_service/package*.json ./
RUN npm install
COPY Book_service/ .
COPY shared/ /shared/
WORKDIR /shared
RUN npm install
WORKDIR /app
EXPOSE 3001
CMD ["node", "server.js"]