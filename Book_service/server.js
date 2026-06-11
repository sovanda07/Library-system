const express = require('express');
const app = express();
const mongoose = require('mongoose');

app.use(express.json());

const dbconnect = require('./config/db.js');

const bookRouter = require('./routes/books');
app.use('/books', bookRouter);

app.listen(3001, () => {
    console.log("Book service running on port 3001");
})