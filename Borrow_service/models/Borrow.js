const mongoose = require('mongoose');

const borrowSchema = new mongoose.Schema({
  memberId:  { type: String, required: true },
  bookId:    { type: mongoose.Schema.Types.ObjectId, ref: 'Book', required: true },
  borrowDate:{ type: Date, default: Date.now },
  dueDate:   { type: Date, required: true },
  returnDate:{ type: Date, default: null },
  status:    { type: String, enum: ['borrowed', 'returned', 'overdue'], default: 'borrowed' },
}, { timestamps: true });

module.exports = mongoose.model('Borrow', borrowSchema);