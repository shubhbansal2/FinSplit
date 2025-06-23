const express = require('express');
const router = express.Router();
const billBuddyController = require('../controllers/billBuddyController');

// Create a group
router.post('/groups', billBuddyController.createGroup);
// List all groups
router.get('/groups', billBuddyController.getGroups);
// Get group details (with expenses and settlements)
router.get('/groups/:groupId', billBuddyController.getGroupDetails);
// Add an expense
router.post('/expenses', billBuddyController.addExpense);
// Add a settlement
router.post('/settlements', billBuddyController.addSettlement);
// Delete a group
router.delete('/groups/:groupId', billBuddyController.deleteGroup);
// Delete an expense
router.delete('/expenses/:expenseId', billBuddyController.deleteExpense);
// Delete a settlement
router.delete('/settlements/:settlementId', billBuddyController.deleteSettlement);
// Leave a group
router.patch('/groups/:groupId/leave', billBuddyController.leaveGroup);
// Update an expense
router.patch('/expenses/:expenseId', billBuddyController.updateExpense);
// Update a settlement
router.patch('/settlements/:settlementId', billBuddyController.updateSettlement);
// Get notifications for a user
router.get('/notifications/:userId', billBuddyController.getNotifications);
// Mark a notification as read
router.patch('/notifications/read/:notificationId', billBuddyController.markNotificationRead);
// Accept a group invite
router.post('/notifications/accept-invite', billBuddyController.acceptInvite);
// Decline a group invite
router.post('/notifications/decline-invite', billBuddyController.declineInvite);
// Search users by name or email
router.get('/users/search', billBuddyController.searchUsers);

module.exports = router; 