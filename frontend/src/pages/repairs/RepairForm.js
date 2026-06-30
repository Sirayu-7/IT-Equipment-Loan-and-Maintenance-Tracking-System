import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { repairAPI, assetAPI } from '../../services/api';
import { toast } from 'react-toastify';
import { FiArrowLeft, FiSave } from 'react-icons/fi';

const RepairForm = () => {
  const navigate = useNavigate();
  const [assets, setAssets] = useState([]);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ asset_id: '', issue_type: '', issue_detail: '', priority: 'medium' });

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await assetAPI.getAll({ limit: 100 });
        setAssets(res.data.data || []);
      } catch (err) { toast.error('Failed to load assets'); }
    };
    fetch();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.asset_id) { toast.error('Please select an asset'); return; }
    setSaving(true);
    try {
      await repairAPI.create(form);
      toast.success('Repair request created');
      navigate('/repairs');
    } catch (err) { toast.error(err.message || 'Failed to create'); }
    finally { setSaving(false); }
  };

  return (
    <div>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button className="btn btn-outline" onClick={() => navigate('/repairs')}><FiArrowLeft /></button>
          <h1 className="page-title">New Repair Request</h1>
        </div>
      </div>
      <div className="card">
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Asset *</label>
            <select className="form-control" value={form.asset_id} onChange={e => setForm({...form, asset_id: e.target.value})} required>
              <option value="">Select asset...</option>
              {assets.map(a => <option key={a.id} value={a.id}>{a.asset_code} - {a.asset_name}</option>)}
            </select>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Issue Type</label>
              <input className="form-control" value={form.issue_type} onChange={e => setForm({...form, issue_type: e.target.value})} placeholder="e.g., Hardware failure, Software issue" />
            </div>
            <div className="form-group">
              <label className="form-label">Priority</label>
              <select className="form-control" value={form.priority} onChange={e => setForm({...form, priority: e.target.value})}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Issue Detail</label>
            <textarea className="form-control" rows={4} value={form.issue_detail} onChange={e => setForm({...form, issue_detail: e.target.value})} placeholder="Describe the issue in detail..." />
          </div>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            <FiSave /> {saving ? 'Creating...' : 'Submit Repair Request'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default RepairForm;