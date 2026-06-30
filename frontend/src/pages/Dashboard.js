import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { dashboardAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { FiBox, FiCheckCircle, FiClock, FiAlertTriangle, FiRefreshCw, FiPlus, FiTool, FiClipboard, FiPackage, FiActivity, FiUser } from 'react-icons/fi';

const SkeletonCard = () => (
  <div className="skeleton-card" style={{
    background: '#fff', borderRadius: 12, padding: 20,
    border: '1px solid #e2e8f0',
    display: 'flex', alignItems: 'center', gap: 16,
  }}>
    <div className="skeleton-circle" style={{
      width: 48, height: 48, borderRadius: 12,
      background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
      backgroundSize: '200% 100%',
      animation: 'shimmer 1.5s infinite',
    }} />
    <div style={{ flex: 1 }}>
      <div style={{
        height: 24, width: '60%', borderRadius: 4, marginBottom: 8,
        background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
        backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite',
      }} />
      <div style={{
        height: 14, width: '40%', borderRadius: 4,
        background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
        backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite',
      }} />
    </div>
  </div>
);

const StatCard = ({ title, value, icon, color, onClick }) => (
  <div className="stat-card" onClick={onClick} style={{ cursor: onClick ? 'pointer' : 'default' }}>
    <div className="stat-icon" style={{ background: `${color}15`, color }}>
      {icon}
    </div>
    <div className="stat-info">
      <h3 className="stat-value">{value ?? '—'}</h3>
      <p className="stat-title">{title}</p>
    </div>
  </div>
);

const QuickAction = ({ label, icon, color, onClick }) => (
  <button onClick={onClick} style={{
    display: 'flex', alignItems: 'center', gap: 8,
    padding: '10px 16px', borderRadius: 8, border: '1px solid #e2e8f0',
    background: '#fff', cursor: 'pointer', fontSize: 14, fontWeight: 500,
    transition: 'all 0.2s',
  }}
    onMouseEnter={e => { e.currentTarget.style.borderColor = color; e.currentTarget.style.boxShadow = `0 0 0 2px ${color}20`; }}
    onMouseLeave={e => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.boxShadow = 'none'; }}
  >
    <span style={{ color }}>{icon}</span>
    {label}
  </button>
);

const Dashboard = () => {
  const { user, hasRole } = useAuth();
  const navigate = useNavigate();
  const [summary, setSummary] = useState(null);
  const [assetStatus, setAssetStatus] = useState([]);
  const [assetsByCategory, setAssetsByCategory] = useState([]);
  const [overdueItems, setOverdueItems] = useState([]);
  const [activities, setActivities] = useState([]);
  const [warrantyExpiring, setWarrantyExpiring] = useState([]);
  const [loading, setLoading] = useState(true);

  const role = {
    isSuperAdmin: hasRole(['super_admin']),
    isItAdmin: hasRole(['it_admin']),
    isTechnician: hasRole(['it_technician']),
    isApprover: hasRole(['approver']),
    isEmployee: hasRole(['employee']) && !hasRole(['super_admin', 'it_admin', 'it_technician', 'approver']),
    isInventoryOfficer: hasRole(['inventory_officer']),
    isAdmin: hasRole(['super_admin', 'it_admin']),
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [summaryRes, statusRes, categoryRes, overdueRes, activityRes, warrantyRes] = await Promise.all([
        dashboardAPI.getAdminSummary().catch(() => null),
        dashboardAPI.getAssetStatus().catch(() => null),
        dashboardAPI.getAssetsByCategory().catch(() => null),
        dashboardAPI.getOverdueItems().catch(() => null),
        dashboardAPI.getLatestActivities({ limit: 10 }).catch(() => null),
        dashboardAPI.getWarrantyExpiringSoon({ days: 30 }).catch(() => null),
      ]);
      if (summaryRes?.data?.data) setSummary(summaryRes.data.data);
      if (statusRes?.data?.data) setAssetStatus(statusRes.data.data);
      if (categoryRes?.data?.data) setAssetsByCategory(categoryRes.data.data);
      if (overdueRes?.data?.data) setOverdueItems(overdueRes.data.data);
      if (activityRes?.data?.data) setActivities(activityRes.data.data);
      if (warrantyRes?.data?.data) setWarrantyExpiring(warrantyRes.data.data);
    } catch (err) {
      console.error('Dashboard fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Role-based KPI cards
  const getKPICards = () => {
    const cards = [];
    if (role.isAdmin || role.isSuperAdmin) {
      cards.push(
        { title: 'Total Assets', value: summary?.total_assets, icon: <FiBox size={24} />, color: '#2563eb', onClick: () => navigate('/assets') },
        { title: 'Available', value: summary?.available_assets, icon: <FiCheckCircle size={24} />, color: '#10b981', onClick: () => navigate('/assets') },
        { title: 'Borrowed', value: summary?.borrowed_assets, icon: <FiClock size={24} />, color: '#f59e0b', onClick: () => navigate('/borrows') },
        { title: 'Under Repair', value: summary?.under_repair_assets, icon: <FiAlertTriangle size={24} />, color: '#ef4444', onClick: () => navigate('/repairs') },
        { title: 'Overdue', value: summary?.overdue_borrows, icon: <FiAlertTriangle size={24} />, color: '#dc2626', onClick: () => navigate('/borrows') },
        { title: 'Open Repairs', value: summary?.open_repairs, icon: <FiTool size={24} />, color: '#f59e0b', onClick: () => navigate('/repairs') },
        { title: 'Pending Approvals', value: summary?.pending_approvals, icon: <FiClock size={24} />, color: '#8b5cf6', onClick: () => navigate('/borrows') },
      );
    }
    if (role.isTechnician) {
      cards.push(
        { title: 'Open Repairs', value: summary?.open_repairs, icon: <FiTool size={24} />, color: '#f59e0b', onClick: () => navigate('/repairs') },
        { title: 'Assigned to Me', value: '—', icon: <FiUser size={24} />, color: '#2563eb', onClick: () => navigate('/repairs?assigned_to=me') },
        { title: 'Parts Reserved', value: '—', icon: <FiPackage size={24} />, color: '#8b5cf6', onClick: () => navigate('/parts') },
        { title: 'Completed Month', value: summary?.completed_repairs_month, icon: <FiCheckCircle size={24} />, color: '#10b981' },
      );
    }
    if (role.isApprover) {
      cards.push(
        { title: 'Pending Approvals', value: summary?.pending_approvals, icon: <FiClock size={24} />, color: '#8b5cf6', onClick: () => navigate('/borrows') },
        { title: 'Overdue Items', value: summary?.overdue_borrows, icon: <FiAlertTriangle size={24} />, color: '#dc2626', onClick: () => navigate('/borrows') },
      );
    }
    if (role.isEmployee && !role.isAdmin) {
      cards.push(
        { title: 'My Borrows', value: '—', icon: <FiClipboard size={24} />, color: '#2563eb', onClick: () => navigate('/borrows') },
        { title: 'My Repairs', value: '—', icon: <FiTool size={24} />, color: '#f59e0b', onClick: () => navigate('/repairs') },
      );
    }
    if (role.isInventoryOfficer || role.isAdmin) {
      cards.push(
        { title: 'Low Stock Items', value: '—', icon: <FiPackage size={24} />, color: '#f97316', onClick: () => navigate('/parts') },
        { title: 'Active Users', value: summary?.active_users, icon: <FiBox size={24} />, color: '#06b6d4', onClick: () => navigate('/users') },
      );
    }
    cards.push(
      { title: 'Warranty Expiring', value: summary?.warranty_expiring_soon, icon: <FiAlertTriangle size={24} />, color: '#f97316', onClick: () => navigate('/assets') },
    );
    return cards;
  };

  // Role-based quick actions
  const getQuickActions = () => {
    const actions = [];
    if (role.isAdmin) {
      actions.push(
        { label: 'New Asset', icon: <FiPlus />, color: '#2563eb', onClick: () => navigate('/assets/new') },
        { label: 'New Borrow', icon: <FiPlus />, color: '#10b981', onClick: () => navigate('/borrows/new') },
        { label: 'New Repair', icon: <FiPlus />, color: '#f59e0b', onClick: () => navigate('/repairs/new') },
      );
    }
    if (role.isTechnician) {
      actions.push(
        { label: 'New Repair', icon: <FiPlus />, color: '#f59e0b', onClick: () => navigate('/repairs/new') },
        { label: 'View Parts', icon: <FiPackage />, color: '#8b5cf6', onClick: () => navigate('/parts') },
      );
    }
    if (role.isEmployee) {
      actions.push(
        { label: 'New Borrow', icon: <FiPlus />, color: '#10b981', onClick: () => navigate('/borrows/new') },
        { label: 'Report Issue', icon: <FiAlertTriangle />, color: '#ef4444', onClick: () => navigate('/repairs/new') },
      );
    }
    if (role.isInventoryOfficer) {
      actions.push(
        { label: 'Add Part', icon: <FiPlus />, color: '#8b5cf6', onClick: () => navigate('/parts/new') },
        { label: 'Stock Alerts', icon: <FiPackage />, color: '#f97316', onClick: () => navigate('/parts') },
      );
    }
    return actions;
  };

  const statusColors = {
    available: '#10b981', borrowed: '#3b82f6', under_repair: '#f59e0b',
    pending_repair: '#f59e0b', lost: '#ef4444', damaged: '#ef4444',
    retired: '#6b7280', reserved: '#8b5cf6',
  };

  const KPICards = getKPICards();
  const quickActions = getQuickActions();

  if (loading) {
    return (
      <div>
        <div className="page-header"><h1>Dashboard</h1></div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16, marginBottom: 24 }}>
          {[...Array(6)].map((_, i) => <SkeletonCard key={i} />)}
        </div>
        <style>{`@keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }`}</style>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">
          <FiActivity /> Dashboard
          <span style={{ fontSize: 14, fontWeight: 400, color: '#94a3b8', marginLeft: 12 }}>
            — {user?.roles?.join(', ')}
          </span>
        </h1>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button className="btn btn-outline" onClick={fetchDashboardData}>
            <FiRefreshCw /> Refresh
          </button>
        </div>
      </div>

      {/* Quick Actions */}
      {quickActions.length > 0 && (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
          {quickActions.map((action, i) => <QuickAction key={i} {...action} />)}
        </div>
      )}

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16, marginBottom: 24 }}>
        {KPICards.map((card, i) => (
          <StatCard key={i} {...card} />
        ))}
      </div>

      {/* Charts Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>
        <div className="card">
          <div className="card-header"><h3 className="card-title">Assets by Category</h3></div>
          {assetsByCategory.length > 0 ? (
            <div>
              {assetsByCategory.map((cat, i) => {
                const total = assetsByCategory.reduce((s, c) => s + parseInt(c.total), 0);
                const pct = total > 0 ? (parseInt(cat.total) / total) * 100 : 0;
                return (
                  <div key={i} style={{ marginBottom: 12, cursor: 'pointer' }} onClick={() => navigate(`/assets?category_id=${cat.category_id}`)}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                      <span>{cat.category_name}</span>
                      <span style={{ fontWeight: 600 }}>{cat.total}</span>
                    </div>
                    <div style={{ height: 8, background: '#e2e8f0', borderRadius: 4, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${pct}%`, background: '#2563eb', borderRadius: 4 }} />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
              <FiPackage size={32} style={{ marginRight: 8 }} /> No category data
            </div>
          )}
        </div>

        <div className="card">
          <div className="card-header"><h3 className="card-title">Asset Status Distribution</h3></div>
          {assetStatus.length > 0 ? (
            <div>
              {assetStatus.map((s, i) => {
                const total = assetStatus.reduce((sum, st) => sum + parseInt(st.count), 0);
                const pct = total > 0 ? (parseInt(s.count) / total) * 100 : 0;
                return (
                  <div key={i} style={{ marginBottom: 12, cursor: 'pointer' }} onClick={() => navigate(`/assets?asset_status=${s.asset_status}`)}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                      <span style={{ textTransform: 'capitalize' }}>{s.asset_status.replace(/_/g, ' ')}</span>
                      <span style={{ fontWeight: 600 }}>{s.count}</span>
                    </div>
                    <div style={{ height: 8, background: '#e2e8f0', borderRadius: 4, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${pct}%`, background: statusColors[s.asset_status] || '#94a3b8', borderRadius: 4 }} />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
              <FiBox size={32} style={{ marginRight: 8 }} /> No status data
            </div>
          )}
        </div>
      </div>

      {/* Overdue & Activities */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        <div className="card">
          <div className="card-header"><h3 className="card-title">Overdue Items</h3></div>
          {overdueItems.length > 0 ? (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ padding: '10px 12px', borderBottom: '2px solid #e2e8f0', fontSize: 12, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', textAlign: 'left' }}>Asset</th>
                  <th style={{ padding: '10px 12px', borderBottom: '2px solid #e2e8f0', fontSize: 12, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', textAlign: 'left' }}>Borrower</th>
                  <th style={{ padding: '10px 12px', borderBottom: '2px solid #e2e8f0', fontSize: 12, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', textAlign: 'left' }}>Due Date</th>
                </tr>
              </thead>
              <tbody>
                {overdueItems.slice(0, 5).map((item, i) => (
                  <tr key={i} style={{ cursor: 'pointer' }} onClick={() => navigate(`/borrows/${item.borrow_request_id}`)}>
                    <td style={{ padding: '10px 12px', borderBottom: '1px solid #e2e8f0', fontSize: 13 }}>{item.asset_name}</td>
                    <td style={{ padding: '10px 12px', borderBottom: '1px solid #e2e8f0', fontSize: 13 }}>{item.borrower_name}</td>
                    <td style={{ padding: '10px 12px', borderBottom: '1px solid #e2e8f0', fontSize: 13 }}>{item.due_date ? new Date(item.due_date).toLocaleDateString() : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>
              <FiCheckCircle size={32} style={{ marginBottom: 8 }} />
              <p>No overdue items — all good!</p>
            </div>
          )}
        </div>

        <div className="card">
          <div className="card-header"><h3 className="card-title">Latest Activities</h3></div>
          {activities.length > 0 ? (
            <div style={{ maxHeight: 300, overflowY: 'auto' }}>
              {activities.map((act, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid #f1f5f9', fontSize: 13 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: act.type === 'borrow' ? '#3b82f6' : '#f59e0b', flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <p style={{ fontWeight: 500, margin: 0 }}>{act.title}</p>
                    <p style={{ color: '#64748b', margin: 0, fontSize: 12 }}>{act.description}</p>
                  </div>
                  <span style={{ color: '#94a3b8', fontSize: 11, whiteSpace: 'nowrap' }}>
                    {act.timestamp ? new Date(act.timestamp).toLocaleDateString() : ''}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>
              <FiActivity size={32} style={{ marginBottom: 8 }} />
              <p>No recent activities</p>
            </div>
          )}
        </div>
      </div>

      {/* Warranty */}
      {warrantyExpiring.length > 0 && (
        <div className="card" style={{ marginTop: 24 }}>
          <div className="card-header"><h3 className="card-title">Warranty Expiring Soon</h3></div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ padding: '10px 12px', borderBottom: '2px solid #e2e8f0', fontSize: 12, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', textAlign: 'left' }}>Code</th>
                <th style={{ padding: '10px 12px', borderBottom: '2px solid #e2e8f0', fontSize: 12, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', textAlign: 'left' }}>Name</th>
                <th style={{ padding: '10px 12px', borderBottom: '2px solid #e2e8f0', fontSize: 12, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', textAlign: 'left' }}>Category</th>
                <th style={{ padding: '10px 12px', borderBottom: '2px solid #e2e8f0', fontSize: 12, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', textAlign: 'left' }}>Warranty End</th>
              </tr>
            </thead>
            <tbody>
              {warrantyExpiring.map((asset, i) => (
                <tr key={i} style={{ cursor: 'pointer' }} onClick={() => navigate(`/assets/${asset.id}`)}>
                  <td style={{ padding: '10px 12px', borderBottom: '1px solid #e2e8f0', fontSize: 13 }}>{asset.asset_code}</td>
                  <td style={{ padding: '10px 12px', borderBottom: '1px solid #e2e8f0', fontSize: 13 }}>{asset.asset_name}</td>
                  <td style={{ padding: '10px 12px', borderBottom: '1px solid #e2e8f0', fontSize: 13 }}>{asset.category_name}</td>
                  <td style={{ padding: '10px 12px', borderBottom: '1px solid #e2e8f0', fontSize: 13 }}>{asset.warranty_end_date ? new Date(asset.warranty_end_date).toLocaleDateString() : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <style>{`
        @keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
        .stat-card:hover { box-shadow: 0 4px 12px rgba(0,0,0,0.08); transform: translateY(-1px); }
        .stat-card { background: #fff; border-radius: 12px; padding: 20px; display: flex; align-items: center; gap: 16px; border: 1px solid #e2e8f0; transition: all 0.2s; }
        .stat-icon { width: 48px; height: 48px; border-radius: 12px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .stat-value { font-size: 24px; font-weight: 700; margin: 0; line-height: 1.2; }
        .stat-title { font-size: 13px; color: #64748b; margin: 0; margin-top: 4px; }
      `}</style>
    </div>
  );
};

export default Dashboard;