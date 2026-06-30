import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { repairAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import { FiArrowLeft } from 'react-icons/fi';

const RepairDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { hasRole } = useAuth();
  const [repair, setRepair] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await repairAPI.getById(id);
        setRepair(res.data.data);
      } catch (err) { toast.error('Failed to load'); navigate('/repairs'); }
      finally { setLoading(false); }
    };
    fetch();
  }, [id]);

  const handleStatusUpdate = async (status) => {
    try {
      await repairAPI.updateStatus(id, { status, comment: '' });
      toast.success('Status updated');
      const res = await repairAPI.getById(id);
      setRepair(res.data.data);
    } catch (err) { toast.error(err.message || 'Update failed'); }
  };

  if (loading) return <div className="card"><p style={{ textAlign: 'center', padding: 40 }}>Loading...</p></div>;
  if (!repair) return null;

  const canUpdate = hasRole(['super_admin', 'it_admin', 'it_technician']);

  return (
    <div>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button className="btn btn-outline" onClick={() => navigate('/repairs')}><FiArrowLeft /></button>
          <h1 className="page-title">{repair.repair_no}</h1>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {canUpdate && repair.repair_status === 'reported' && <button className="btn btn-success" onClick={() => handleStatusUpdate('accepted')}>Accept</button>}
          {canUpdate && repair.repair_status === 'accepted' && <button className="btn btn-primary" onClick={() => handleStatusUpdate('in_progress')}>Start Repair</button>}
          {canUpdate && repair.repair_status === 'in_progress' && <button className="btn btn-success" onClick={() => handleStatusUpdate('fixed')}>Mark Fixed</button>}
          {canUpdate && repair.repair_status === 'fixed' && <button className="btn btn-primary" onClick={() => handleStatusUpdate('closed')}>Close</button>}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        <div className="card">
          <h3 className="card-title" style={{ marginBottom: 16 }}>Repair Details</h3>
          <div style={{ display: 'grid', gap: 12 }}>
            <div><strong>Asset:</strong> {repair.asset_name} ({repair.asset_code})</div>
            <div><strong>Issue Type:</strong> {repair.issue_type || '—'}</div>
            <div><strong>Issue Detail:</strong> {repair.issue_detail || '—'}</div>
            <div><strong>Status:</strong> <span className={`status-badge`}>{repair.repair_status?.replace(/_/g, ' ')}</span></div>
            <div><strong>Priority:</strong> {repair.priority}</div>
            <div><strong>Requested By:</strong> {repair.requested_by_name}</div>
            <div><strong>Assigned To:</strong> {repair.assigned_to_name || '—'}</div>
            {repair.resolution_detail && <div><strong>Resolution:</strong> {repair.resolution_detail}</div>}
          </div>
        </div>

        <div className="card">
          <h3 className="card-title" style={{ marginBottom: 16 }}>Activity Log</h3>
          {repair.logs?.length > 0 ? (
            <div style={{ maxHeight: 300, overflowY: 'auto' }}>
              {repair.logs.map((log, i) => (
                <div key={i} style={{ padding: '8px 0', borderBottom: '1px solid #f1f5f9', fontSize: 13 }}>
                  <p style={{ fontWeight: 500, margin: 0 }}>{log.status_from} → {log.status_to}</p>
                  <p style={{ color: '#64748b', margin: 0, fontSize: 12 }}>{log.action_by_name} - {log.action_at ? new Date(log.action_at).toLocaleString() : ''}</p>
                  {log.comment && <p style={{ color: '#64748b', margin: 0, fontSize: 12 }}>{log.comment}</p>}
                </div>
              ))}
            </div>
          ) : <p style={{ color: '#94a3b8' }}>No activity logs</p>}
        </div>
      </div>
    </div>
  );
};

export default RepairDetail;