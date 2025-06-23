import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import AddGroupModal from '../../components/billbuddy/AddGroupModal';
import { getGroups, createGroup, leaveGroup } from '../../utils/billBuddyApi';
import SideMenu from '../../components/layouts/SideMenu';
import Navbar from '../../components/layouts/Navbar';
import { UserContext } from '../../context/UserContext';
import axiosInstance from '../../utils/axiosInstance';

const BillBuddy = () => {
  const [isAddGroupOpen, setAddGroupOpen] = useState(false);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [leavingGroupId, setLeavingGroupId] = useState(null);
  const navigate = useNavigate();
  const { user } = useContext(UserContext);
  const [groupName, setGroupName] = useState('');
  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedMembers, setSelectedMembers] = useState([]);

  useEffect(() => {
    console.log('isAddGroupOpen:', isAddGroupOpen);
  }, [isAddGroupOpen]);

  // Defensive: never open modal on mount
  useEffect(() => {
    setAddGroupOpen(false);
  }, []);

  useEffect(() => {
    setLoading(true);
    getGroups()
      .then(res => {
        setGroups(res.data);
        setLoading(false);
      })
      .catch(err => {
        setError('Failed to load groups');
        setLoading(false);
      });
  }, []);

  const handleAddGroup = async (group) => {
    setError('');
    try {
      const res = await createGroup(group);
      setGroups(prev => [...prev, res.data]);
      setAddGroupOpen(false);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create group');
    }
  };

  const handleLeaveGroup = async (groupId) => {
    if (!user?.fullName) return;
    if (!window.confirm('Are you sure you want to leave this group?')) return;
    setLeavingGroupId(groupId);
    try {
      await leaveGroup(groupId, user.fullName);
      setGroups(prev => prev.filter(g => g._id !== groupId));
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to leave group');
    }
    setLeavingGroupId(null);
  };

  const handleSearch = async (q) => {
    setSearch(q);
    if (!q || q.length < 2) {
      setSearchResults([]);
      return;
    }
    setLoading(true);
    try {
      const res = await axiosInstance.get(`/billbuddy/users/search?q=${encodeURIComponent(q)}`);
      console.log('User search results:', res.data);
      setSearchResults(res.data.filter(u => !selectedMembers.some(m => m._id === u._id)));
    } catch (err) {
      setSearchResults([]);
    }
    setLoading(false);
  };

  const handleAddMember = (user) => {
    setSelectedMembers([...selectedMembers, user]);
    setSearch('');
    setSearchResults([]);
  };

  const handleRemoveMember = (userId) => {
    setSelectedMembers(selectedMembers.filter(m => m._id !== userId));
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />
      <div className="flex">
        <SideMenu activeMenu="BillBuddy" />
        <main className="flex-1 p-6 max-w-2xl mx-auto">
          <div className="mb-6 bg-white rounded-xl shadow p-6">
            <h2 className="text-2xl font-bold mb-4 text-primary">BillBuddy</h2>
            {loading ? (
              <p className="text-gray-500">Loading groups...</p>
            ) : error ? (
              <p className="text-red-500">{error}</p>
            ) : groups.filter(g => g.members.includes(user?.fullName) || g.members.includes(user?.email)).length === 0 ? (
              <div className="flex flex-col items-center gap-4">
                <p className="text-gray-500">No groups yet. Create your first group!</p>
                <button
                  className="btn-primary px-4 py-2 w-full"
                  onClick={() => setAddGroupOpen(true)}
                >
                  + Create New Group
                </button>
              </div>
            ) : (
              <>
                <button
                  className="bg-primary text-white rounded-lg px-4 py-2 font-medium hover:bg-primary-dark transition mb-4"
                  onClick={() => setAddGroupOpen(true)}
                >
                  + Create New Group
                </button>
                <ul className="space-y-2">
                  {groups.filter(g => {
                    const isMember = g.members.includes(user?.fullName) || g.members.includes(user?.email);
                    if (!isMember) {
                      console.log('Group', g.name, 'does not include user', user?.fullName, user?.email, 'in', g.members);
                    }
                    return isMember;
                  }).map(group => (
                    <li
                      key={group._id}
                      className="bg-gray-50 rounded-lg px-4 py-2 flex flex-col sm:flex-row sm:items-center sm:justify-between hover:bg-gray-100 transition"
                    >
                      <div className="flex-1 cursor-pointer" onClick={() => navigate(`/billbuddy/group/${group._id}`)}>
                        <span className="font-medium text-lg">{group.name}</span>
                      </div>
                      <button
                        className="ml-4 bg-red-500 text-white rounded-lg px-3 py-1 text-sm font-medium hover:bg-red-600 transition"
                        onClick={() => handleLeaveGroup(group._id)}
                        disabled={leavingGroupId === group._id}
                      >
                        {leavingGroupId === group._id ? 'Leaving...' : 'Leave Group'}
                      </button>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
          <AddGroupModal isOpen={isAddGroupOpen} onClose={() => setAddGroupOpen(false)} onAddGroup={handleAddGroup} />
        </main>
      </div>
    </div>
  );
};

export default BillBuddy; 