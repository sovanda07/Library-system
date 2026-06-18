const mongoose = require('mongoose');

// User schema
const userSchema = new mongoose.Schema({
  name:     { type: String, required: true },
  email:    { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true },
  role:     { type: String, enum: ['member', 'librarian'], default: 'member' },
  memberId: { type: String, unique: true, sparse: true },
  resetToken: { type: String, default: null },
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);

// {
//   "name": "Jane Doe",
//   "email": "jane.doe@example.com",
//   "password": "$2b$10$X7rE8k9P0wQ2m...",
//   "role": "member",
// }

//   "email": "jane.doe@example.com",
//   "password": "$2b$10$X7rE8k9P0wQ2m...",


// email

// token, newPassword

