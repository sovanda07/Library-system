require('dotenv').config();
const express = require('express');
const app = express();
const connectDB = require('./config/db');

connectDB();

app.use(express.json());

app.use('/books', require('./routes/books'));

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log('Book service running on port ${PORT}');
});

// const express = require('express');
// const app = express();
// const mongoose = require('mongoose');

// app.use(express.json());

// const dbconnect = require('./config/db.js');

// const bookRouter = require('./routes/books');
// app.use('/books', bookRouter);

// app.listen(3001, () => {
//     console.log("Book service running on port 3001");
// })