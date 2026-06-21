const express = require('express');
const router = express.Router();
const librarian = require('../controllers/librarian');
const member = require('../controllers/member');
const Book = require('../models/Books');

// Get all books
router.get('/', librarian.getAllBooks);

// Search books — must be before /:bookId
router.get('/search', member.searchBooks);

// Get one book
router.get('/:bookId', librarian.getBook);

// Add book
router.post('/', librarian.addBook);

// Edit book
router.patch('/:bookId', librarian.editBook);

// Delete book
router.delete('/:bookId', librarian.deleteBook);

// Internal routes for Borrow_service — no auth needed
router.patch('/:bookId/decrease', async (req, res) => {
  try {
    const book = await Book.findOneAndUpdate(
      { bookId: req.params.bookId },
      { $inc: { availableCopies: -1 } },
      { new: true }
    );
    res.json(book);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.patch('/:bookId/increase', async (req, res) => {
  try {
    const book = await Book.findOneAndUpdate(
      { bookId: req.params.bookId },
      { $inc: { availableCopies: 1 } },
      { new: true }
    );
    res.json(book);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;