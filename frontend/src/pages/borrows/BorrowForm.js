import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { borrowAPI, assetAPI } from '../../services/api';
import { toast } from 'react-toastify';
import { FiArrowLeft, FiSave, FiPlus, FiX } from 'react-icons/fi';

const BorrowForm = () => {
  const navigate = useNavigate();
  const [assets, setAssets] = useState([]);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ purpose: '', needed_from: '', needed_until: '', priority: 'medium', notes: '' });
  const [selectedItems, setSelectedItems] = useState([{ asset_id: '', qty: 1 }]);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await assetAPI.getAll({ limit: 100, asset_status: 'available' });
        setAssets(res.data.data || []);
      } catch (err) { toast.error('Failed to load assets'); }
    };
    fetch();
  }, []);

  const addItem = () => setSelectedItems([...selectedItems, { asset_id: '', qty: 1 }]);
  const removeItem = (i) => setSelectedItems(selectedItems.filter((_, idx) => idx !== i));
  const updateItem = (i, field, value) => {
    const items = [...selectedItems];
    items[i][field] = value;
    setSelectedItems(items);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validItems = selectedItems.filter(item => item.asset_id);
    if (validItems.length === 0) {
      toast.error('Please select at least one asset');
      return;
    }
    setSaving(true);
    try {
      await borrowAPI.create({ ...form, items: validItems });
      toast.success('Borrow request created');
      navigate('/borrows');
    } catch (err) {
      toast.error(err.message || 'Failed to create');
    } finally { setSaving(false); }
  };

  return (
    <div>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button className="btn btn-outline" onClick={() => navigate('/borrows')}><FiArrowLeft /></button>
          <h1 className="page-title">New Borrow Request</h1>
        </div>
      </div>
      <div className="card">
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Purpose</label>
              <textarea className="form-control" rows={2} value={form.purpose} onChange={e => setForm({...form, purpose: e.target.value})} />
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
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Needed From</label>
              <input className="form-control" type="date" value={form.needed_from} onChange={e => setForm({...form, needed_from: e.target.value})} />
            </div>
            <div className="form-group">
              <label className="form-label">Needed Until</label>
              <input className="form-control" type="date" value={form.needed_until} onChange={e => setForm({...form, needed_until: e.target.value})} />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Notes</label>
            <textarea className="form-control" rows={2} value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} />
          </div>

          <h3 style={{ margin: '16px 0' }}>Items</h3>
          {selectedItems.map((item, i) => (
            <div key={i} className="form-row" style={{ alignItems: 'end', marginBottom: 8 }}>
              <div className="form-group">
                <label className="form-label">Asset</label>
                <select className="form-control" value={item.asset_id} onChange={e => updateItem(i, 'asset_id', e.target.value)}>
                  <option value="">Select...</option>
                  {assets.map(a => <option key={a.id} value={a.id}>{a.asset_code} - {a.asset_name}</option>)}
                </select>
              </div>
              <div className="form-group" style={{ width: 100 }}>
                <label className="form-label">Qty</label>
                <input className="form-control" type="number" min={1} value={item.qty} onChange={e => updateItem(i, 'qty', parseInt(e.target.value) || 1)} />
              </div>
              {selectedItems.length > 1 && (
                <button type="button" className="btn btn-outline" style={{ marginBottom: 16 }} onClick={() => removeItem(i)}><FiX /></button>
              )}
            </div>
          ))}
          <button type="button" className="btn btn-outline" onClick={addItem} style={{ marginBottom: 16 }}><FiPlus /> Add Item</button>

          <div>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              <FiSave /> {saving ? 'Creating...' : 'Create & Save as Draft'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BorrowForm;