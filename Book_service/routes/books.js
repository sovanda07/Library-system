const express = require('express');
const router = express.Router();
const verifyToken = require('../../shared/middleware/verifyToken');
const authorizeRole = require('../../shared/middleware/authorizeRole');
const librarian = require('../controllers/librarian');
const member = require('../controllers/member');
const Book = require('../models/Books'); // add this at top if not there

// Shared routes (Both Members and Librarians)
router.get('/', verifyToken, authorizeRole('member', 'librarian'), librarian.getAllBooks);

// At lines 11-13 of routes/books.js
router.get('/search', verifyToken, authorizeRole('member', 'librarian'), member.searchBooks);

// 2. Generic wildcard route goes SECOND
router.get('/:id', verifyToken, authorizeRole('member', 'librarian'), member.getBook);
router.get('/find/:bookId', verifyToken, authorizeRole('member', 'librarian'), librarian.getBookByCustomId);


// Librarian only routes
router.post('/', verifyToken, authorizeRole('librarian'), librarian.addBook);
router.patch('/:id', verifyToken, authorizeRole('librarian'), librarian.editBook);
router.delete('/:id', verifyToken, authorizeRole('librarian'), librarian.deleteBook);

// Internal routes for Borrow_service
router.patch('/:id/decrease', async (req, res) => {
  try {
    const book = await Book.findByIdAndUpdate(
      req.params.id,
      { $inc: { availableCopies: -1 } },
      { new: true }
    );
    res.json(book);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.patch('/:id/increase', async (req, res) => {
  try {
    const book = await Book.findByIdAndUpdate(
      req.params.id,
      { $inc: { availableCopies: 1 } },
      { new: true }
    );
    res.json(book);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;