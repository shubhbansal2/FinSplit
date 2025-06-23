import axios from './axiosInstance';

const BASE = '/api/v1/billbuddy';

export const getGroups = () => axios.get(`${BASE}/groups`);
export const createGroup = (data) => axios.post(`${BASE}/groups`, data);
export const getGroupDetails = (groupId) => axios.get(`${BASE}/groups/${groupId}`);
export const addExpense = (data) => axios.post(`${BASE}/expenses`, data);
export const addSettlement = (data) => axios.post(`${BASE}/settlements`, data);
export const deleteGroup = (groupId) => axios.delete(`${BASE}/groups/${groupId}`);
export const deleteExpense = (expenseId) => axios.delete(`${BASE}/expenses/${expenseId}`);
export const deleteSettlement = (settlementId) => axios.delete(`${BASE}/settlements/${settlementId}`);
export const leaveGroup = (groupId, member) => axios.patch(`${BASE}/groups/${groupId}/leave`, { member });
export const updateExpense = (expenseId, data) => axios.patch(`${BASE}/expenses/${expenseId}`, data);
export const updateSettlement = (settlementId, data) => axios.patch(`${BASE}/settlements/${settlementId}`, data);
export const getNotifications = (userId) => axios.get(`${BASE}/notifications/${userId}`);
export const markNotificationRead = (notificationId) => axios.patch(`${BASE}/notifications/read/${notificationId}`);
export const acceptInvite = (notificationId, userId, groupId) => axios.post(`${BASE}/notifications/accept-invite`, { notificationId, userId, groupId });
export const declineInvite = (notificationId) => axios.post(`${BASE}/notifications/decline-invite`, { notificationId }); 