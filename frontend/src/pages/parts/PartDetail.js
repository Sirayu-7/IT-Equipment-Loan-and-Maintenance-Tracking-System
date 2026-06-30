import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaEdit, FaPlus, FaHistory, FaExclamationTriangle, FaCheckCircle } from 'react-icons/fa';
import { partAPI } from '../../services/api';
import { toast } from 'react-toastify';

const PartDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [part, setPart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAdjust, setShowAdjust] = useState(false);
  const [adjustForm, setAdjustForm] = useState({ adjustment_type: 'add', qty: 1, reason: '' });

  useEffect(() => {
    fetchPart();
  }, [id]);

  const fetchPart = async () => {
    try {
      const res = await partAPI.getById(id);
      setPart(res.data.data);
    } catch (err) {
      toast.error(err.message || 'Failed to load part');
      navigate('/parts');
    } finally {
      setLoading(false);
    }
  };

  const handleAdjustSubmit = async (e) => {
    e.preventDefault();
    try {
      await partAPI.adjustStock(id, adjustForm);
      toast.success('Stock adjusted successfully');
      setShowAdjust(false);
      fetchPart();
    } catch (err) {
      toast.error(err.message || 'Failed to adjust stock');
    }
  };

  if (loading) return <div className="text-center py-5"><div className="spinner-border" /></div>;
  if (!part) return null;

  const statusClass = {
    in_stock: 'text-success',
    low_stock: 'text-warning',
    out_of_stock: 'text-danger',
    discontinued: 'text-secondary',
  };

  const getStatusLabel = {
    in_stock: 'In Stock',
    low_stock: 'Low Stock',
    out_of_stock: 'Out of Stock',
    discontinued: 'Discontinued',
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div className="d-flex align-items-center gap-2">
          <Link to="/parts" className="btn btn-outline-secondary">
            <FaArrowLeft />
          </Link>
          <h1 className="mb-0">{part.part_name}</h1>
          <span className={`badge ${part.status === 'in_stock' ? 'bg-success' : part.status === 'low_stock' ? 'bg-warning' : part.status === 'out_of_stock' ? 'bg-danger' : 'bg-secondary'}`}>
            {getStatusLabel[part.status]}
          </span>
        </div>
        <div className="header-actions">
          <button className="btn btn-primary" onClick={() => setShowAdjust(!showAdjust)}>
            <FaEdit /> Adjust Stock
          </button>
        </div>
      </div>

      {/* Stock Adjust Form */}
      {showAdjust && (
        <div className="card mb-3 border-primary">
          <div className="card-header"><strong>Stock Adjustment</strong></div>
          <div className="card-body">
            <form onSubmit={handleAdjustSubmit} className="row g-3">
              <div className="col-md-3">
                <label className="form-label">Type</label>
                <select
                  className="form-select"
                  value={adjustForm.adjustment_type}
                  onChange={(e) => setAdjustForm({ ...adjustForm, adjustment_type: e.target.value })}
                >
                  <option value="add">Add Stock</option>
                  <option value="remove">Remove Stock</option>
                </select>
              </div>
              <div className="col-md-3">
                <label className="form-label">Quantity</label>
                <input
                  type="number"
                  className="form-control"
                  min="1"
                  value={adjustForm.qty}
                  onChange={(e) => setAdjustForm({ ...adjustForm, qty: parseInt(e.target.value) || 0 })}
                  required
                />
              </div>
              <div className="col-md-4">
                <label className="form-label">Reason</label>
                <input
                  type="text"
                  className="form-control"
                  value={adjustForm.reason}
                  onChange={(e) => setAdjustForm({ ...adjustForm, reason: e.target.value })}
                  required
                />
              </div>
              <div className="col-md-2 d-flex align-items-end">
                <button type="submit" className="btn btn-primary w-100">Submit</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Part Info */}
      <div className="row">
        <div className="col-md-6">
          <div className="card mb-3">
            <div className="card-header"><strong>Part Information</strong></div>
            <div className="card-body">
              <table className="table table-sm">
                <tbody>
                  <tr><td>Part Code</td><td><strong>{part.part_code}</strong></td></tr>
                  <tr><td>Category</td><td>{part.category_name || '-'}</td></tr>
                  <tr><td>Brand</td><td>{part.brand || '-'}</td></tr>
                  <tr><td>Model</td><td>{part.model || '-'}</td></tr>
                  <tr><td>Unit</td><td>{part.unit}</td></tr>
                  <tr><td>Supplier</td><td>{part.supplier_name || '-'}</td></tr>
                  <tr><td>Location</td><td>{part.location_name || '-'}</td></tr>
                  <tr><td>Shelf</td><td>{part.shelf_location || '-'}</td></tr>
                  <tr><td>Cost Price</td><td>{part.cost_price ? `$${parseFloat(part.cost_price).toFixed(2)}` : '-'}</td></tr>
                  <tr><td>Notes</td><td>{part.notes || '-'}</td></tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="col-md-6">
          <div className="card mb-3">
            <div className="card-header"><strong>Stock Summary</strong></div>
            <div className="card-body">
              <div className="row text-center">
                <div className="col-4 border-end">
                  <h3 className={`${part.current_stock <= part.min_stock ? 'text-danger' : 'text-success'}`}>
                    {part.current_stock}
                  </h3>
                  <small className="text-muted">Current Stock</small>
                </div>
                <div className="col-4 border-end">
                  <h3 className="text-warning">{part.reserved_stock}</h3>
                  <small className="text-muted">Reserved</small>
                </div>
                <div className="col-4">
                  <h3 className="text-primary">{part.current_stock - part.reserved_stock}</h3>
                  <small className="text-muted">Available</small>
                </div>
              </div>
              <hr />
              <div className="d-flex justify-content-between">
                <span>Min Stock: <strong>{part.min_stock}</strong></span>
                <span>Max Stock: <strong>{part.max_stock}</strong></span>
              </div>
              {part.current_stock <= part.min_stock && (
                <div className="alert alert-warning mt-2 mb-0 py-2">
                  <FaExclamationTriangle /> Low stock alert! Consider reordering.
                </div>
              )}
            </div>
          </div>

          {/* Stock by Location */}
          {part.stocks && part.stocks.length > 0 && (
            <div className="card mb-3">
              <div className="card-header"><strong>Stock by Location</strong></div>
              <div className="card-body p-0">
                <table className="table table-sm mb-0">
                  <thead>
                    <tr>
                      <th>Location</th>
                      <th>Current</th>
                      <th>Reserved</th>
                      <th>Available</th>
                    </tr>
                  </thead>
                  <tbody>
                    {part.stocks.map((s) => (
                      <tr key={s.id}>
                        <td>{s.location_name}</td>
                        <td>{s.current_stock}</td>
                        <td>{s.reserved_stock}</td>
                        <td>{s.available_stock}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Transactions */}
      <div className="card">
        <div className="card-header">
          <strong><FaHistory /> Recent Transactions</strong>
        </div>
        <div className="card-body p-0">
          <table className="table table-sm mb-0">
            <thead>
              <tr>
                <th>Date</th>
                <th>Type</th>
                <th>Qty</th>
                <th>Before</th>
                <th>After</th>
                <th>Performed By</th>
                <th>Remark</th>
              </tr>
            </thead>
            <tbody>
              {part.transactions && part.transactions.length > 0 ? (
                part.transactions.map((t) => (
                  <tr key={t.id}>
                    <td>{new Date(t.performed_at).toLocaleString()}</td>
                    <td>
                      <span className={`badge ${t.transaction_type.includes('in') || t.transaction_type === 'initial_balance' ? 'bg-success' : t.transaction_type === 'reservation' ? 'bg-warning' : 'bg-danger'}`}>
                        {t.transaction_type.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td>{t.qty}</td>
                    <td>{t.stock_before}</td>
                    <td>{t.stock_after}</td>
                    <td>{t.performed_by_name || '-'}</td>
                    <td><small>{t.remark || '-'}</small></td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan="7" className="text-center py-3">No transactions yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default PartDetail;