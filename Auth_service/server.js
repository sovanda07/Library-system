require('dotenv').config();
const express = require('express');
const app = express();
const connectDB = require('./config/db');

connectDB();

app.use(express.json());

app.use('/auth', require('./routes/registration'));
app.use('/auth', require('./routes/login'));

app.listen(3000, () => {
  console.log('Authentication service running on port 3000');
});