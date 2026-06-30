import React, { useState, useEffect } from 'react';
import { userAPI } from '../../services/api';
import { toast } from 'react-toastify';

const RoleList = () => {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await userAPI.getRoles();
        setRoles(res.data.data);
      } catch (err) { toast.error('Failed to load roles'); }
      finally { setLoading(false); }
    };
    fetch();
  }, []);

  return (
    <div>
      <div className="page-header"><h1 className="page-title">Roles & Permissions</h1></div>
      <div className="card">
        {loading ? <p style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>Loading...</p> :
         <table>
          <thead><tr><th>Role</th><th>Description</th><th>Permissions</th></tr></thead>
          <tbody>
            {roles.map(r => (
              <tr key={r.id}>
                <td><strong>{r.role_name?.replace(/_/g, ' ')}</strong></td>
                <td>{r.description || '—'}</td>
                <td style={{ maxWidth: 400 }}><span style={{ fontSize: 12, color: '#64748b' }}>{r.permissions || 'No permissions assigned'}</span></td>
              </tr>
            ))}
          </tbody>
        </table>}
      </div>
    </div>
  );
};

export default RoleList;