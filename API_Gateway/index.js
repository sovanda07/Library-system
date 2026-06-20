const express = require('express');
const app = express();
const httpProxy = require('http-proxy');
const proxy = httpProxy.createProxyServer();
require('dotenv').config();

const verifyToken = require('../shared/middleware/verifyToken');
const authorizeRole = require('../shared/middleware/authorizeRole');

// Handle proxy errors
proxy.on('error', (err, req, res) => {
  console.error('Proxy error:', err.message);
  res.writeHead(502, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Bad Gateway', detail: err.message }));
});

// Auth routes — no token needed
// POST /auth/login
// POST /auth/register
// POST /auth/forgot-password
// POST /auth/reset-password
app.use('/auth', (req, res) => {
  req.url = req.originalUrl.replace('/auth', '');
  proxy.web(req, res, { target: 'http://auth_service:3000' });
});

// Block internal book routes from public access
// PATCH /books/:id/decrease
// PATCH /books/:id/increase
app.use('/books/:id/decrease', (req, res) => {
  res.status(403).json({ error: 'Forbidden' });
});
app.use('/books/:id/increase', (req, res) => {
  res.status(403).json({ error: 'Forbidden' });
});

// Book routes — member + librarian
// GET  /books
// GET  /books/search
// GET  /books/:id
// GET  /books/find/:bookId
// POST /books
// PATCH /books/:id
// DELETE /books/:id
app.use('/books', verifyToken, authorizeRole('member', 'librarian'), (req, res) => {
  req.url = req.originalUrl; // ✅ preserve full path including /books
  console.log(`API Gateway → Book Service: ${req.method} ${req.originalUrl}`);
  proxy.web(req, res, { target: 'http://nginx:80' });
});

// Borrow routes
// POST   /borrow          — member
// PATCH  /borrow/return/:bookId  — member
// GET    /borrow/history  — member
// GET    /borrow/all      — librarian
// GET    /borrow/overdue  — librarian
app.use('/borrow', verifyToken, (req, res, next) => {
  const method = req.method;
  const path = req.path;

  // Member only
  if (method === 'POST' && path === '/') return authorizeRole('member')(req, res, next);
  if (method === 'PATCH' && path.startsWith('/return')) return authorizeRole('member')(req, res, next);
  if (method === 'GET' && path === '/history') return authorizeRole('member')(req, res, next);

  // Librarian only
  if (method === 'GET' && path === '/all') return authorizeRole('librarian')(req, res, next);
  if (method === 'GET' && path === '/overdue') return authorizeRole('librarian')(req, res, next);

  // No matching route
  res.status(404).json({ error: 'Route not found' });
}, (req, res) => {
  req.url = req.originalUrl;
  console.log(`API Gateway → Borrow Service: ${req.method} ${req.originalUrl}`);
  proxy.web(req, res, { target: 'http://borrow_service:3002' });
});

app.listen(process.env.PORT || 4000, () => {
  console.log(`API Gateway running on port ${process.env.PORT || 4000}`);
});