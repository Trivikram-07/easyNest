import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import { Bell, CheckCircle, AlertCircle } from 'lucide-react';
import logo from '/image1.png';

const socket = io('/', {
  auth: {
    token: localStorage.getItem('token'),
  },
  transports: ['websocket'],
  withCredentials: true,
});

interface NavbarProps {
  isLoggedIn: boolean;
  setIsLoggedIn: React.Dispatch<React.SetStateAction<boolean | null>>;
}

interface Notification {
  id: string;
  message: string;
  type: 'success' | 'info';
  timestamp: Date;
  isRead: boolean;
  propertyId?: string;
}

const Navbar: React.FC<NavbarProps> = ({ isLoggedIn, setIsLoggedIn }) => {
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadMessages, setUnreadMessages] = useState<number>(0);
  const [username, setUsername] = useState<string>('');
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const navigate = useNavigate();
  const profileRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isLoggedIn) {
      setUsername('');
      setNotifications([]);
      setUnreadMessages(0);
      return;
    }

    const fetchUnreadCount = async () => {
      const token = localStorage.getItem('token');
      try {
        const response = await fetch('/api/properties/messages/chats/unread', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(`Failed to fetch unread count: ${errorData.message || response.statusText}`);
        }
        const data = await response.json();
        setUnreadMessages(data.totalUnread || 0);
      } catch (err) {
        console.error('Fetch unread count error:', err);
      }
    };

    const fetchUserDetails = async () => {
      const token = localStorage.getItem('token');
      try {
        const response = await fetch('/api/users/me', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(`Failed to fetch user details: ${errorData.message || response.statusText}`);
        }
        const data = await response.json();
        setUsername(data.username || 'User');
      } catch (err) {
        console.error('Fetch user details error:', err);
      }
    };

    fetchUnreadCount();
    fetchUserDetails();

    socket.on('receiveMessage', (message) => {
      if (message.recipient._id === localStorage.getItem('userId') && !message.isRead) {
        setUnreadMessages((prev) => prev + 1);
      }
    });

    socket.on('bookingSuccess', ({ propertyId, propertyName }) => {
      const notification: Notification = {
        id: `${propertyId}-${Date.now()}`,
        message: `Booking for ${propertyName} successful!`,
        type: 'success',
        timestamp: new Date(),
        isRead: false,
        propertyId,
      };
      setNotifications((prev) => [...prev, notification]);
    });

    socket.on('reviewPrompt', ({ propertyId, propertyName }) => {
      const notification: Notification = {
        id: `${propertyId}-${Date.now()}`,
        message: `Time to review ${propertyName}! Rate and share your experience.`,
        type: 'info',
        timestamp: new Date(),
        isRead: false,
        propertyId,
      };
      setNotifications((prev) => [...prev, notification]);
    });

    socket.on('chatRead', () => {
      fetchUnreadCount();
    });

    return () => {
      socket.off('receiveMessage');
      socket.off('bookingSuccess');
      socket.off('reviewPrompt');
      socket.off('chatRead');
    };
  }, [isLoggedIn]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        profileRef.current &&
        !profileRef.current.contains(event.target as Node) &&
        notificationsRef.current &&
        !notificationsRef.current.contains(event.target as Node)
      ) {
        setShowProfileDropdown(false);
        setShowNotifications(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const toggleProfileDropdown = () => {
    setShowProfileDropdown((prev) => !prev);
    setShowNotifications(false);
  };

  const toggleNotifications = () => {
    setShowNotifications((prev) => !prev);
    setShowProfileDropdown(false);
  };

  const handleLogout = () => {
    console.log('Logout clicked, removing token');
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    setIsLoggedIn(false);
    navigate('/');
  };

  const unreadNotificationsCount = notifications.filter((n) => !n.isRead).length;
  const latestNotification = notifications.length > 0 ? notifications[notifications.length - 1] : null;

  return (
    <nav className="sticky top-0 z-[900] bg-gray-800 px-4 py-3 sm:px-6 flex flex-col sm:flex-row justify-between items-center">
      <div className="flex items-center w-full sm:w-auto">
        <Link to={isLoggedIn ? '/home' : '/'} className="flex items-center">
          <img src={logo} alt="Gruha Anvesh Logo" className="h-11 w-auto mr-2" />
        </Link>
      </div>
      <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-6 mt-2 sm:mt-0 w-full sm:w-auto">
        {isLoggedIn ? (
          <>
            <Link to="/home" className="text-white hover:text-blue-200 font-medium text-center">
              Home
            </Link>
            <Link to="/subscriptions" className="text-white hover:text-blue-200 font-medium text-center">
              Subscriptions
            </Link>
            <Link to="/ContactUs" className="text-white hover:text-blue-200 font-medium text-center">
              Contact Us
            </Link>
            <Link to="/upload" className="text-white hover:text-blue-200 font-medium text-center">
              Upload
            </Link>
            <div className="relative" ref={profileRef}>
              <span
                className="flex items-center text-white hover:text-blue-200 cursor-pointer font-medium"
                onClick={toggleProfileDropdown}
              >
                Profile
                {unreadMessages > 0 && (
                  <span className="ml-2 h-2 w-2 bg-red-500 rounded-full"></span>
                )}
              </span>
              <div
                className={`absolute right-0 mt-2 w-48 bg-gray-800 rounded-lg shadow-lg z-[1000] overflow-hidden transition-all duration-300 ease-in-out transform ${
                  showProfileDropdown
                    ? 'opacity-100 translate-y-0'
                    : 'opacity-0 -translate-y-2 pointer-events-none'
                }`}
              >
                <div className="text-white font-semibold text-lg px-4 py-2 border-b border-gray-700">
                  {username}
                </div>
                <Link
                  to="/profile/history"
                  className="block text-white hover:text-blue-200 px-4 py-2"
                  onClick={() => setShowProfileDropdown(false)}
                >
                  History
                </Link>
                <Link
                  to="/profile/bookings"
                  className="block text-white hover:text-blue-200 px-4 py-2"
                  onClick={() => setShowProfileDropdown(false)}
                >
                  Previous Bookings
                </Link>
                <Link
                  to="/chats"
                  className="block text-white hover:text-blue-200 px-4 py-2"
                  onClick={() => setShowProfileDropdown(false)}
                >
                  Chat
                </Link>
                <Link
                  to="/profile/edit"
                  className="block text-white hover:text-blue-200 px-4 py-2"
                  onClick={() => setShowProfileDropdown(false)}
                >
                  Edit Profile
                </Link>
                <button
                  onClick={() => {
                    handleLogout();
                    setShowProfileDropdown(false);
                  }}
                  className="w-full text-left text-white hover:text-blue-200 px-4 py-2"
                >
                  Logout
                </button>
              </div>
            </div>
            <div className="relative" ref={notificationsRef}>
              <Bell
                className="h-6 w-6 text-white cursor-pointer hover:text-blue-200"
                onClick={toggleNotifications}
              />
              {unreadNotificationsCount > 0 && (
                <span className="absolute top-0 right-0 h-2 w-2 bg-red-500 rounded-full"></span>
              )}
              <div
                className={`absolute right-0 mt-2 w-80 bg-gray-800 rounded-lg shadow-lg z-[1000] overflow-hidden transition-all duration-300 ease-in-out transform ${
                  showNotifications
                    ? 'opacity-100 translate-y-0'
                    : 'opacity-0 -translate-y-2 pointer-events-none'
                }`}
              >
                {latestNotification ? (
                  <div>
                    <div
                      className={`px-4 py-2 flex items-start ${
                        latestNotification.isRead ? 'text-gray-400' : 'text-white'
                      } hover:bg-gray-700 cursor-pointer`}
                      onClick={() => {
                        navigate(
                          latestNotification.type === 'success'
                            ? `/vacation/${latestNotification.propertyId}`
                            : `/review/vacation/${latestNotification.propertyId}`,
                          { state: { fromNotification: latestNotification.type === 'success' } }
                        );
                        setShowNotifications(false);
                      }}
                    >
                      {latestNotification.type === 'success' ? (
                        <CheckCircle className="h-5 w-5 mr-2 text-green-500" />
                      ) : (
                        <AlertCircle className="h-5 w-5 mr-2 text-blue-500" />
                      )}
                      <div>
                        <p>{latestNotification.message}</p>
                        <span className="text-xs">
                          {new Date(latestNotification.timestamp).toLocaleString()}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        navigate('/notifications');
                        setShowNotifications(false);
                      }}
                      className="w-full text-center text-white bg-blue-600 hover:bg-blue-700 py-2 rounded-b-lg"
                    >
                      All Notifications
                    </button>
                  </div>
                ) : (
                  <div>
                    <p className="text-gray-400 px-4 py-2">No notifications yet</p>
                    <button
                      onClick={() => {
                        navigate('/notifications');
                        setShowNotifications(false);
                      }}
                      className="w-full text-center text-white bg-blue-600 hover:bg-blue-700 py-2 rounded-b-lg"
                    >
                      All Notifications
                    </button>
                  </div>
                )}
              </div>
            </div>
          </>
        ) : (
          <>
            <Link to="/home" className="text-white hover:text-blue-200 font-medium text-center">
              Home
            </Link>
            <Link to="/signup" className="text-white hover:text-blue-200 font-medium text-center">
              Sign Up
            </Link>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;