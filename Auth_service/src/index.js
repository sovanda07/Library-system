require('dotenv').config();
const path = require('path');
const express = require('express');
const mongoose = require('mongoose');
const authRoutes = require('./auth.routes');

const app = express();

// View engine setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '..', 'views'));

// Serve static files (CSS, images) from the views folder
app.use(express.static(path.join(__dirname, '..', 'views')));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use('/api/auth', authRoutes);

// Render EJS pages
app.get('/', (req, res) => res.redirect('/login'));
app.get('/login', (req, res) => res.render('login', { error: null }));
app.get('/register', (req, res) => res.render('register', { error: null }));

app.get('/health', (req, res) => res.json({ status: 'ok', service: 'auth' }));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Auth service running on port ${PORT}`);
});