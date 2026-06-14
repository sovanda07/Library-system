const Borrow = require('../models/Borrow');

const BOOK_SERVICE_URL = process.env.BOOK_SERVICE_URL;

// View all borrowings
exports.getAllBorrows = async (req, res) => {
  try {
    const borrows = await Borrow.find();

    // Call Book_service to get book details for each borrow
    const borrowsWithBooks = await Promise.all(
      borrows.map(async (borrow) => {
        const bookResponse = await fetch(`${BOOK_SERVICE_URL}/books/${borrow.bookId}`);
        const book = await bookResponse.json();
        return { ...borrow.toObject(), book };
      })
    );

    res.json(borrowsWithBooks);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// View overdue books
exports.getOverdue = async (req, res) => {
  try {
    await Borrow.updateMany(
      { dueDate: { $lt: new Date() }, status: 'borrowed' },
      { status: 'overdue' }
    );

    const overdue = await Borrow.find({ status: 'overdue' });

    // Call Book_service to get book details for each overdue
    const overdueWithBooks = await Promise.all(
      overdue.map(async (borrow) => {
        const bookResponse = await fetch(`${BOOK_SERVICE_URL}/books/${borrow.bookId}`);
        const book = await bookResponse.json();
        return { ...borrow.toObject(), book };
      })
    );

    res.json(overdueWithBooks);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};