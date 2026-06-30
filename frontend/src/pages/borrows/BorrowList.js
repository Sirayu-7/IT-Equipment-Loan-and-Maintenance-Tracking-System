import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { borrowAPI } from '../../services/api';
import { toast } from 'react-toastify';
import { FiPlus, FiEye } from 'react-icons/fi';

const BorrowList = () => {
  const navigate = useNavigate();
  const [borrows, setBorrows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await borrowAPI.getAll({ limit: 50 });
        setBorrows(res.data.data);
      } catch (err) {
        toast.error('Failed to load borrow requests');
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  const getStatusClass = (s) => {
    const m = { 'draft': 'status-draft', 'submitted': 'status-submitted', 'approved': 'status-approved', 'rejected': 'status-rejected', 'borrowed': 'status-borrowed', 'returned': 'status-available', 'cancelled': 'status-retired' };
    return m[s] || '';
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Borrow Requests</h1>
        <button className="btn btn-primary" onClick={() => navigate('/borrows/new')}><FiPlus /> New Request</button>
      </div>
      <div className="card">
        <div className="table-container">
          {loading ? <p style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>Loading...</p> :
           borrows.length === 0 ? <p style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>No borrow requests</p> :
           <table>
            <thead><tr><th>Request No</th><th>Requester</th><th>Date</th><th>Status</th><th>Priority</th><th>Items</th><th>Actions</th></tr></thead>
            <tbody>
              {borrows.map(b => (
                <tr key={b.id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/borrows/${b.id}`)}>
                  <td>{b.request_no}</td>
                  <td>{b.requester_name}</td>
                  <td>{b.request_date ? new Date(b.request_date).toLocaleDateString() : '—'}</td>
                  <td><span className={`status-badge ${getStatusClass(b.request_status)}`}>{b.request_status}</span></td>
                  <td>{b.priority}</td>
                  <td>{b.item_count || 0}</td>
                  <td onClick={e => e.stopPropagation()}>
                    <button className="btn btn-outline" style={{ padding: '4px 8px' }} onClick={() => navigate(`/borrows/${b.id}`)}><FiEye size={14} /></button>
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

export default BorrowList;