const mongoose = require('mongoose');

const BillBuddySettlementSchema = new mongoose.Schema({
  groupId: { type: mongoose.Schema.Types.ObjectId, ref: 'BillBuddyGroup', required: true },
  from: { type: String, required: true },
  to: { type: String, required: true },
  amount: { type: Number, required: true },
  date: { type: Date, default: Date.now }
});

module.exports = mongoose.model('BillBuddySettlement', BillBuddySettlementSchema); 