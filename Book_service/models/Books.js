const mongoose = require('mongoose');

const bookSchema = new mongoose.Schema({
  bookId:          { type: String, unique: true},
  title:           { type: String, required: true },
  author:          { type: String, required: true },
  isbn:            { type: String, unique: true },
  genre:           { type: String },
  publishedYear:   { type: Number },
  description:     { type: String },
  availableCopies: { type: Number, default: 1 },
}, { timestamps: true });

module.exports = mongoose.model('Book', bookSchema);


// {
//   "title": "Clean Code"
//   "author": "Robert Martin",
//   "isbn": "978-0132350885",
//   "genre": "horror",
//   "publishedYear": 2004
//   "description" : "a man turns to zombie, this when the tragic starts",
//   "availableCopies": 3
// }



//id