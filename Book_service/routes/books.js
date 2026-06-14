const express = require('express');
const router = express.Router();
const verifyToken = require('../../shared/middleware/verifyToken');
const authorizeRole = require('../../shared/middleware/authorizeRole');
const librarian = require('../controllers/librarian');
const member = require('../controllers/member');
const Book = require('../models/Books'); // add this at top if not there

// Member + librarian routes
router.get('/', verifyToken, authorizeRole('member', 'librarian'), librarian.getAllBooks);
router.get('/:id', verifyToken, authorizeRole('member', 'librarian'), member.getBook);

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


// const express = require('express');
// const router = express.Router();
// const Book = require('../models/books');

// // Get all books
// router.get('/', async (req, res) => {
//     try {
//         const books = await Book.find();
//         res.json(books);
//     } catch (err) {
//         res.status(500).json({ message: err.message});
//     }
// });

// // Get one book by id
// router.get('/:id', getBook, async (req, res) => {
//     res.json(res.book);
// });

// // Create a new book
// router.post('/',  async (req, res) => {
//     const book = new Book({
//         title: req.body.title,
//         author: req.body.author,
//         isbn: req.body.isbn,
//         genre: req.body.genre,
//         publishedYear: req.body.publishedYear,
//         description: req.body.description,
//         availableCopies: req.body.availableCopies
//     })
//     try {
//         const newBook = await book.save();
//         res.status(201).json(newBook);
//     } catch (err) {
//         res.status(400).json({ message: err.message});
//     }
// });

// // Update a book by id
// router.patch('/:id', getBook, async (req, res) => {
//     if (req.body.title != null) {
//         res.book.title = req.body.title
//     } 
//     if (req.body.author != null) {
//         res.book.author = req.body.author
//     }
//     if (req.body.isbn != null) {
//         res.book.isbn = req.body.isbn
//     }
//     if (req.body.genre != null) {
//         res.book.genre = req.body.genre
//     }
//     if (req.body.publishedYear != null) {
//         res.book.publishedYear = req.body.publishedYear
//     }
//     if (req.body.description != null) {
//         res.book.description = req.body.description
//     }
//     if (req.body.availableCopies != null) {
//         res.book.availableCopies = req.body.availableCopies
//     }
//     try {
//         const updatedBook = await res.book.save();
//         res.json(updatedBook)
//     } catch (err) {
//         res.status(400).json({ message: err.message});
//     }
// });

// // Delete a book by id
// router.delete('/:id', getBook, async (req, res) => {
//     try {
//         await res.book.deleteOne();
//         res.json({ message: 'Deleted book successfully'});
//     } catch (err) {
//         res.status(500).json({ message: err.message});
//     }
// });

// async function getBook(req, res, next) {
//     let book;
//     try {
//         book = await Book.findById(req.params.id);
//         if (book == null) {
//             return res.status(404).json({ message: 'Cannot find book' });
//         }
//     } catch (err) {
//         return res.status(500).json({ message: err.message });  
//     }

//     res.book = book;
//     next();
// }

// module.exports = router;