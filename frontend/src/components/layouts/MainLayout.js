import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { notificationAPI } from '../../services/api';
import { 
  FiMenu, FiX, FiHome, FiMonitor, FiClipboard, FiTool, 
  FiUsers, FiBell, FiBarChart2, FiLogOut, FiUser, FiChevronDown,
  FiBox, FiSliders 
} from 'react-icons/fi';
import './MainLayout.css';

const MainLayout = () => {
  const { user, logout, hasRole } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);

  useEffect(() => {
    const fetchUnread = async () => {
      try {
        const res = await notificationAPI.getUnreadCount();
        setUnreadCount(res.data.data.count);
      } catch (err) {}
    };
    fetchUnread();
    const interval = setInterval(fetchUnread, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isAdmin = hasRole(['super_admin', 'it_admin']);
  const isTechnician = hasRole(['it_technician']);
  const isApprover = hasRole(['approver']);

  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: <FiHome />, roles: ['super_admin', 'it_admin', 'it_technician', 'approver', 'employee'] },
    { path: '/assets', label: 'Assets', icon: <FiMonitor />, roles: ['super_admin', 'it_admin', 'it_technician', 'approver', 'employee'] },
    { path: '/borrows', label: 'Borrow Requests', icon: <FiClipboard />, roles: ['super_admin', 'it_admin', 'it_technician', 'approver', 'employee'] },
    { path: '/repairs', label: 'Repairs', icon: <FiTool />, roles: ['super_admin', 'it_admin', 'it_technician', 'employee'] },
    { path: '/users', label: 'Users', icon: <FiUsers />, roles: ['super_admin', 'it_admin'] },
    { path: '/roles', label: 'Roles & Permissions', icon: <FiUsers />, roles: ['super_admin'] },
    { path: '/notifications', label: 'Notifications', icon: <FiBell />, roles: ['super_admin', 'it_admin', 'it_technician', 'approver', 'employee'], badge: unreadCount },
    { path: '/parts', label: 'Spare Parts', icon: <FiBox />, roles: ['super_admin', 'it_admin', 'it_technician', 'inventory_officer'] },
    { path: '/settings', label: 'Settings', icon: <FiSliders />, roles: ['super_admin', 'it_admin', 'it_technician', 'approver', 'employee', 'inventory_officer'] },
    { path: '/reports', label: 'Reports', icon: <FiBarChart2 />, roles: ['super_admin', 'it_admin'] },
  ];

  const filteredNav = navItems.filter(item => 
    item.roles.some(role => user?.roles?.includes(role))
  );

  return (
    <div className="main-layout">
      <aside className={`sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
        <div className="sidebar-header">
          <h3 className="sidebar-title">{sidebarOpen ? 'IT Equipment' : 'IT'}</h3>
          <button className="sidebar-toggle" onClick={() => setSidebarOpen(!sidebarOpen)}>
            {sidebarOpen ? <FiX /> : <FiMenu />}
          </button>
        </div>
        <nav className="sidebar-nav">
          {filteredNav.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              <span className="nav-icon">{item.icon}</span>
              {sidebarOpen && <span className="nav-label">{item.label}</span>}
              {sidebarOpen && item.badge > 0 && (
                <span className="nav-badge">{item.badge}</span>
              )}
            </NavLink>
          ))}
        </nav>
      </aside>

      <div className="main-area">
        <header className="top-header">
          <div className="header-left">
            <button className="mobile-menu-btn" onClick={() => setSidebarOpen(!sidebarOpen)}>
              <FiMenu />
            </button>
          </div>
          <div className="header-right">
            <div className="profile-dropdown" onClick={() => setProfileMenuOpen(!profileMenuOpen)}>
              <div className="profile-info">
                <FiUser className="profile-icon" />
                <span className="profile-name">{user?.full_name || 'User'}</span>
                <FiChevronDown size={16} />
              </div>
              {profileMenuOpen && (
                <div className="dropdown-menu">
                  <NavLink to="/profile" className="dropdown-item" onClick={() => setProfileMenuOpen(false)}>
                    <FiUser /> Profile
                  </NavLink>
                  <button className="dropdown-item logout-btn" onClick={handleLogout}>
                    <FiLogOut /> Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="main-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default MainLayout;