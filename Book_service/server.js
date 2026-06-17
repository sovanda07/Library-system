require('dotenv').config();
const express = require('express');
const app = express();
const connectDB = require('./config/db');

connectDB();

app.use(express.json());

app.use('/books', require('./routes/books'));

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Book service running on port ${PORT}`);
});

