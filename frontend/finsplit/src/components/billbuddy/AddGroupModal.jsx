import React, { useState, useRef, useEffect, useContext } from 'react';
import Input from '../Inputs/Input';
import axiosInstance from '../../utils/axiosInstance';
import CharAvatar from '../cards/CharAvatar';
import { UserContext } from '../../context/UserContext';

const AddGroupModal = ({ isOpen, onClose, onAddGroup }) => {
  const { user } = useContext(UserContext);
  const [groupName, setGroupName] = useState('');
  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const searchInputRef = useRef(null);
  const dropdownRef = useRef(null);

  useEffect(() => {
    if (search && searchResults.length > 0) {
      setDropdownOpen(true);
    } else {
      setDropdownOpen(false);
    }
  }, [search, searchResults]);

  useEffect(() => {
    function handleClickOutside(e) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target) &&
        searchInputRef.current &&
        !searchInputRef.current.contains(e.target)
      ) {
        setDropdownOpen(false);
      }
    }
    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [dropdownOpen]);

  const handleInputKeyDown = (e) => {
    if (!dropdownOpen || searchResults.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev + 1) % searchResults.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev - 1 + searchResults.length) % searchResults.length);
    } else if (e.key === 'Enter') {
      if (highlightedIndex >= 0 && highlightedIndex < searchResults.length) {
        e.preventDefault();
        handleAddMember(searchResults[highlightedIndex]);
      }
    } else if (e.key === 'Escape') {
      setDropdownOpen(false);
    }
  };

  const handleSearch = async (q) => {
    setSearch(q);
    if (!q || q.length < 2) {
      setSearchResults([]);
      return;
    }
    setLoading(true);
    try {
      const res = await axiosInstance.get(`/api/v1/billbuddy/users/search?q=${encodeURIComponent(q)}`);
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

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!groupName.trim() || selectedMembers.length === 0) {
      setError('Please enter a group name and add at least one member.');
      return;
    }
    const currentUserId = user?.email || user?.fullName;
    const memberList = [
      ...selectedMembers.map(u => u.email || u.fullName),
      currentUserId
    ].filter((v, i, a) => v && a.indexOf(v) === i);
    onAddGroup({ name: groupName, members: memberList });
    setGroupName('');
    setSelectedMembers([]);
    setSearch('');
    setSearchResults([]);
    setError('');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-20 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-xl shadow-lg min-w-[340px] w-full max-w-sm relative">
        <h3 className="text-lg font-semibold mb-4">Add New Group</h3>
        <form onSubmit={handleSubmit} autoComplete="off">
          <div className="mb-3">
            <Input
              label="Group Name:"
              placeholder="Enter group name"
              value={groupName}
              onChange={e => setGroupName(e.target.value)}
              type="text"
            />
          </div>
          <div className="mb-3 relative">
            <label className="block text-sm font-medium mb-1">Add Members:</label>
            <input
              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Search by name or email"
              value={search}
              onChange={e => handleSearch(e.target.value)}
              type="text"
              autoComplete="off"
              ref={searchInputRef}
              onFocus={() => { if (searchResults.length > 0) setDropdownOpen(true); }}
              onKeyDown={handleInputKeyDown}
            />
            {dropdownOpen && search && (searchResults.length > 0 || loading) && (
              <div ref={dropdownRef} className="absolute left-0 right-0 bg-white border rounded-lg shadow-lg mt-1 z-10 max-h-48 overflow-y-auto">
                {searchResults.map((user, idx) => (
                  <div
                    key={user._id}
                    className={`flex items-center gap-2 px-3 py-2 hover:bg-gray-100 cursor-pointer ${highlightedIndex === idx ? 'bg-gray-100' : ''}`}
                    onClick={() => handleAddMember(user)}
                    onMouseEnter={() => setHighlightedIndex(idx)}
                  >
                    {user.profileImageUrl ? (
                      <img src={user.profileImageUrl} alt={user.fullName} className="w-8 h-8 rounded-full object-cover" />
                    ) : (
                      <CharAvatar fullName={user.fullName} width="w-8" height="h-8" />
                    )}
                    <div>
                      <div className="font-medium text-sm">{user.fullName}</div>
                      <div className="text-xs text-gray-500">{user.email}</div>
                    </div>
                  </div>
                ))}
                {loading && <div className="px-3 py-2 text-sm text-gray-400">Searching...</div>}
              </div>
            )}
          </div>
          {selectedMembers.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {selectedMembers.map(user => (
                <div key={user._id} className="flex items-center gap-1 bg-gray-100 rounded-full px-2 py-1 text-sm">
                  {user.profileImageUrl ? (
                    <img src={user.profileImageUrl} alt={user.fullName} className="w-6 h-6 rounded-full object-cover" />
                  ) : (
                    <CharAvatar fullName={user.fullName} width="w-6" height="h-6" />
                  )}
                  <span>{user.fullName.split(' ')[0]}</span>
                  <button
                    type="button"
                    className="ml-1 text-gray-400 hover:text-red-500 focus:outline-none"
                    onClick={() => handleRemoveMember(user._id)}
                  >
                    &times;
                  </button>
                </div>
              ))}
            </div>
          )}
          {error && <div className="text-red-500 mb-3 text-sm">{error}</div>}
          <div className="flex gap-2">
            <button className="bg-primary text-white rounded-lg px-4 py-1 font-medium hover:bg-primary-dark transition" type="submit">Add Group</button>
            <button className="bg-gray-200 text-gray-700 rounded-lg px-4 py-1 font-medium hover:bg-gray-300 transition" type="button" onClick={onClose}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddGroupModal; 