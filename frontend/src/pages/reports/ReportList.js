import React, { useState, useEffect } from 'react';
import { dashboardAPI, borrowAPI, repairAPI } from '../../services/api';
import { toast } from 'react-toastify';

const ReportList = () => {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await dashboardAPI.getAdminSummary();
        setSummary(res.data.data);
      } catch (err) { toast.error('Failed to load reports'); }
      finally { setLoading(false); }
    };
    fetch();
  }, []);

  if (loading) return <div className="card"><p style={{ textAlign: 'center', padding: 40 }}>Loading...</p></div>;

  return (
    <div>
      <div className="page-header"><h1 className="page-title">Reports</h1></div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        <div className="card">
          <h3 className="card-title" style={{ marginBottom: 16 }}>Asset Summary</h3>
          <div style={{ display: 'grid', gap: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f1f5f9' }}>
              <span>Total Assets</span><span style={{ fontWeight: 600 }}>{summary?.total_assets || 0}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f1f5f9' }}>
              <span>Available</span><span style={{ fontWeight: 600, color: '#10b981' }}>{summary?.available_assets || 0}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f1f5f9' }}>
              <span>Borrowed</span><span style={{ fontWeight: 600, color: '#3b82f6' }}>{summary?.borrowed_assets || 0}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f1f5f9' }}>
              <span>Under Repair</span><span style={{ fontWeight: 600, color: '#f59e0b' }}>{summary?.under_repair_assets || 0}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0' }}>
              <span>Warranty Expiring</span><span style={{ fontWeight: 600, color: '#f97316' }}>{summary?.warranty_expiring_soon || 0}</span>
            </div>
          </div>
        </div>
        <div className="card">
          <h3 className="card-title" style={{ marginBottom: 16 }}>Activity Summary</h3>
          <div style={{ display: 'grid', gap: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f1f5f9' }}>
              <span>Overdue Borrows</span><span style={{ fontWeight: 600, color: '#ef4444' }}>{summary?.overdue_borrows || 0}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f1f5f9' }}>
              <span>Open Repairs</span><span style={{ fontWeight: 600, color: '#f59e0b' }}>{summary?.open_repairs || 0}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f1f5f9' }}>
              <span>Completed Repairs (Month)</span><span style={{ fontWeight: 600, color: '#10b981' }}>{summary?.completed_repairs_month || 0}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f1f5f9' }}>
              <span>Pending Approvals</span><span style={{ fontWeight: 600, color: '#8b5cf6' }}>{summary?.pending_approvals || 0}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0' }}>
              <span>Active Users</span><span style={{ fontWeight: 600 }}>{summary?.active_users || 0}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportList;