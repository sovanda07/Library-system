FROM node:20
WORKDIR /app
COPY Borrow_service/package*.json ./
RUN npm install
COPY Borrow_service/ .
COPY shared/ /shared/
WORKDIR /shared
RUN npm install
WORKDIR /app
EXPOSE 3002
CMD ["node", "server.js"]