const express = require('express');
const route = express.Router();
const User = require('../models/users');
const bcrypt = require('bcrypt');

// Registration 
route.post('/register', async (req, res) => {
    try {
        // Generate unique memberId
        let memberId;
        let isUnique = false;

        while (!isUnique) {
            const randomDigits = Math.floor(1000 + Math.random() * 9000);
            memberId = `U${randomDigits}`;
            const existing = await User.findOne({ memberId });
            if (!existing) isUnique = true;
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(req.body.password, salt);

        // Create user
        const user = new User({
            name: req.body.name,
            email: req.body.email,
            password: hashedPassword,
            memberId: memberId,
            role: req.body.role || 'member',
        });

        const savedUser = await user.save();

        res.status(201).json({
            message: 'Registration successful',
            user: {
                id: savedUser._id,
                name: savedUser.name,
                email: savedUser.email,
                role: savedUser.role,
                memberId: savedUser.memberId,
            }
        });
    } catch (err) {
        if (err.code === 11000) {
            return res.status(409).json({ message: 'Email already in use' });
        }
        res.status(500).json({ message: err.message });
    }
});
module.exports = router;