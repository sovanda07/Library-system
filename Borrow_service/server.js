require('dotenv').config();
const express = require('express');
const app = express();
const connectDB = require('./config/db');

connectDB();

app.use(express.json());

app.use('/borrow', require('./routes/borrow'));

const PORT = process.env.PORT || 3002;
app.listen(PORT, () => {
  console.log('Borrow service running on port ${PORT}');
});