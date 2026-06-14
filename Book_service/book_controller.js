const Book = require('../models/Book');

async function getAllBooks(req, res) {
    try {
        const books = await Book.find();
        res.json(books);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
}

async function searchBook(req, res) {
    try {
        const { title, isbn, author, genre, publishedYear } = req.query;

        if (!title && !isbn && !author && !genre && !publishedYear) {
            return res.status(400).json({ message: 'Please provide at least one search parameter' });
        }

        const filter = {};
        if (title)         filter.title        = { $regex: `^${title}$`, $options: 'i' };
        if (isbn)          filter.isbn          = isbn;
        if (author)        filter.author        = { $regex: author, $options: 'i' };
        if (genre)         filter.genre         = { $regex: genre,  $options: 'i' };
        if (publishedYear) filter.publishedYear = Number(publishedYear);

        const books = await Book.find(filter);

        if (books.length === 0) {
            return res.status(404).json({ message: 'No books found' });
        }

        res.json(books);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
}

async function addBook(req, res) {
    const book = new Book({
        title:           req.body.title,
        author:          req.body.author,
        isbn:            req.body.isbn,
        genre:           req.body.genre,
        publishedYear:   req.body.publishedYear,
        description:     req.body.description,
        availableCopies: req.body.availableCopies
    });

    try {
        const newBook = await book.save();
        res.status(201).json(newBook);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
}

async function updateBook(req, res) {
    if (req.body.title           != null) res.book.title           = req.body.title;
    if (req.body.author          != null) res.book.author          = req.body.author;
    if (req.body.isbn            != null) res.book.isbn            = req.body.isbn;
    if (req.body.genre           != null) res.book.genre           = req.body.genre;
    if (req.body.publishedYear   != null) res.book.publishedYear   = req.body.publishedYear;
    if (req.body.description     != null) res.book.description     = req.body.description;
    if (req.body.availableCopies != null) res.book.availableCopies = req.body.availableCopies;

    try {
        const updatedBook = await res.book.save();
        res.json(updatedBook);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
}

async function deleteBook(req, res) {
    try {
        await res.book.deleteOne();
        res.json({ message: 'Deleted book successfully' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
}

module.exports = { getAllBooks, searchBook, addBook, updateBook, deleteBook };