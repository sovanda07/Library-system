const express = require('express');
const router = express.Router();
const verifyToken = require('../../shared/middleware/verifyToken');
const authorizeRole = require('../../shared/middleware/authorizeRole');
const member = require('../controllers/member');
const librarian = require('../controllers/librarian');

// Member routes
router.post('/borrow', verifyToken, authorizeRole('member'), member.borrowBook);
router.patch('/return/:bookId', verifyToken, authorizeRole('member'), member.returnBook);
router.get('/history', verifyToken, authorizeRole('member'), member.myHistory);

// Librarian routes
router.get('/all', verifyToken, authorizeRole('librarian'), librarian.getAllBorrows);
router.get('/overdue', verifyToken, authorizeRole('librarian'), librarian.getOverdue);

module.exports = router;