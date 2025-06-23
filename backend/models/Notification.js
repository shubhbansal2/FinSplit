const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
  userId: { type: String, required: true }, // or ObjectId if you have a User model
  type: { type: String, required: true }, // e.g., 'invite', 'settled', 'owe'
  message: { type: String, required: true },
  read: { type: Boolean, default: false },
  data: { type: Object }, // optional, for extra info (groupId, amount, etc.)
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Notification', NotificationSchema); 