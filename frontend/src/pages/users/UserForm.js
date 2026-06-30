import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { userAPI } from '../../services/api';
import { toast } from 'react-toastify';
import { FiArrowLeft, FiSave } from 'react-icons/fi';

const UserForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [departments, setDepartments] = useState([]);
  const [roleOptions, setRoleOptions] = useState([]);
  const [form, setForm] = useState({ employee_code: '', full_name: '', email: '', password: '', phone: '', department_id: '', status: 'active', role_ids: [] });

  useEffect(() => {
    const load = async () => {
      try {
        const [deptRes, roleRes] = await Promise.all([userAPI.getDepartments(), userAPI.getRoles()]);
        setDepartments(deptRes.data.data);
        setRoleOptions(roleRes.data.data);
        if (isEdit) {
          const userRes = await userAPI.getById(id);
          const u = userRes.data.data;
          setForm({
            employee_code: u.employee_code || '', full_name: u.full_name || '', email: u.email || '', password: '',
            phone: u.phone || '', department_id: u.department_id || '', status: u.status || 'active',
            role_ids: u.roles?.map(r => r.id) || [],
          });
        }
      } catch (err) { toast.error('Failed to load'); }
      finally { setLoading(false); }
    };
    load();
  }, [id]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  const toggleRole = (roleId) => {
    const ids = form.role_ids.includes(roleId) ? form.role_ids.filter(i => i !== roleId) : [...form.role_ids, roleId];
    setForm({ ...form, role_ids: ids });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (isEdit) {
        await userAPI.update(id, form);
        toast.success('User updated');
      } else {
        await userAPI.create(form);
        toast.success('User created');
      }
      navigate('/users');
    } catch (err) { toast.error(err.message || 'Save failed'); }
    finally { setSaving(false); }
  };

  if (loading) return <div className="card"><p style={{ textAlign: 'center', padding: 40 }}>Loading...</p></div>;

  return (
    <div>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button className="btn btn-outline" onClick={() => navigate('/users')}><FiArrowLeft /></button>
          <h1 className="page-title">{isEdit ? 'Edit User' : 'Create User'}</h1>
        </div>
      </div>
      <div className="card">
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Employee Code *</label>
              <input className="form-control" name="employee_code" value={form.employee_code} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label className="form-label">Full Name *</label>
              <input className="form-control" name="full_name" value={form.full_name} onChange={handleChange} required />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Email *</label>
              <input className="form-control" type="email" name="email" value={form.email} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label className="form-label">{isEdit ? 'New Password (leave blank to keep)' : 'Password *'}</label>
              <input className="form-control" type="password" name="password" value={form.password} onChange={handleChange} placeholder={isEdit ? 'Leave blank' : ''} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Phone</label>
              <input className="form-control" name="phone" value={form.phone} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label className="form-label">Department</label>
              <select className="form-control" name="department_id" value={form.department_id} onChange={handleChange}>
                <option value="">Select...</option>
                {departments.map(d => <option key={d.id} value={d.id}>{d.department_name}</option>)}
              </select>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Status</label>
            <select className="form-control" name="status" value={form.status} onChange={handleChange}>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Roles</label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {roleOptions.map(r => (
                <label key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer' }}>
                  <input type="checkbox" checked={form.role_ids.includes(r.id)} onChange={() => toggleRole(r.id)} />
                  {r.role_name?.replace(/_/g, ' ')}
                </label>
              ))}
            </div>
          </div>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            <FiSave /> {saving ? 'Saving...' : (isEdit ? 'Update User' : 'Create User')}
          </button>
        </form>
      </div>
    </div>
  );
};

export default UserForm;