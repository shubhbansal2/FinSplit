import React, { useState, useRef, useEffect, useContext } from 'react';
import { HiOutlineMenu, HiOutlineX } from 'react-icons/hi';
import { IoMdNotificationsOutline } from 'react-icons/io';
import { useNavigate } from 'react-router-dom';
import SideMenu from './SideMenu';
import { UserContext } from '../../context/UserContext';
import { getNotifications, markNotificationRead, acceptInvite, declineInvite } from '../../utils/billBuddyApi';

const Navbar = ({activeMenu}) => {
  const [openSideMenu, setOpenSideMenu] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const bellRef = useRef();
  const { user } = useContext(UserContext);

  // Fetch notifications when dropdown opens
  useEffect(() => {
    if (showDropdown && user?.fullName) {
      setLoading(true);
      getNotifications(user.fullName)
        .then(res => setNotifications(res.data))
        .finally(() => setLoading(false));
    }
  }, [showDropdown, user]);

  // Mark all as read when dropdown opens
  useEffect(() => {
    if (showDropdown && notifications.length > 0) {
      notifications.filter(n => !n.read).forEach(n => markNotificationRead(n._id));
    }
    // eslint-disable-next-line
  }, [showDropdown]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (bellRef.current && !bellRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    }
    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showDropdown]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleAcceptInvite = async (notification) => {
    if (!user?.fullName) return;
    await acceptInvite(notification._id, user.fullName, notification.data.groupId);
    setNotifications(prev => prev.map(n => n._id === notification._id ? { ...n, read: true, type: 'invite-accepted' } : n));
  };

  const handleDeclineInvite = async (notification) => {
    await declineInvite(notification._id);
    setNotifications(prev => prev.map(n => n._id === notification._id ? { ...n, read: true, type: 'invite-declined' } : n));
  };

  return (
    <div className='flex gap-5 bg-white border border-b border-gray-200/50 backdrop-blur-[2px] py-4 px-7 sticky top-0 z-30 items-center'>
      <button
        className='block lg:hidden text-black'
        onClick={() => setOpenSideMenu(!openSideMenu)}
      >
        {openSideMenu ? <HiOutlineX className='text-2xl'/> : <HiOutlineMenu className='text-2xl'/>}
      </button>

      <h2 className='text-lg font-medium text-black flex-1'>FinSplit</h2>

      <div className='relative' ref={bellRef}>
        <button
          className='relative mr-2 transition hover:bg-blue-100 hover:scale-110 rounded-full p-1'
          onClick={() => setShowDropdown((v) => !v)}
          aria-label='Notifications'
        >
          <IoMdNotificationsOutline className='text-2xl text-gray-700' />
          {unreadCount > 0 && (
            <span className='absolute -top-1 -right-1 bg-red-500 rounded-full w-3 h-3 border-2 border-white'></span>
          )}
        </button>
        {showDropdown && (
          <div className='absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-lg border border-gray-100 z-50'>
            <div className='p-4'>
              <h4 className='font-semibold mb-2 text-gray-800'>Notifications</h4>
              {loading ? (
                <div className='text-gray-400 text-sm'>Loading...</div>
              ) : notifications.length === 0 ? (
                <div className='text-gray-400 text-sm'>No notifications</div>
              ) : (
                <ul className='space-y-2'>
                  {notifications.map(n => (
                    <li key={n._id} className={`text-sm rounded px-3 py-2 ${n.read ? 'text-gray-400 bg-gray-50' : 'text-gray-700 bg-blue-50 font-semibold'}`}>
                      {n.type === 'invite' && (
                        <>
                          <div>{n.message}</div>
                          <div className='flex gap-2 mt-2'>
                            <button className='bg-primary text-white rounded px-2 py-1 text-xs' onClick={() => handleAcceptInvite(n)}>Accept</button>
                            <button className='bg-gray-300 text-gray-700 rounded px-2 py-1 text-xs' onClick={() => handleDeclineInvite(n)}>Decline</button>
                          </div>
                        </>
                      )}
                      {n.type === 'owe' && (
                        <div>{n.message} <span className='block text-xs text-gray-500 mt-1'>Group: {n.data?.groupName || n.data?.groupId}</span></div>
                      )}
                      {n.type === 'settled' && (
                        <div>{n.message} <span className='block text-xs text-gray-500 mt-1'>Group: {n.data?.groupName || n.data?.groupId}</span></div>
                      )}
                      {n.type === 'received' && (
                        <div>{n.message} <span className='block text-xs text-gray-500 mt-1'>Group: {n.data?.groupName || n.data?.groupId}</span></div>
                      )}
                      {(n.type !== 'invite' && n.type !== 'owe' && n.type !== 'settled' && n.type !== 'received') && (
                        <div>{n.message}</div>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}
      </div>

      {openSideMenu && (
        <div className='fixed top-[61px] -ml-4 bg-white'>
            <SideMenu activeMenu={activeMenu} />
        </div>
      )}
    </div>
  )
}

export default Navbar 