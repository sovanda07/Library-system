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

// {
//   "bookId": "65f1c9f9b3d8e412a8b45699",
// }



// borrrow
// {
//   "memberId": "6a32b6eb37080fc26279d3a3",
//   "bookId": "6a2e0308ee066ee7e5cd08ad"
// }