const express = require('express');
const router = express.Router();
const Book = require('./book_schema');
const { getAllBooks, searchBook, addBook, updateBook, deleteBook } = require('../contoller/bookController');

router.get('/',        getAllBooks);
router.get('/search',  searchBook);
router.get('/:id',     getBook, (req, res) => res.json(res.book));
router.post('/',       addBook);
router.patch('/:id',   getBook, updateBook);
router.delete('/:id',  getBook, deleteBook);


module.exports = router;