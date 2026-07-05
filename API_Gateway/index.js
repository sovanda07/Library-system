const express = require('express');
const app = express();
const httpProxy = require('http-proxy');
const proxy = httpProxy.createProxyServer();
require('dotenv').config();

const verifyToken = require('../shared/middleware/verifyToken');
const authorizeRole = require('../shared/middleware/authorizeRole');

const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'http://auth_service:3000';
const BOOK_SERVICE_URL = process.env.BOOK_SERVICE_URL || 'http://nginx:80';
const BORROW_SERVICE_URL = process.env.BORROW_SERVICE_URL || 'http://borrow_service:3002';

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
  req.url = req.originalUrl.replace('/auth', '')
  proxy.web(req, res, { target: AUTH_SERVICE_URL });
});

// Get all books — member + librarian
app.get('/books', verifyToken, authorizeRole('member', 'librarian'), (req, res) => {
  req.url = req.originalUrl;
  proxy.web(req, res, { target: BOOK_SERVICE_URL });
});

// Search books — member + librarian
app.get('/books/search', verifyToken, authorizeRole('member', 'librarian'), (req, res) => {
  req.url = req.originalUrl;
  proxy.web(req, res, { target: BOOK_SERVICE_URL });
});

// Get one book — member + librarian
app.get('/books/:bookId', verifyToken, authorizeRole('member', 'librarian'), (req, res) => {
  req.url = req.originalUrl;
  proxy.web(req, res, { target: BOOK_SERVICE_URL });
});

// Add book — librarian only
app.post('/books', verifyToken, authorizeRole('librarian'), (req, res) => {
  req.url = req.originalUrl;
  proxy.web(req, res, { target: BOOK_SERVICE_URL });
});

// Edit book — librarian only
app.patch('/books/:bookId', verifyToken, authorizeRole('librarian'), (req, res) => {
  req.url = req.originalUrl;
  proxy.web(req, res, { target: BOOK_SERVICE_URL });
});

// Delete book — librarian only
app.delete('/books/:bookId', verifyToken, authorizeRole('librarian'), (req, res) => {
  req.url = req.originalUrl;
  proxy.web(req, res, { target: BOOK_SERVICE_URL });
});

// Increase/decrease copies — librarian only
app.patch('/books/:bookId/increase', verifyToken, authorizeRole('librarian'), (req, res) => {
  req.url = req.originalUrl;
  proxy.web(req, res, { target: BOOK_SERVICE_URL });
});

app.patch('/books/:bookId/decrease', verifyToken, authorizeRole('librarian'), (req, res) => {
  req.url = req.originalUrl;
  proxy.web(req, res, { target: BOOK_SERVICE_URL });
});

// Borrow a book — member + librarian
app.use('/borrow/borrow', verifyToken, authorizeRole('member', 'librarian'), (req, res) => {
  req.url = req.originalUrl;
  proxy.web(req, res, { target: BORROW_SERVICE_URL });
});

// Return a book — member + librarian
app.use('/borrow/return', verifyToken, authorizeRole('member', 'librarian'), (req, res) => {
  req.url = req.originalUrl;
  proxy.web(req, res, { target: BORROW_SERVICE_URL });
});

// Own borrow history — member + librarian
app.use('/borrow/history', verifyToken, authorizeRole('member', 'librarian'), (req, res) => {
  req.url = req.originalUrl;
  proxy.web(req, res, { target: BORROW_SERVICE_URL });
});

// All borrowings — librarian only
app.use('/borrow/all', verifyToken, authorizeRole('librarian'), (req, res) => {
  req.url = req.originalUrl;
  proxy.web(req, res, { target: BORROW_SERVICE_URL });
});

// Overdue books — librarian only
app.use('/borrow/overdue', verifyToken, authorizeRole('librarian'), (req, res) => {
  req.url = req.originalUrl;
  console.log(`API Gateway → Borrow Service: ${req.method} ${req.originalUrl}`);
  proxy.web(req, res, { target: BORROW_SERVICE_URL });
});

app.listen(process.env.PORT || 4000, () => {
  console.log(`API Gateway running on port ${process.env.PORT || 4000}`);
});