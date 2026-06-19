const express = require('express');
const app = express();
const httpProxy = require('http-proxy');
const proxy = httpProxy.createProxyServer();
require('dotenv').config();

const verifyToken = require('../shared/middleware/verifyToken');
const authorizeRole = require('../shared/middleware/authorizeRole');

// Handle proxy errors — this is why you saw "socket hang up"
proxy.on('error', (err, req, res) => {
  console.error('Proxy error:', err.message);
  res.writeHead(502, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Bad Gateway', detail: err.message }));
});

// Auth routes — no token needed
app.use('/auth', (req, res) => {
  console.log(`API Gateway → Auth Service: ${req.method} ${req.originalUrl}`);
  proxy.web(req, res, { target: 'http://auth_service:3000' });
});

// Book routes — member + librarian
app.use('/books', verifyToken, authorizeRole('member', 'librarian'), (req, res) => {
  console.log(`API Gateway → Book Service: ${req.method} ${req.originalUrl}`);
  proxy.web(req, res, { target: 'http://nginx:80' });
});

// Borrow routes — member only
app.use('/borrow/borrow', verifyToken, authorizeRole('member'), (req, res) => {
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