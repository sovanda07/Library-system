const Borrow = require('../models/Borrow');

const BOOK_SERVICE_URL = process.env.BOOK_SERVICE_URL;

// Borrow a book
exports.borrowBook = async (req, res) => {
  try {
    const bookResponse = await fetch(`${BOOK_SERVICE_URL}/books/find/${req.body.bookId}`, {
      headers: {
        'Authorization': req.headers.authorization
      }
    });
    const book = await bookResponse.json();

    if (!bookResponse.ok) return res.status(404).json({ message: 'Book not found' });

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

    await fetch(`${BOOK_SERVICE_URL}/books/${book._id}/decrease`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
    });

    res.status(201).json({ message: 'Book borrowed successfully', borrow });
  } catch (err) {
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

    // Update borrow record
    borrow.returnDate = new Date();
    borrow.status = 'returned';
    await borrow.save();

    // Get MongoDB _id from book service
    const bookResponse = await fetch(`${BOOK_SERVICE_URL}/books/find/${req.params.bookId}`, {
      headers: { 'Authorization': req.headers.authorization }
    });
    const book = await bookResponse.json();

    // Call Book_service to increase availableCopies by 1
    await fetch(`${BOOK_SERVICE_URL}/books/${book._id}/increase`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
    });

    res.json({ message: 'Book returned successfully', borrow });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// View own borrow history
exports.myHistory = async (req, res) => {
  try {
    const history = await Borrow.find({ memberId: req.user.memberId });

    // Fetch book details for each borrow record
    const historyWithBooks = await Promise.all(
      history.map(async (borrow) => {
        const bookResponse = await fetch(`${BOOK_SERVICE_URL}/books/find/${borrow.bookId}`, {
          headers: { 'Authorization': req.headers.authorization }
        });
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
    res.status(500).json({ message: err.message });
  }
};