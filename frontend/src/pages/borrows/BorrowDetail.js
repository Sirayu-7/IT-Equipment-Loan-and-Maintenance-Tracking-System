import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { borrowAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import { FiArrowLeft } from 'react-icons/fi';

const BorrowDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, hasRole } = useAuth();
  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await borrowAPI.getById(id);
        setRequest(res.data.data);
      } catch (err) {
        toast.error('Failed to load request');
        navigate('/borrows');
      } finally { setLoading(false); }
    };
    fetch();
  }, [id]);

  const handleApprove = async () => {
    try {
      await borrowAPI.approve(id, { notes: '' });
      toast.success('Request approved');
      const res = await borrowAPI.getById(id);
      setRequest(res.data.data);
    } catch (err) { toast.error(err.message || 'Approve failed'); }
  };

  const handleReject = async () => {
    const reason = prompt('Enter rejection reason:');
    if (!reason) return;
    try {
      await borrowAPI.reject(id, { reason });
      toast.success('Request rejected');
      const res = await borrowAPI.getById(id);
      setRequest(res.data.data);
    } catch (err) { toast.error(err.message || 'Reject failed'); }
  };

  const handleConfirmBorrow = async () => {
    try {
      await borrowAPI.confirmBorrow(id);
      toast.success('Borrow confirmed');
      const res = await borrowAPI.getById(id);
      setRequest(res.data.data);
    } catch (err) { toast.error(err.message || 'Confirm failed'); }
  };

  const handleReturn = async () => {
    if (!request?.items) return;
    const items = request.items.map(item => ({
      item_id: item.id,
      condition: 'good',
      notes: ''
    }));
    try {
      await borrowAPI.returnAssets(id, { items });
      toast.success('Return processed');
      const res = await borrowAPI.getById(id);
      setRequest(res.data.data);
    } catch (err) { toast.error(err.message || 'Return failed'); }
  };

  const handleSubmit = async () => {
    try {
      await borrowAPI.submit(id);
      toast.success('Request submitted');
      const res = await borrowAPI.getById(id);
      setRequest(res.data.data);
    } catch (err) { toast.error(err.message || 'Submit failed'); }
  };

  const handleCancel = async () => {
    try {
      await borrowAPI.cancel(id);
      toast.success('Request cancelled');
      const res = await borrowAPI.getById(id);
      setRequest(res.data.data);
    } catch (err) { toast.error(err.message || 'Cancel failed'); }
  };

  if (loading) return <div className="card"><p style={{ textAlign: 'center', padding: 40 }}>Loading...</p></div>;
  if (!request) return null;

  const canApprove = hasRole(['super_admin', 'it_admin', 'approver']) && request.request_status === 'submitted';
  const isOwner = request.requester_id === user?.id;
  const canConfirmBorrow = hasRole(['super_admin', 'it_admin']) && request.request_status === 'approved';
  const canReturn = hasRole(['super_admin', 'it_admin']) && (request.request_status === 'borrowed');
  const canSubmit = isOwner && request.request_status === 'draft';
  const canCancel = isOwner && ['draft', 'submitted'].includes(request.request_status);

  return (
    <div>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button className="btn btn-outline" onClick={() => navigate('/borrows')}><FiArrowLeft /></button>
          <h1 className="page-title">{request.request_no}</h1>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {canSubmit && <button className="btn btn-primary" onClick={handleSubmit}>Submit</button>}
          {canApprove && <button className="btn btn-success" onClick={handleApprove}>Approve</button>}
          {canApprove && <button className="btn btn-danger" onClick={handleReject}>Reject</button>}
          {canConfirmBorrow && <button className="btn btn-primary" onClick={handleConfirmBorrow}>Confirm Borrow</button>}
          {canReturn && <button className="btn btn-success" onClick={handleReturn}>Process Return</button>}
          {canCancel && <button className="btn btn-outline" onClick={handleCancel}>Cancel</button>}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        <div className="card">
          <h3 className="card-title" style={{ marginBottom: 16 }}>Request Details</h3>
          <div style={{ display: 'grid', gap: 12 }}>
            <div><strong>Requester:</strong> {request.requester_name}</div>
            <div><strong>Status:</strong> <span className={`status-badge`}>{request.request_status}</span></div>
            <div><strong>Priority:</strong> {request.priority}</div>
            <div><strong>Purpose:</strong> {request.purpose || '—'}</div>
            <div><strong>Needed From:</strong> {request.needed_from || '—'}</div>
            <div><strong>Needed Until:</strong> {request.needed_until || '—'}</div>
            {request.approver_name && <div><strong>Approver:</strong> {request.approver_name}</div>}
            {request.rejected_reason && <div><strong>Rejection Reason:</strong> {request.rejected_reason}</div>}
          </div>
        </div>

        <div className="card">
          <h3 className="card-title" style={{ marginBottom: 16 }}>Items</h3>
          {request.items?.length > 0 ? (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead><tr><th style={{ padding: 8, borderBottom: '1px solid #e2e8f0', textAlign: 'left' }}>Asset</th><th style={{ padding: 8, borderBottom: '1px solid #e2e8f0', textAlign: 'left' }}>Code</th><th style={{ padding: 8, borderBottom: '1px solid #e2e8f0', textAlign: 'left' }}>Status</th></tr></thead>
              <tbody>
                {request.items.map(item => (
                  <tr key={item.id}>
                    <td style={{ padding: 8, borderBottom: '1px solid #f1f5f9' }}>{item.asset_name}</td>
                    <td style={{ padding: 8, borderBottom: '1px solid #f1f5f9' }}>{item.asset_code}</td>
                    <td style={{ padding: 8, borderBottom: '1px solid #f1f5f9' }}>{item.item_status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : <p style={{ color: '#94a3b8' }}>No items</p>}
        </div>
      </div>
    </div>
  );
};

export default BorrowDetail;