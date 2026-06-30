import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { FaPlus, FaSearch, FaEdit, FaBoxes, FaExclamationTriangle, FaWarehouse } from 'react-icons/fa';
import { partAPI } from '../../services/api';
import { toast } from 'react-toastify';

const STATUS_BADGES = {
  in_stock: { label: 'In Stock', class: 'badge-success' },
  low_stock: { label: 'Low Stock', class: 'badge-warning' },
  out_of_stock: { label: 'Out of Stock', class: 'badge-danger' },
  discontinued: { label: 'Discontinued', class: 'badge-secondary' },
};

const PartList = () => {
  const [parts, setParts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 20, totalPages: 0 });
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [categories, setCategories] = useState([]);
  const [alerts, setAlerts] = useState({ lowStock: [], reorderNeeded: [] });

  const fetchParts = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params = { page, limit: 20 };
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      if (categoryFilter) params.category_id = categoryFilter;

      const res = await partAPI.getAll(params);
      setParts(res.data.data.parts);
      setPagination(res.data.data.pagination);
    } catch (err) {
      toast.error(err.message || 'Failed to load parts');
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, categoryFilter]);

  const fetchCategories = async () => {
    try {
      const res = await partAPI.getCategories();
      setCategories(res.data.data || []);
    } catch (err) { /* ignore */ }
  };

  const fetchAlerts = async () => {
    try {
      const res = await partAPI.getStockAlerts();
      setAlerts(res.data.data);
    } catch (err) { /* ignore */ }
  };

  useEffect(() => {
    fetchCategories();
    fetchAlerts();
  }, []);

  useEffect(() => {
    fetchParts(1);
  }, [fetchParts]);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchParts(1);
  };

  const getStatusBadge = (status) => {
    const badge = STATUS_BADGES[status] || { label: status, class: 'badge-secondary' };
    return <span className={`badge ${badge.class}`}>{badge.label}</span>;
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1><FaBoxes /> Spare Parts Inventory</h1>
        <div className="header-actions">
          <Link to="/parts/new" className="btn btn-primary">
            <FaPlus /> Add Part
          </Link>
        </div>
      </div>

      {/* Stock Alerts */}
      {alerts.lowStock && alerts.lowStock.length > 0 && (
        <div className="alert alert-warning d-flex align-items-center mb-3">
          <FaExclamationTriangle className="me-2" />
          <span>
            <strong>{alerts.lowStock.length} parts</strong> are low on stock or out of stock.
            {alerts.reorderNeeded && alerts.reorderNeeded.length > 0 && (
              <span> <strong>{alerts.reorderNeeded.length} parts</strong> need reorder.</span>
            )}
          </span>
        </div>
      )}

      {/* Filters */}
      <div className="card mb-3">
        <div className="card-body">
          <form onSubmit={handleSearch} className="row g-2">
            <div className="col-md-4">
              <div className="input-group">
                <input
                  type="text"
                  className="form-control"
                  placeholder="Search parts..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                <button className="btn btn-outline-primary" type="submit">
                  <FaSearch />
                </button>
              </div>
            </div>
            <div className="col-md-3">
              <select
                className="form-select"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="">All Statuses</option>
                <option value="in_stock">In Stock</option>
                <option value="low_stock">Low Stock</option>
                <option value="out_of_stock">Out of Stock</option>
                <option value="discontinued">Discontinued</option>
              </select>
            </div>
            <div className="col-md-3">
              <select
                className="form-select"
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
              >
                <option value="">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.category_name}</option>
                ))}
              </select>
            </div>
            <div className="col-md-2">
              <Link to="/parts/stock-alerts" className="btn btn-outline-warning w-100">
                <FaExclamationTriangle /> Alerts
              </Link>
            </div>
          </form>
        </div>
      </div>

      {/* Parts Table */}
      <div className="card">
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-striped table-hover mb-0">
              <thead>
                <tr>
                  <th>Part Code</th>
                  <th>Part Name</th>
                  <th>Category</th>
                  <th>Current Stock</th>
                  <th>Reserved</th>
                  <th>Available</th>
                  <th>Min Stock</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="9" className="text-center py-4">Loading...</td></tr>
                ) : parts.length === 0 ? (
                  <tr><td colSpan="9" className="text-center py-4">No parts found</td></tr>
                ) : (
                  parts.map((part) => (
                    <tr key={part.id}>
                      <td><strong>{part.part_code}</strong></td>
                      <td>
                        <Link to={`/parts/${part.id}`}>{part.part_name}</Link>
                        {part.brand && <small className="d-block text-muted">{part.brand}</small>}
                      </td>
                      <td>{part.category_name || '-'}</td>
                      <td className={part.current_stock <= part.min_stock ? 'text-danger fw-bold' : ''}>
                        {part.current_stock}
                      </td>
                      <td className="text-warning">{part.reserved_stock}</td>
                      <td className="text-success fw-bold">{part.current_stock - part.reserved_stock}</td>
                      <td>{part.min_stock}</td>
                      <td>{getStatusBadge(part.status)}</td>
                      <td>
                        <Link to={`/parts/${part.id}`} className="btn btn-sm btn-outline-primary me-1">
                          <FaEdit />
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <nav className="mt-3">
          <ul className="pagination justify-content-center">
            {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((p) => (
              <li key={p} className={`page-item ${p === pagination.page ? 'active' : ''}`}>
                <button className="page-link" onClick={() => fetchParts(p)}>{p}</button>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </div>
  );
};

export default PartList;