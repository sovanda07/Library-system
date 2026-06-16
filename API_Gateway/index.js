const express = require('express');
const app = express();
const httpProxy = require('http-proxy');
const proxy = httpProxy.createProxyServer();
require('dotenv').config();

const verifyToken = require('../shared/middleware/verifyToken');
const authorizeRole = require('../shared/middleware/authorizeRole');

app.use(express.json());

// Book routes — member + librarian
app.use('/books', verifyToken, authorizeRole('member', 'librarian'), (req, res) => {
  console.log('API Gateway → Book Service');
  proxy.web(req, res, { target: 'http://nginx:80' });
});

// Borrow routes — member only
app.use('/borrow/borrow', verifyToken, authorizeRole('member'), (req, res) => {
  console.log('API Gateway → Borrow Service');
  proxy.web(req, res, { target: 'http://borrow_service:3002' });
});

app.use('/borrow/return', verifyToken, authorizeRole('member'), (req, res) => {
  proxy.web(req, res, { target: 'http://borrow_service:3002' });
});

app.use('/borrow/history', verifyToken, authorizeRole('member'), (req, res) => {
  proxy.web(req, res, { target: 'http://borrow_service:3002' });
});

// Borrow routes — librarian only
app.use('/borrow/all', verifyToken, authorizeRole('librarian'), (req, res) => {
  proxy.web(req, res, { target: 'http://borrow_service:3002' });
});

app.use('/borrow/overdue', verifyToken, authorizeRole('librarian'), (req, res) => {
  proxy.web(req, res, { target: 'http://borrow_service:3002' });
});

app.listen(process.env.PORT || 4000, () => {
  console.log('API Gateway running on port 4000');
});