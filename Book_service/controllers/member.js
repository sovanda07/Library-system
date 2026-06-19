const Book = require('../models/Books');
const redis = require('../config/redis');
const { searchBooks } = require('./librarian');

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

exports.getBook = async (req, res) => {
  try {
    const cached = await redis.get(`book_${req.params.id}`);
    if (cached) {
      return res.json(JSON.parse(cached));
    }

    const book = await Book.findById(req.params.id);
    if (!book) return res.status(404).json({ message: 'Book not found' });

    await redis.set(`book_${req.params.id}`, JSON.stringify(book), 'EX', 3600);
    res.json(book);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Search by author and/or genre — both optional, can be used together
exports.searchBooks = async (req, res) => {
  try {
    const filter = {};

    if (req.query.author) {
      filter.author = { $regex: req.query.author, $options: 'i' };
    }
    if (req.query.genre) {
      filter.genre = { $regex: req.query.genre, $options: 'i' };
    }

    const books = await Book.find(filter);
    res.json(books);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

