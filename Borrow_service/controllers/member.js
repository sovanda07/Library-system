const Borrow = require('../models/Borrow');

const BOOK_SERVICE_URL = process.env.BOOK_SERVICE_URL;

// Borrow a book
exports.borrowBook = async (req, res) => {
  try {
    // Call Book_service to check availability
    const bookResponse = await fetch(`${BOOK_SERVICE_URL}/books/${req.body.bookId}`);
    const book = await bookResponse.json();

    if (!bookResponse.ok) return res.status(404).json({ message: 'Book not found' });

    // Check if book is available
    if (book.availableCopies === 0) {
      return res.status(400).json({ message: 'No copies available' });
    }

    // Check if member already borrowed this book
    const existingBorrow = await Borrow.findOne({
      memberId: req.user.memberId,
      bookId: req.body.bookId,
      status: 'borrowed'
    });
    if (existingBorrow) {
      return res.status(400).json({ message: 'You already borrowed this book' });
    }

    // Calculate due date — 14 days from now
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 14);

    // Create borrow record
    const borrow = new Borrow({
      memberId: req.user.memberId,
      bookId: req.body.bookId,
      dueDate,
    });
    await borrow.save();

    // Call Book_service to decrease availableCopies by 1
    await fetch(`${BOOK_SERVICE_URL}/books/${req.body.bookId}/decrease`, {
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

    // Call Book_service to increase availableCopies by 1
    await fetch(`${BOOK_SERVICE_URL}/books/${req.params.bookId}/increase`, {
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
    const history = await Borrow.find({ memberId: req.user.memberId })
      .populate('bookId', 'title author');
    res.json(history);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};