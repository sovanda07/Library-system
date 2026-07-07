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

// Get one book by custom bookId
exports.getBook = async (req, res) => {
  try {
    const cached = await redis.get(`book_${req.params.bookId}`);
    if (cached) {
      return res.json(JSON.parse(cached));
    }
    const book = await Book.findOne({ bookId: req.params.bookId });
    if (!book) return res.status(404).json({ message: 'Book not found' });
    await redis.set(`book_${req.params.bookId}`, JSON.stringify(book), 'EX', 3600);
    res.json(book);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Search by title, author, genre
exports.searchBooks = async (req, res) => {
  try {
    const filter = {};
    if (req.query.title) {
      filter.title = { $regex: req.query.title, $options: 'i' };
    }
    if (req.query.author) {
      filter.author = { $regex: req.query.author, $options: 'i' };
    }
    if (req.query.genre) {
      filter.genre = { $regex: req.query.genre, $options: 'i' };
    }
    const books = await Book.find(filter);
    if (books.length === 0) {
      return res.status(404).json({ message: 'No books found' });
    }
    res.json(books);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Add book — auto generate bookId
exports.addBook = async (req, res) => {
  try {
    let bookId;
    let isUnique = false;
    while (!isUnique) {
      const randomDigits = Math.floor(1000 + Math.random() * 9000);
      bookId = `B${randomDigits}`;
      const existing = await Book.findOne({ bookId });
      if (!existing) isUnique = true;
    }

    const book = new Book({
      bookId,
      title: req.body.title,
      author: req.body.author,
      isbn: req.body.isbn,
      genre: req.body.genre,
      publishedYear: req.body.publishedYear,
      description: req.body.description,
      availableCopies: req.body.availableCopies
    });

    const newBook = await book.save();
    await redis.del('all_books');
    res.status(201).json(newBook);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Edit book by custom bookId
exports.editBook = async (req, res) => {
  try {
    const book = await Book.findOneAndUpdate(
      { bookId: req.params.bookId },
      req.body,
      { new: true }
    );
    if (!book) return res.status(404).json({ message: 'Book not found' });
    await redis.del('all_books');
    await redis.del(`book_${req.params.id}`);
    res.json({ message: 'Book updated', book });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Delete book by custom bookId
exports.deleteBook = async (req, res) => {
  try {
    const book = await Book.findOneAndDelete({ bookId: req.params.bookId });
    if (!book) return res.status(404).json({ message: 'Book not found' });
    await redis.del('all_books');
    await redis.del(`book_${req.params.bookIdd}`);
    res.json({ message: 'Book deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};