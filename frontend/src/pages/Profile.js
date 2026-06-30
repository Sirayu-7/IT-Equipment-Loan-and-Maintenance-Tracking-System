import React from 'react';
import { useAuth } from '../context/AuthContext';
import { FiUser, FiMail, FiHash, FiPhone, FiShield } from 'react-icons/fi';

const Profile = () => {
  const { user } = useAuth();

  if (!user) return <div className="card"><p style={{ textAlign: 'center', padding: 40 }}>Loading...</p></div>;

  return (
    <div>
      <div className="page-header"><h1 className="page-title">My Profile</h1></div>
      <div className="card" style={{ maxWidth: 600 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 24 }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 24, fontWeight: 'bold' }}>
            {user.full_name?.charAt(0) || 'U'}
          </div>
          <div>
            <h2 style={{ margin: 0 }}>{user.full_name}</h2>
            <p style={{ color: '#64748b', margin: '4px 0 0' }}>{user.roles?.join(', ')?.replace(/_/g, ' ')}</p>
          </div>
        </div>
        <div style={{ display: 'grid', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <FiHash style={{ color: '#94a3b8' }} />
            <div><strong>Employee Code</strong><p style={{ margin: 0, color: '#64748b' }}>{user.employee_code || '—'}</p></div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <FiMail style={{ color: '#94a3b8' }} />
            <div><strong>Email</strong><p style={{ margin: 0, color: '#64748b' }}>{user.email}</p></div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <FiPhone style={{ color: '#94a3b8' }} />
            <div><strong>Phone</strong><p style={{ margin: 0, color: '#64748b' }}>{user.phone || '—'}</p></div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <FiShield style={{ color: '#94a3b8' }} />
            <div><strong>Status</strong><p style={{ margin: 0, color: '#64748b' }}>{user.status}</p></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;