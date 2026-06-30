import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { assetAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import { FiEdit2, FiArrowLeft, FiRefreshCw } from 'react-icons/fi';

const AssetDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { hasRole } = useAuth();
  const [asset, setAsset] = useState(null);
  const [loading, setLoading] = useState(true);
  const canManage = hasRole(['super_admin', 'it_admin']);

  const fetchAsset = async () => {
    try {
      const res = await assetAPI.getById(id);
      setAsset(res.data.data);
    } catch (err) {
      toast.error('Failed to load asset');
      navigate('/assets');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAsset(); }, [id]);

  if (loading) return <div className="card"><p style={{ textAlign: 'center', padding: 40 }}>Loading...</p></div>;
  if (!asset) return null;

  return (
    <div>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button className="btn btn-outline" onClick={() => navigate('/assets')}><FiArrowLeft /></button>
          <h1 className="page-title">{asset.asset_name}</h1>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-outline" onClick={fetchAsset}><FiRefreshCw /></button>
          {canManage && (
            <button className="btn btn-primary" onClick={() => navigate(`/assets/${id}/edit`)}><FiEdit2 /> Edit</button>
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        <div className="card">
          <h3 className="card-title" style={{ marginBottom: 16 }}>Asset Information</h3>
          <div style={{ display: 'grid', gap: 12 }}>
            <div><strong>Code:</strong> {asset.asset_code}</div>
            <div><strong>Name:</strong> {asset.asset_name}</div>
            <div><strong>Category:</strong> {asset.category_name || '—'}</div>
            <div><strong>Brand:</strong> {asset.brand || '—'}</div>
            <div><strong>Model:</strong> {asset.model || '—'}</div>
            <div><strong>Serial Number:</strong> {asset.serial_number || '—'}</div>
            <div><strong>Asset Tag:</strong> {asset.asset_tag || '—'}</div>
          </div>
        </div>

        <div className="card">
          <h3 className="card-title" style={{ marginBottom: 16 }}>Status & Location</h3>
          <div style={{ display: 'grid', gap: 12 }}>
            <div><strong>Status:</strong> <span className={`status-badge ${asset.asset_status}`}>{asset.asset_status?.replace(/_/g, ' ')}</span></div>
            <div><strong>Condition:</strong> {asset.condition_status}</div>
            <div><strong>Location:</strong> {asset.location_name || '—'}</div>
            <div><strong>Building:</strong> {asset.building || '—'}</div>
            <div><strong>Floor:</strong> {asset.floor || '—'}</div>
            <div><strong>Room:</strong> {asset.room || '—'}</div>
            <div><strong>Purchase Date:</strong> {asset.purchase_date || '—'}</div>
            <div><strong>Warranty End:</strong> {asset.warranty_end_date ? new Date(asset.warranty_end_date).toLocaleDateString() : '—'}</div>
            <div><strong>Price:</strong> {asset.price ? `$${parseFloat(asset.price).toLocaleString()}` : '—'}</div>
          </div>
        </div>
      </div>

      {asset.notes && (
        <div className="card">
          <h3 className="card-title" style={{ marginBottom: 16 }}>Notes</h3>
          <p>{asset.notes}</p>
        </div>
      )}
    </div>
  );
};

export default AssetDetail;