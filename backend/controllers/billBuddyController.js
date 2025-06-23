const BillBuddyGroup = require('../models/BillBuddyGroup');
const BillBuddyExpense = require('../models/BillBuddyExpense');
const BillBuddySettlement = require('../models/BillBuddySettlement');
const Notification = require('../models/Notification');
const User = require('../models/User');

// Create a new group
exports.createGroup = async (req, res) => {
  try {
    const { name, members } = req.body;
    if (!name || !Array.isArray(members) || members.length === 0) {
      return res.status(400).json({ error: 'Group name and at least one member are required.' });
    }
    const group = await BillBuddyGroup.create({ name, members });
    res.status(201).json(group);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Get all groups
exports.getGroups = async (req, res) => {
  try {
    const groups = await BillBuddyGroup.find();
    res.json(groups);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get group details (with expenses and settlements)
exports.getGroupDetails = async (req, res) => {
  try {
    const { groupId } = req.params;
    const group = await BillBuddyGroup.findById(groupId);
    if (!group) return res.status(404).json({ error: 'Group not found' });
    const expenses = await BillBuddyExpense.find({ groupId });
    const settlements = await BillBuddySettlement.find({ groupId });
    res.json({ group, expenses, settlements });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Helper to create a notification
async function createNotification(userId, type, message, data = {}) {
  await Notification.create({ userId, type, message, data });
}

// Add an expense
exports.addExpense = async (req, res) => {
  try {
    const { groupId, description, amount, paidBy, splitBetween } = req.body;
    if (!groupId || !description || !amount || !paidBy || !Array.isArray(splitBetween) || splitBetween.length === 0) {
      return res.status(400).json({ error: 'All fields are required for adding an expense.' });
    }
    if (isNaN(Number(amount)) || Number(amount) <= 0) {
      return res.status(400).json({ error: 'Amount must be a positive number.' });
    }
    const expense = await BillBuddyExpense.create({ groupId, description, amount, paidBy, splitBetween });
    // Fetch group name
    const group = await BillBuddyGroup.findById(groupId);
    // Notify those who owe (excluding payer)
    for (const member of splitBetween) {
      if (member !== paidBy) {
        await createNotification(
          member,
          'owe',
          `You owe ₹${(amount / splitBetween.length).toFixed(2)} to ${paidBy} for "${description}"`,
          { groupId, groupName: group?.name, expenseId: expense._id, amount: amount / splitBetween.length, paidBy }
        );
      }
    }
    res.status(201).json(expense);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Add a settlement
exports.addSettlement = async (req, res) => {
  try {
    const { groupId, from, to, amount } = req.body;
    if (!groupId || !from || !to || !amount) {
      return res.status(400).json({ error: 'All fields are required for adding a settlement.' });
    }
    if (isNaN(Number(amount)) || Number(amount) <= 0) {
      return res.status(400).json({ error: 'Amount must be a positive number.' });
    }
    const settlement = await BillBuddySettlement.create({ groupId, from, to, amount });
    // Fetch group name
    const group = await BillBuddyGroup.findById(groupId);
    // Notify payer (from) and payee (to)
    await createNotification(
      from,
      'settled',
      `You paid ₹${amount} to ${to} (settled up)`,
      { groupId, groupName: group?.name, settlementId: settlement._id, amount, to }
    );
    await createNotification(
      to,
      'received',
      `${from} paid you ₹${amount} (settled up)`,
      { groupId, groupName: group?.name, settlementId: settlement._id, amount, from }
    );
    res.status(201).json(settlement);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Delete a group
exports.deleteGroup = async (req, res) => {
  try {
    const { groupId } = req.params;
    await BillBuddyGroup.findByIdAndDelete(groupId);
    await BillBuddyExpense.deleteMany({ groupId });
    await BillBuddySettlement.deleteMany({ groupId });
    res.json({ message: 'Group and related data deleted.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Delete an expense
exports.deleteExpense = async (req, res) => {
  try {
    const { expenseId } = req.params;
    await BillBuddyExpense.findByIdAndDelete(expenseId);
    res.json({ message: 'Expense deleted.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Delete a settlement
exports.deleteSettlement = async (req, res) => {
  try {
    const { settlementId } = req.params;
    await BillBuddySettlement.findByIdAndDelete(settlementId);
    res.json({ message: 'Settlement deleted.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Leave a group
exports.leaveGroup = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { member } = req.body;
    if (!member) return res.status(400).json({ error: 'Member is required.' });
    const group = await BillBuddyGroup.findById(groupId);
    if (!group) return res.status(404).json({ error: 'Group not found' });
    group.members = group.members.filter(m => m !== member);
    if (group.members.length === 0) {
      await BillBuddyGroup.findByIdAndDelete(groupId);
      await BillBuddyExpense.deleteMany({ groupId });
      await BillBuddySettlement.deleteMany({ groupId });
      return res.json({ message: 'Group deleted as no members remain.' });
    } else {
      await group.save();
      return res.json({ message: 'Left group', group });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Update an expense
exports.updateExpense = async (req, res) => {
  try {
    const { expenseId } = req.params;
    const { description, amount, paidBy, splitBetween } = req.body;
    const expense = await BillBuddyExpense.findByIdAndUpdate(
      expenseId,
      { description, amount, paidBy, splitBetween },
      { new: true }
    );
    if (!expense) return res.status(404).json({ error: 'Expense not found' });
    res.json(expense);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Update a settlement
exports.updateSettlement = async (req, res) => {
  try {
    const { settlementId } = req.params;
    const { from, to, amount } = req.body;
    const settlement = await BillBuddySettlement.findByIdAndUpdate(
      settlementId,
      { from, to, amount },
      { new: true }
    );
    if (!settlement) return res.status(404).json({ error: 'Settlement not found' });
    res.json(settlement);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Get notifications for a user
exports.getNotifications = async (req, res) => {
  try {
    const { userId } = req.params;
    const notifications = await Notification.find({ userId }).sort({ createdAt: -1 });
    res.json(notifications);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Mark a notification as read
exports.markNotificationRead = async (req, res) => {
  try {
    const { notificationId } = req.params;
    const notification = await Notification.findByIdAndUpdate(notificationId, { read: true }, { new: true });
    if (!notification) return res.status(404).json({ error: 'Notification not found' });
    res.json(notification);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Accept a group invite
exports.acceptInvite = async (req, res) => {
  try {
    const { notificationId, userId, groupId } = req.body;
    const group = await BillBuddyGroup.findById(groupId);
    if (!group) return res.status(404).json({ error: 'Group not found' });
    if (!group.members.includes(userId)) {
      group.members.push(userId);
      await group.save();
    }
    await Notification.findByIdAndUpdate(notificationId, { read: true, type: 'invite-accepted' });
    res.json({ message: 'Invite accepted', group });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Decline a group invite
exports.declineInvite = async (req, res) => {
  try {
    const { notificationId } = req.body;
    await Notification.findByIdAndUpdate(notificationId, { read: true, type: 'invite-declined' });
    res.json({ message: 'Invite declined' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Search users by name or email
exports.searchUsers = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.length < 2) return res.json([]);
    const regex = new RegExp(q, 'i');
    const users = await User.find({
      $or: [
        { fullName: regex },
        { email: regex }
      ]
    }).select('_id fullName email profileImageUrl');
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}; 