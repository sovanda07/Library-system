const Borrow = require('../models/Borrow');

const BOOK_SERVICE_URL = process.env.BOOK_SERVICE_URL;

// Borrow a book
exports.borrowBook = async (req, res) => {
  try {
    const url = `${BOOK_SERVICE_URL}/books/${req.body.bookId}`;
    const bookResponse = await fetch(url);

    if (!bookResponse.ok) return res.status(404).json({ message: 'Book not found' });

    const book = await bookResponse.json();

    if (book.availableCopies === 0) {
      return res.status(400).json({ message: 'No copies available' });
    }

    const existingBorrow = await Borrow.findOne({
      memberId: req.user.memberId,
      bookId: req.body.bookId,
      status: 'borrowed'
    });
    if (existingBorrow) {
      return res.status(400).json({ message: 'You already borrowed this book' });
    }

    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 14);

    const borrow = new Borrow({
      memberId: req.user.memberId,
      bookId: req.body.bookId,
      dueDate,
    });
    await borrow.save();

    await fetch(`${BOOK_SERVICE_URL}/books/${req.body.bookId}/decrease`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
    });

    res.status(201).json({
      message: 'Book borrowed successfully',
      borrow: {
        _id: borrow._id,
        memberId: borrow.memberId,
        name: req.user.name,
        email: req.user.email,
        bookId: borrow.bookId,
        bookTitle: book.title,
        borrowDate: borrow.borrowDate,
        dueDate: borrow.dueDate,
        returnDate: borrow.returnDate,
        status: borrow.status,
      }
    });
  } catch (err) {
    console.error('Borrow error:', err);
    res.status(500).json({ message: err.message });
  }
};

// Return a book
exports.returnBook = async (req, res) => {
  try {
    const borrow = await Borrow.findOne({
      memberId: req.user.memberId,
      bookId: req.params.bookId,
      status: 'borrowed'
    });
    if (!borrow) return res.status(404).json({ message: 'No active borrow found' });

    borrow.returnDate = new Date();
    borrow.status = 'returned';
    await borrow.save();

    await fetch(`${BOOK_SERVICE_URL}/books/${req.params.bookId}/increase`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
    });

    res.json({ message: 'Book returned successfully', borrow });
  } catch (err) {
    console.error('Return error:', err);
    res.status(500).json({ message: err.message });
  }
};

// View own borrow history
exports.myHistory = async (req, res) => {
  try {
    const history = await Borrow.find({ memberId: req.user.memberId });

    const historyWithBooks = await Promise.all(
      history.map(async (borrow) => {
        const bookResponse = await fetch(`${BOOK_SERVICE_URL}/books/${borrow.bookId}`);
        const book = await bookResponse.json();

        return {
          _id: borrow._id,
          memberId: borrow.memberId,
          bookId: borrow.bookId,
          book: {
            title: book.title,
            author: book.author,
            isbn: book.isbn,
            genre: book.genre,
            publishedYear: book.publishedYear,
            description: book.description,
          },
          borrowDate: borrow.borrowDate,
          dueDate: borrow.dueDate,
          returnDate: borrow.returnDate,
          status: borrow.status,
        };
      })
    );

    res.json(historyWithBooks);
  } catch (err) {
    console.error('History error:', err);
    res.status(500).json({ message: err.message });
  }
};