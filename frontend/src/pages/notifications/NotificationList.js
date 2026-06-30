import React, { useState, useEffect } from 'react';
import { notificationAPI } from '../../services/api';
import { toast } from 'react-toastify';
import { FiCheck, FiCheckCircle } from 'react-icons/fi';

const NotificationList = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await notificationAPI.getAll({ limit: 50 });
        setNotifications(res.data.data);
      } catch (err) { toast.error('Failed to load notifications'); }
      finally { setLoading(false); }
    };
    fetch();
  }, []);

  const handleMarkRead = async (id) => {
    try {
      await notificationAPI.markAsRead(id);
      setNotifications(notifications.map(n => n.id === id ? { ...n, is_read: 1 } : n));
    } catch (err) { toast.error('Failed to mark as read'); }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationAPI.markAllAsRead();
      setNotifications(notifications.map(n => ({ ...n, is_read: 1 })));
      toast.success('All marked as read');
    } catch (err) { toast.error('Failed'); }
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Notifications</h1>
        <button className="btn btn-outline" onClick={handleMarkAllRead}><FiCheckCircle /> Mark All Read</button>
      </div>
      <div className="card">
        {loading ? <p style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>Loading...</p> :
         notifications.length === 0 ? <p style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>No notifications</p> :
         <div>
          {notifications.map(n => (
            <div key={n.id} style={{
              display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px',
              borderBottom: '1px solid #f1f5f9', background: n.is_read ? 'transparent' : '#f0f7ff',
              borderRadius: n.is_read ? 0 : 8, marginBottom: 2,
            }}>
              <div style={{ flex: 1 }}>
                <p style={{ fontWeight: n.is_read ? 400 : 600, margin: 0 }}>{n.title}</p>
                <p style={{ color: '#64748b', fontSize: 13, margin: '4px 0 0' }}>{n.message}</p>
                <p style={{ color: '#94a3b8', fontSize: 11, margin: '4px 0 0' }}>{new Date(n.created_at).toLocaleString()}</p>
              </div>
              {!n.is_read && (
                <button className="btn btn-outline" style={{ padding: '4px 8px' }} onClick={() => handleMarkRead(n.id)}>
                  <FiCheck size={14} />
                </button>
              )}
            </div>
          ))}
        </div>}
      </div>
    </div>
  );
};

export default NotificationList;