require('dotenv').config();
const express = require('express');
const app = express();
const connectDB = require('./config/db');

connectDB();

app.use(express.json());

app.use('/auth', require('./routes/registration'));
app.use('/auth', require('./routes/login'));
app.use('/auth', require('./routes/resetPassword'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Authentication service running on port ${PORT}`);
});