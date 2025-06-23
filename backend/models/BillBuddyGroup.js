const mongoose = require('mongoose');

const BillBuddyGroupSchema = new mongoose.Schema({
  name: { type: String, required: true },
  members: [{ type: String, required: true }],
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('BillBuddyGroup', BillBuddyGroupSchema); 