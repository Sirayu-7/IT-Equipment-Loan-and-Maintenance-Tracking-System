import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { assetAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import { FiPlus, FiSearch, FiEdit2, FiTrash2, FiEye } from 'react-icons/fi';

const AssetList = () => {
  const navigate = useNavigate();
  const { hasRole } = useAuth();
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const canManage = hasRole(['super_admin', 'it_admin']);

  const fetchAssets = async (page = 1) => {
    setLoading(true);
    try {
      const res = await assetAPI.getAll({ page, limit: 20, search, asset_status: statusFilter || undefined });
      setAssets(res.data.data);
      setPagination(res.data.pagination);
    } catch (err) {
      toast.error('Failed to load assets');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssets();
  }, [statusFilter]);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchAssets(1);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this asset?')) return;
    try {
      await assetAPI.delete(id);
      toast.success('Asset deleted');
      fetchAssets(pagination.page);
    } catch (err) {
      toast.error(err.message || 'Delete failed');
    }
  };

  const getStatusClass = (status) => {
    const map = {
      'available': 'status-available',
      'borrowed': 'status-borrowed',
      'under_repair': 'status-under-repair',
      'pending_repair': 'status-pending-repair',
      'lost': 'status-lost',
      'damaged': 'status-damaged',
      'retired': 'status-retired',
    };
    return map[status] || '';
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Assets</h1>
        {canManage && (
          <button className="btn btn-primary" onClick={() => navigate('/assets/new')}>
            <FiPlus /> Add Asset
          </button>
        )}
      </div>

      <div className="card">
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <FiSearch style={{ position: 'absolute', left: 12, top: 12, color: '#94a3b8' }} />
            <input
              className="form-control"
              style={{ paddingLeft: 36 }}
              placeholder="Search by code, name, serial number..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select className="form-control" style={{ width: 180 }} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">All Statuses</option>
            <option value="available">Available</option>
            <option value="borrowed">Borrowed</option>
            <option value="under_repair">Under Repair</option>
            <option value="pending_repair">Pending Repair</option>
            <option value="lost">Lost</option>
            <option value="damaged">Damaged</option>
            <option value="retired">Retired</option>
          </select>
          <button type="submit" className="btn btn-primary">Search</button>
        </form>

        <div className="table-container">
          {loading ? (
            <p style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>Loading...</p>
          ) : assets.length === 0 ? (
            <p style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>No assets found</p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Name</th>
                  <th>Category</th>
                  <th>Status</th>
                  <th>Condition</th>
                  <th>Location</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {assets.map((asset) => (
                  <tr key={asset.id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/assets/${asset.id}`)}>
                    <td>{asset.asset_code}</td>
                    <td>{asset.asset_name}</td>
                    <td>{asset.category_name || '—'}</td>
                    <td><span className={`status-badge ${getStatusClass(asset.asset_status)}`}>{asset.asset_status?.replace(/_/g, ' ')}</span></td>
                    <td>{asset.condition_status}</td>
                    <td>{asset.location_name || '—'}</td>
                    <td onClick={(e) => e.stopPropagation()}>
                      <button className="btn btn-outline" style={{ padding: '4px 8px', marginRight: 4 }} onClick={() => navigate(`/assets/${asset.id}/edit`)} disabled={!canManage}>
                        <FiEdit2 size={14} />
                      </button>
                      <button className="btn btn-danger" style={{ padding: '4px 8px' }} onClick={() => handleDelete(asset.id)} disabled={!canManage}>
                        <FiTrash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {pagination.totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 16 }}>
            <button className="btn btn-outline" disabled={pagination.page <= 1} onClick={() => fetchAssets(pagination.page - 1)}>Previous</button>
            <span style={{ padding: '8px 16px', color: '#64748b' }}>Page {pagination.page} of {pagination.totalPages}</span>
            <button className="btn btn-outline" disabled={pagination.page >= pagination.totalPages} onClick={() => fetchAssets(pagination.page + 1)}>Next</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AssetList;