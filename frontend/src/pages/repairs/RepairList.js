import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { repairAPI } from '../../services/api';
import { toast } from 'react-toastify';
import { FiPlus, FiEye } from 'react-icons/fi';

const RepairList = () => {
  const navigate = useNavigate();
  const [repairs, setRepairs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await repairAPI.getAll({ limit: 50 });
        setRepairs(res.data.data);
      } catch (err) { toast.error('Failed to load repairs'); }
      finally { setLoading(false); }
    };
    fetch();
  }, []);

  const getStatusClass = (s) => {
    const m = { 'reported': 'status-submitted', 'accepted': 'status-approved', 'in_progress': 'status-in-progress', 'waiting_parts': 'status-under-repair', 'fixed': 'status-fixed', 'closed': 'status-closed', 'rejected': 'status-rejected' };
    return m[s] || '';
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Repair Requests</h1>
        <button className="btn btn-primary" onClick={() => navigate('/repairs/new')}><FiPlus /> New Repair Request</button>
      </div>
      <div className="card">
        <div className="table-container">
          {loading ? <p style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>Loading...</p> :
           repairs.length === 0 ? <p style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>No repair requests</p> :
           <table>
            <thead><tr><th>Repair No</th><th>Asset</th><th>Issue Type</th><th>Status</th><th>Priority</th><th>Requested By</th><th>Assigned To</th><th>Actions</th></tr></thead>
            <tbody>
              {repairs.map(r => (
                <tr key={r.id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/repairs/${r.id}`)}>
                  <td>{r.repair_no}</td>
                  <td>{r.asset_name}</td>
                  <td>{r.issue_type || '—'}</td>
                  <td><span className={`status-badge ${getStatusClass(r.repair_status)}`}>{r.repair_status?.replace(/_/g, ' ')}</span></td>
                  <td>{r.priority}</td>
                  <td>{r.requested_by_name}</td>
                  <td>{r.assigned_to_name || '—'}</td>
                  <td onClick={e => e.stopPropagation()}>
                    <button className="btn btn-outline" style={{ padding: '4px 8px' }} onClick={() => navigate(`/repairs/${r.id}`)}><FiEye size={14} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>}
        </div>
      </div>
    </div>
  );
};

export default RepairList;