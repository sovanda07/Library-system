require('dotenv').config();
const express = require('express');
const app = express();
const connectDB = require('./config/db');

connectDB();

app.use(express.json());

app.use('/', require('./routes/registration'));
app.use('/', require('./routes/login'));
app.use('/', require('./routes/resetPassword'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Authentication service running on port ${PORT}`);
});