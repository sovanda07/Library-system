const Book = require('../models/Books');
const redis = require('../config/redis');

// Get all books
exports.getAllBooks = async (req, res) => {
  try {
    const cached = await redis.get('all_books');
    if (cached) {
      return res.json(JSON.parse(cached));
    }

    const books = await Book.find();
    await redis.set('all_books', JSON.stringify(books), 'EX', 3600);

    res.json(books);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get one book — member sees limited info
exports.getBook = async (req, res) => {
  try {
    const cached = await redis.get(`book_${req.params.id}`);
    if (cached) {
      const book = JSON.parse(cached);
      return res.json({
        title: book.title,
        author: book.author,
        availableCopies: book.availableCopies
      });
    }

    const book = await Book.findById(req.params.id);
    if (!book) return res.status(404).json({ message: 'Book not found' });

    await redis.set(`book_${req.params.id}`, JSON.stringify(book), 'EX', 3600);

    res.json({
      title: book.title,
      author: book.author,
      availableCopies: book.availableCopies
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  getAllBooks: exports.getAllBooks,
  getBook: exports.getBook,
};