import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { userAPI } from '../../services/api';
import { toast } from 'react-toastify';
import { FiPlus, FiEdit2 } from 'react-icons/fi';

const UserList = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await userAPI.getAll({ limit: 50 });
        setUsers(res.data.data);
      } catch (err) { toast.error('Failed to load users'); }
      finally { setLoading(false); }
    };
    fetch();
  }, []);

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Users</h1>
        <button className="btn btn-primary" onClick={() => navigate('/users/new')}><FiPlus /> Add User</button>
      </div>
      <div className="card">
        <div className="table-container">
          {loading ? <p style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>Loading...</p> :
           users.length === 0 ? <p style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>No users</p> :
           <table>
            <thead><tr><th>Code</th><th>Name</th><th>Email</th><th>Department</th><th>Status</th><th>Roles</th><th>Actions</th></tr></thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id}>
                  <td>{u.employee_code}</td>
                  <td>{u.full_name}</td>
                  <td>{u.email}</td>
                  <td>{u.department_name || '—'}</td>
                  <td><span className={`status-badge ${u.status === 'active' ? 'status-available' : 'status-retired'}`}>{u.status}</span></td>
                  <td>{u.roles?.map(r => r.role_name).join(', ') || '—'}</td>
                  <td>
                    <button className="btn btn-outline" style={{ padding: '4px 8px' }} onClick={() => navigate(`/users/${u.id}/edit`)}><FiEdit2 size={14} /></button>
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

export default UserList;