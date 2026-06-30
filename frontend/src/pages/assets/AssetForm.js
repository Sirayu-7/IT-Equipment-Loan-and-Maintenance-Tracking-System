import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { assetAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import { FiArrowLeft, FiSave } from 'react-icons/fi';

const AssetForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { hasRole } = useAuth();
  const isEdit = Boolean(id);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState([]);
  const [locations, setLocations] = useState([]);
  const [form, setForm] = useState({
    asset_code: '', asset_name: '', category_id: '', brand: '', model: '',
    serial_number: '', asset_tag: '', location_id: '', condition_status: 'good',
    asset_status: 'available', purchase_date: '', warranty_end_date: '', price: '', notes: '',
  });

  useEffect(() => {
    const load = async () => {
      try {
        const [catRes, locRes] = await Promise.all([
          assetAPI.getCategories(),
          assetAPI.getLocations(),
        ]);
        setCategories(catRes.data.data);
        setLocations(locRes.data.data);
        if (isEdit) {
          const assetRes = await assetAPI.getById(id);
          const a = assetRes.data.data;
          setForm({
            asset_code: a.asset_code || '', asset_name: a.asset_name || '', category_id: a.category_id || '',
            brand: a.brand || '', model: a.model || '', serial_number: a.serial_number || '',
            asset_tag: a.asset_tag || '', location_id: a.location_id || '', condition_status: a.condition_status || 'good',
            asset_status: a.asset_status || 'available', purchase_date: a.purchase_date || '',
            warranty_end_date: a.warranty_end_date ? a.warranty_end_date.split('T')[0] : '', price: a.price || '', notes: a.notes || '',
          });
        }
      } catch (err) {
        toast.error('Failed to load form data');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.asset_code || !form.asset_name) {
      toast.error('Asset code and name are required');
      return;
    }
    setSaving(true);
    try {
      if (isEdit) {
        await assetAPI.update(id, form);
        toast.success('Asset updated');
      } else {
        await assetAPI.create(form);
        toast.success('Asset created');
      }
      navigate('/assets');
    } catch (err) {
      toast.error(err.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="card"><p style={{ textAlign: 'center', padding: 40 }}>Loading...</p></div>;

  if (!hasRole(['super_admin', 'it_admin'])) {
    return <div className="card"><p style={{ textAlign: 'center', padding: 40 }}>Access denied</p></div>;
  }

  return (
    <div>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button className="btn btn-outline" onClick={() => navigate('/assets')}><FiArrowLeft /></button>
          <h1 className="page-title">{isEdit ? 'Edit Asset' : 'Create Asset'}</h1>
        </div>
      </div>

      <div className="card">
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Asset Code *</label>
              <input className="form-control" name="asset_code" value={form.asset_code} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label className="form-label">Asset Name *</label>
              <input className="form-control" name="asset_name" value={form.asset_name} onChange={handleChange} required />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Category</label>
              <select className="form-control" name="category_id" value={form.category_id} onChange={handleChange}>
                <option value="">Select...</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.category_name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Location</label>
              <select className="form-control" name="location_id" value={form.location_id} onChange={handleChange}>
                <option value="">Select...</option>
                {locations.map(l => <option key={l.id} value={l.id}>{l.location_name}</option>)}
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Brand</label>
              <input className="form-control" name="brand" value={form.brand} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label className="form-label">Model</label>
              <input className="form-control" name="model" value={form.model} onChange={handleChange} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Serial Number</label>
              <input className="form-control" name="serial_number" value={form.serial_number} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label className="form-label">Asset Tag</label>
              <input className="form-control" name="asset_tag" value={form.asset_tag} onChange={handleChange} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Status</label>
              <select className="form-control" name="asset_status" value={form.asset_status} onChange={handleChange}>
                <option value="available">Available</option>
                <option value="reserved">Reserved</option>
                <option value="retired">Retired</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Condition</label>
              <select className="form-control" name="condition_status" value={form.condition_status} onChange={handleChange}>
                <option value="new">New</option>
                <option value="good">Good</option>
                <option value="fair">Fair</option>
                <option value="poor">Poor</option>
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Purchase Date</label>
              <input className="form-control" type="date" name="purchase_date" value={form.purchase_date} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label className="form-label">Warranty End Date</label>
              <input className="form-control" type="date" name="warranty_end_date" value={form.warranty_end_date} onChange={handleChange} />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Notes</label>
            <textarea className="form-control" name="notes" rows={3} value={form.notes} onChange={handleChange} />
          </div>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            <FiSave /> {saving ? 'Saving...' : (isEdit ? 'Update Asset' : 'Create Asset')}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AssetForm;