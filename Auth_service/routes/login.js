const express = require('express');
const router = express.Router();
const User = require('../models/Users');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

router.post('/login', async (req, res) => {
  try {
    // Find user by email
    const user = await User.findOne({ email: req.body.email });
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Check password
    const validPassword = await bcrypt.compare(req.body.password, user.password);
    if (!validPassword) return res.status(401).json({ message: 'Invalid password' });

    // Sign token
    const token = jwt.sign(
      { userId: user._id, role: user.role, memberId: user.memberId },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(200).json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        memberId: user.memberId,
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;


// const express = require('express');
// const app = express();

// const jwt = require('jsonwebtoken')
// require('dotenv').config();

// app.use(express.json());

// const JWT_SECRETE = process.env.JWT_SECRETE;

// // LOGIN API
// app.post("/login", (req, res) => {
//   const {username, password } = req.body;
//   const user = users.find(u => u.username === username && u.password === password);
//       if (user) {
//         const token = jwt.sign({ 
//           username: user.username, role: user.role }, JWT_SECRETE, { expiresIn: '24h' })
//         return res.json({ token })
//       }
//       else {
//         res.status(400).send("Invalid user")
//       }
//     }) //CLOSE THEN
// //CLOSE CALLBACK FUNCTION BODY
// //CLOSE Post METHOD

// app.listen(5004, () => {
//     console.log('Authentication Service Server is running on PORT NO: 5002')
// })


// 1 & 2 — app vs router and creating express()

// app is the whole server — only created once in server.js
// router is just a mini route handler — what route files use
// Think of it like: app is the restaurant, router is just the menu section

// 3 — Hardcoded users array

// Probably copied from a tutorial that used fake data to explain JWT
// Works for learning JWT concept but useless in real app
// Real app always reads from database

// 4 — No bcrypt

// Passwords in DB are hashed so you can't compare directly
// user.password in DB looks like $2b$10$xyz... not mypassword123
// bcrypt.compare() does the hash comparison for you

// 5 — app.listen() in route file

// Only one thing should start the server — server.js
// Having it in a route file means you're starting multiple servers
// Route files just define what happens at each URL, nothing more

// 6 — JWT_SECRETE typo

// process.env.JWT_SECRETE → undefined
// Token would be signed with undefined as secret
// Every token verification would fail silently

// 7 — Missing module.exports

// Without it require('./routes/login') in server.js returns empty object
// Your routes simply don't exist to the server