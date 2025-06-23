const mongoose = require('mongoose');

const BillBuddyExpenseSchema = new mongoose.Schema({
  groupId: { type: mongoose.Schema.Types.ObjectId, ref: 'BillBuddyGroup', required: true },
  description: { type: String, required: true },
  amount: { type: Number, required: true },
  paidBy: { type: String, required: true },
  splitBetween: [{ type: String, required: true }],
  date: { type: Date, default: Date.now }
});

module.exports = mongoose.model('BillBuddyExpense', BillBuddyExpenseSchema); 