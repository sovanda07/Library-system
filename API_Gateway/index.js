const express = require('express');
const app = express();
const httpProxy = require('http-proxy');
const proxy = httpProxy.createProxyServer();
require('dotenv').config();

const verifyToken = require('../shared/middleware/verifyToken');
const authorizeRole = require('../shared/middleware/authorizeRole');

// prevent gateway from crashing on proxy errors
proxy.on('error', (err, req, res) => {
  console.error('Proxy error:', err.message);
  res.status(502).json({ message: 'Service unavailable' });
});

// Auth routes — no token needed
// POST /auth/login
// POST /auth/register
// POST /auth/forgot-password
// POST /auth/reset-password
app.use('/auth', (req, res) => {
  req.url = req.originalUrl;
  proxy.web(req, res, { target: 'http://auth_service:3000' });
});

// Get all books — member + librarian
app.get('/books', verifyToken, authorizeRole('member', 'librarian'), (req, res) => {
  req.url = req.originalUrl;
  proxy.web(req, res, { target: 'http://nginx:80' });
});

// Search books — member + librarian
app.get('/books/search', verifyToken, authorizeRole('member', 'librarian'), (req, res) => {
  req.url = req.originalUrl;
  proxy.web(req, res, { target: 'http://nginx:80' });
});

// Get one book — member + librarian
app.get('/books/:bookId', verifyToken, authorizeRole('member', 'librarian'), (req, res) => {
  req.url = req.originalUrl;
  proxy.web(req, res, { target: 'http://nginx:80' });
});

// Add book — librarian only
app.post('/books', verifyToken, authorizeRole('librarian'), (req, res) => {
  req.url = req.originalUrl;
  proxy.web(req, res, { target: 'http://nginx:80' });
});

// Edit book — librarian only
app.patch('/books/:bookId', verifyToken, authorizeRole('librarian'), (req, res) => {
  req.url = req.originalUrl;
  proxy.web(req, res, { target: 'http://nginx:80' });
});

// Delete book — librarian only
app.delete('/books/:bookId', verifyToken, authorizeRole('librarian'), (req, res) => {
  req.url = req.originalUrl;
  proxy.web(req, res, { target: 'http://nginx:80' });
});

// Increase/decrease copies — librarian only
app.patch('/books/:bookId/increase', verifyToken, authorizeRole('librarian'), (req, res) => {
  req.url = req.originalUrl;
  proxy.web(req, res, { target: 'http://nginx:80' });
});

app.patch('/books/:bookId/decrease', verifyToken, authorizeRole('librarian'), (req, res) => {
  req.url = req.originalUrl;
  proxy.web(req, res, { target: 'http://nginx:80' });
});

// Borrow a book — member + librarian
app.use('/borrow/borrow', verifyToken, authorizeRole('member', 'librarian'), (req, res) => {
  req.url = req.originalUrl;
  proxy.web(req, res, { target: 'http://borrow_service:3002' });
});

// Return a book — member + librarian
app.use('/borrow/return', verifyToken, authorizeRole('member', 'librarian'), (req, res) => {
  req.url = req.originalUrl;
  proxy.web(req, res, { target: 'http://borrow_service:3002' });
});

// Own borrow history — member + librarian
app.use('/borrow/history', verifyToken, authorizeRole('member', 'librarian'), (req, res) => {
  req.url = req.originalUrl;
  proxy.web(req, res, { target: 'http://borrow_service:3002' });
});

// All borrowings — librarian only
app.use('/borrow/all', verifyToken, authorizeRole('librarian'), (req, res) => {
  req.url = req.originalUrl;
  proxy.web(req, res, { target: 'http://borrow_service:3002' });
});

// Overdue books — librarian only
app.use('/borrow/overdue', verifyToken, authorizeRole('librarian'), (req, res) => {
  req.url = req.originalUrl;
  console.log(`API Gateway → Borrow Service: ${req.method} ${req.originalUrl}`);
  proxy.web(req, res, { target: 'http://borrow_service:3002' });
});

app.listen(process.env.PORT || 4000, () => {
  console.log(`API Gateway running on port ${process.env.PORT || 4000}`);
});