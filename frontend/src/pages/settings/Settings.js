import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { userAPI, authAPI } from '../../services/api';
import { toast } from 'react-toastify';
import { FiSave, FiUser, FiShield, FiBell, FiSliders, FiPackage, FiTool, FiCheckCircle } from 'react-icons/fi';

const Settings = () => {
  const { user, hasRole, hasPermission } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(false);
  const [profileForm, setProfileForm] = useState({
    full_name: user?.full_name || '',
    phone: user?.phone || '',
    email: user?.email || '',
  });
  const [passwordForm, setPasswordForm] = useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
  });

  const isSuperAdmin = hasRole(['super_admin']);
  const isItAdmin = hasRole(['it_admin']);
  const isTechnician = hasRole(['it_technician']);
  const isApprover = hasRole(['approver']);
  const isInventoryOfficer = hasRole(['inventory_officer']);

  const tabs = [
    { id: 'profile', label: 'Profile', icon: <FiUser />, roles: ['super_admin', 'it_admin', 'it_technician', 'approver', 'employee', 'inventory_officer'] },
    { id: 'security', label: 'Security', icon: <FiShield />, roles: ['super_admin', 'it_admin', 'it_technician', 'approver', 'employee', 'inventory_officer'] },
    { id: 'notifications', label: 'Notifications', icon: <FiBell />, roles: ['super_admin', 'it_admin', 'it_technician', 'approver', 'employee', 'inventory_officer'] },
    { id: 'system', label: 'System', icon: <FiSliders />, roles: ['super_admin'] },
    { id: 'inventory', label: 'Inventory', icon: <FiPackage />, roles: ['super_admin', 'it_admin', 'inventory_officer'] },
    { id: 'repair', label: 'Repair Config', icon: <FiTool />, roles: ['super_admin', 'it_admin', 'it_technician'] },
    { id: 'approval', label: 'Approval', icon: <FiCheckCircle />, roles: ['super_admin', 'it_admin', 'approver'] },
  ];

  const visibleTabs = tabs.filter(t => t.roles.some(r => user?.roles?.includes(r)));

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await userAPI.update(user.id, profileForm);
      toast.success('Profile updated successfully');
    } catch (err) {
      toast.error(err.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (passwordForm.new_password !== passwordForm.confirm_password) {
      toast.error('Passwords do not match');
      return;
    }
    if (passwordForm.new_password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    setLoading(true);
    try {
      await authAPI.changePassword({
        current_password: passwordForm.current_password,
        new_password: passwordForm.new_password,
      });
      toast.success('Password changed successfully');
      setPasswordForm({ current_password: '', new_password: '', confirm_password: '' });
    } catch (err) {
      toast.error(err.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  const renderProfileTab = () => (
    <div className="card">
      <div className="card-header"><h3>Profile Settings</h3></div>
      <div className="card-body">
        <form onSubmit={handleProfileSubmit}>
          <div className="row g-3">
            <div className="col-md-6">
              <label className="form-label">Full Name</label>
              <input type="text" className="form-control" value={profileForm.full_name}
                onChange={e => setProfileForm({...profileForm, full_name: e.target.value})} required />
            </div>
            <div className="col-md-6">
              <label className="form-label">Email</label>
              <input type="email" className="form-control" value={profileForm.email} disabled />
            </div>
            <div className="col-md-6">
              <label className="form-label">Phone</label>
              <input type="text" className="form-control" value={profileForm.phone}
                onChange={e => setProfileForm({...profileForm, phone: e.target.value})} />
            </div>
            <div className="col-md-6">
              <label className="form-label">Role</label>
              <input type="text" className="form-control" value={user?.roles?.join(', ') || ''} disabled />
            </div>
          </div>
          <button type="submit" className="btn btn-primary mt-3" disabled={loading}>
            <FiSave /> {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </div>
    </div>
  );

  const renderSecurityTab = () => (
    <div className="card">
      <div className="card-header"><h3>Change Password</h3></div>
      <div className="card-body">
        <form onSubmit={handlePasswordSubmit}>
          <div className="row g-3">
            <div className="col-md-4">
              <label className="form-label">Current Password</label>
              <input type="password" className="form-control" value={passwordForm.current_password}
                onChange={e => setPasswordForm({...passwordForm, current_password: e.target.value})} required />
            </div>
            <div className="col-md-4">
              <label className="form-label">New Password</label>
              <input type="password" className="form-control" value={passwordForm.new_password}
                onChange={e => setPasswordForm({...passwordForm, new_password: e.target.value})} required minLength={6} />
            </div>
            <div className="col-md-4">
              <label className="form-label">Confirm Password</label>
              <input type="password" className="form-control" value={passwordForm.confirm_password}
                onChange={e => setPasswordForm({...passwordForm, confirm_password: e.target.value})} required />
            </div>
          </div>
          <button type="submit" className="btn btn-primary mt-3" disabled={loading}>
            <FiSave /> {loading ? 'Changing...' : 'Change Password'}
          </button>
        </form>
      </div>
    </div>
  );

  const renderNotificationsTab = () => (
    <div className="card">
      <div className="card-header"><h3>Notification Preferences</h3></div>
      <div className="card-body">
        <div className="form-check mb-3">
          <input className="form-check-input" type="checkbox" defaultChecked id="notifBorrow" />
          <label className="form-check-label" htmlFor="notifBorrow">Borrow request updates</label>
        </div>
        <div className="form-check mb-3">
          <input className="form-check-input" type="checkbox" defaultChecked id="notifRepair" />
          <label className="form-check-label" htmlFor="notifRepair">Repair request updates</label>
        </div>
        <div className="form-check mb-3">
          <input className="form-check-input" type="checkbox" defaultChecked id="notifApproval" />
          <label className="form-check-label" htmlFor="notifApproval">Approval notifications</label>
        </div>
        <div className="form-check mb-3">
          <input className="form-check-input" type="checkbox" defaultChecked id="notifStock" />
          <label className="form-check-label" htmlFor="notifStock">Low stock alerts</label>
        </div>
        <button className="btn btn-primary"><FiSave /> Save Preferences</button>
      </div>
    </div>
  );

  const renderSystemTab = () => (
    <div className="card">
      <div className="card-header"><h3>System Settings (Super Admin)</h3></div>
      <div className="card-body">
        <div className="mb-3">
          <label className="form-label">Application Name</label>
          <input type="text" className="form-control" defaultValue="IT Equipment Management" />
        </div>
        <div className="mb-3">
          <label className="form-label">Default Borrow Duration (days)</label>
          <input type="number" className="form-control" defaultValue={7} />
        </div>
        <div className="mb-3">
          <label className="form-label">Low Stock Threshold (%)</label>
          <input type="number" className="form-control" defaultValue={20} />
        </div>
        <div className="form-check mb-3">
          <input className="form-check-input" type="checkbox" defaultChecked id="maintenanceMode" />
          <label className="form-check-label" htmlFor="maintenanceMode">Maintenance Mode</label>
        </div>
        <button className="btn btn-primary"><FiSave /> Save System Settings</button>
      </div>
    </div>
  );

  const renderInventoryTab = () => (
    <div className="card">
      <div className="card-header"><h3>Inventory Settings</h3></div>
      <div className="card-body">
        <div className="mb-3">
          <label className="form-label">Default Min Stock Level</label>
          <input type="number" className="form-control" defaultValue={5} />
        </div>
        <div className="mb-3">
          <label className="form-label">Default Reorder Quantity</label>
          <input type="number" className="form-control" defaultValue={20} />
        </div>
        <div className="form-check mb-3">
          <input className="form-check-input" type="checkbox" defaultChecked id="autoAlert" />
          <label className="form-check-label" htmlFor="autoAlert">Auto-generate low stock alerts</label>
        </div>
        <button className="btn btn-primary"><FiSave /> Save Inventory Settings</button>
      </div>
    </div>
  );

  const renderRepairTab = () => (
    <div className="card">
      <div className="card-header"><h3>Repair Configuration</h3></div>
      <div className="card-body">
        <div className="mb-3">
          <label className="form-label">Default Priority for New Requests</label>
          <select className="form-select" defaultValue="medium">
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </select>
        </div>
        <div className="mb-3">
          <label className="form-label">Auto-assign Technician</label>
          <select className="form-select" defaultValue="no">
            <option value="no">No</option>
            <option value="round_robin">Round Robin</option>
            <option value="least_busy">Least Busy</option>
          </select>
        </div>
        <button className="btn btn-primary"><FiSave /> Save Repair Settings</button>
      </div>
    </div>
  );

  const renderApprovalTab = () => (
    <div className="card">
      <div className="card-header"><h3>Approval Settings</h3></div>
      <div className="card-body">
        <div className="mb-3">
          <label className="form-label">Require Approval For</label>
          <select className="form-select" defaultValue="all">
            <option value="all">All borrow requests</option>
            <option value="high_value">High value assets only</option>
            <option value="long_term">Long-term borrows only</option>
          </select>
        </div>
        <div className="mb-3">
          <label className="form-label">Auto-approve threshold (days)</label>
          <input type="number" className="form-control" defaultValue={3} />
        </div>
        <button className="btn btn-primary"><FiSave /> Save Approval Settings</button>
      </div>
    </div>
  );

  const tabRenderers = {
    profile: renderProfileTab,
    security: renderSecurityTab,
    notifications: renderNotificationsTab,
    system: renderSystemTab,
    inventory: renderInventoryTab,
    repair: renderRepairTab,
    approval: renderApprovalTab,
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1><FiSliders /> Settings</h1>
      </div>

      <div className="settings-layout">
        <div className="settings-sidebar">
          <div className="list-group">
            {visibleTabs.map(tab => (
              <button
                key={tab.id}
                className={`list-group-item list-group-item-action d-flex align-items-center gap-2 ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>
        </div>
        <div className="settings-content">
          {tabRenderers[activeTab]?.() || <p>Select a settings tab</p>}
        </div>
      </div>

      <style>{`
        .settings-layout { display: flex; gap: 24px; }
        .settings-sidebar { width: 250px; flex-shrink: 0; }
        .settings-content { flex: 1; }
        .list-group-item { cursor: pointer; border: 1px solid #e2e8f0; margin-bottom: 4px; border-radius: 8px !important; }
        .list-group-item.active { background: #2563eb; color: white; border-color: #2563eb; }
        @media (max-width: 768px) { .settings-layout { flex-direction: column; } .settings-sidebar { width: 100%; } }
      `}</style>
    </div>
  );
};

export default Settings;