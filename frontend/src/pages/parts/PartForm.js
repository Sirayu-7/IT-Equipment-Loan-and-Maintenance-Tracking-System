import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaSave, FaArrowLeft } from 'react-icons/fa';
import { partAPI } from '../../services/api';
import { toast } from 'react-toastify';

const PartForm = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [locations, setLocations] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    part_code: '',
    part_name: '',
    category_id: '',
    unit: 'piece',
    brand: '',
    model: '',
    supplier_id: '',
    min_stock: 0,
    max_stock: 0,
    current_stock: 0,
    cost_price: '',
    location_id: '',
    shelf_location: '',
    notes: '',
  });

  useEffect(() => {
    fetchReferenceData();
  }, []);

  const fetchReferenceData = async () => {
    try {
      const [catRes, locRes, supRes] = await Promise.all([
        partAPI.getCategories(),
        partAPI.getLocations(),
        partAPI.getSuppliers(),
      ]);
      setCategories(catRes.data.data || []);
      setLocations(locRes.data.data || []);
      setSuppliers(supRes.data.data || []);
    } catch (err) {
      toast.error('Failed to load reference data');
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        ...form,
        category_id: form.category_id ? parseInt(form.category_id) : null,
        supplier_id: form.supplier_id ? parseInt(form.supplier_id) : null,
        location_id: form.location_id ? parseInt(form.location_id) : null,
        min_stock: parseInt(form.min_stock) || 0,
        max_stock: parseInt(form.max_stock) || 0,
        current_stock: parseInt(form.current_stock) || 0,
        cost_price: form.cost_price ? parseFloat(form.cost_price) : null,
      };
      await partAPI.create(payload);
      toast.success('Part created successfully');
      navigate('/parts');
    } catch (err) {
      toast.error(err.message || 'Failed to create part');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div className="d-flex align-items-center gap-2">
          <button className="btn btn-outline-secondary" onClick={() => navigate('/parts')}>
            <FaArrowLeft />
          </button>
          <h1 className="mb-0">Add New Part</h1>
        </div>
      </div>

      <div className="card">
        <div className="card-body">
          <form onSubmit={handleSubmit}>
            <div className="row g-3">
              <div className="col-md-4">
                <label className="form-label">Part Code *</label>
                <input
                  type="text"
                  className="form-control"
                  name="part_code"
                  value={form.part_code}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="col-md-8">
                <label className="form-label">Part Name *</label>
                <input
                  type="text"
                  className="form-control"
                  name="part_name"
                  value={form.part_name}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="col-md-4">
                <label className="form-label">Category</label>
                <select
                  className="form-select"
                  name="category_id"
                  value={form.category_id}
                  onChange={handleChange}
                >
                  <option value="">Select Category</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.category_name}</option>
                  ))}
                </select>
              </div>
              <div className="col-md-2">
                <label className="form-label">Unit</label>
                <select className="form-select" name="unit" value={form.unit} onChange={handleChange}>
                  <option value="piece">Piece</option>
                  <option value="box">Box</option>
                  <option value="set">Set</option>
                  <option value="meter">Meter</option>
                  <option value="liter">Liter</option>
                  <option value="kg">Kg</option>
                </select>
              </div>
              <div className="col-md-3">
                <label className="form-label">Brand</label>
                <input
                  type="text"
                  className="form-control"
                  name="brand"
                  value={form.brand}
                  onChange={handleChange}
                />
              </div>
              <div className="col-md-3">
                <label className="form-label">Model</label>
                <input
                  type="text"
                  className="form-control"
                  name="model"
                  value={form.model}
                  onChange={handleChange}
                />
              </div>
              <div className="col-md-4">
                <label className="form-label">Supplier</label>
                <select
                  className="form-select"
                  name="supplier_id"
                  value={form.supplier_id}
                  onChange={handleChange}
                >
                  <option value="">Select Supplier</option>
                  {suppliers.map((sup) => (
                    <option key={sup.id} value={sup.id}>{sup.supplier_name}</option>
                  ))}
                </select>
              </div>
              <div className="col-md-2">
                <label className="form-label">Min Stock</label>
                <input
                  type="number"
                  className="form-control"
                  name="min_stock"
                  value={form.min_stock}
                  onChange={handleChange}
                  min="0"
                />
              </div>
              <div className="col-md-2">
                <label className="form-label">Max Stock</label>
                <input
                  type="number"
                  className="form-control"
                  name="max_stock"
                  value={form.max_stock}
                  onChange={handleChange}
                  min="0"
                />
              </div>
              <div className="col-md-2">
                <label className="form-label">Initial Stock</label>
                <input
                  type="number"
                  className="form-control"
                  name="current_stock"
                  value={form.current_stock}
                  onChange={handleChange}
                  min="0"
                />
              </div>
              <div className="col-md-2">
                <label className="form-label">Cost Price</label>
                <input
                  type="number"
                  className="form-control"
                  name="cost_price"
                  value={form.cost_price}
                  onChange={handleChange}
                  step="0.01"
                  min="0"
                />
              </div>
              <div className="col-md-4">
                <label className="form-label">Storage Location</label>
                <select
                  className="form-select"
                  name="location_id"
                  value={form.location_id}
                  onChange={handleChange}
                >
                  <option value="">Select Location</option>
                  {locations.map((loc) => (
                    <option key={loc.id} value={loc.id}>{loc.location_name}</option>
                  ))}
                </select>
              </div>
              <div className="col-md-3">
                <label className="form-label">Shelf / Bin</label>
                <input
                  type="text"
                  className="form-control"
                  name="shelf_location"
                  value={form.shelf_location}
                  onChange={handleChange}
                  placeholder="e.g., A-01-B"
                />
              </div>
              <div className="col-12">
                <label className="form-label">Notes</label>
                <textarea
                  className="form-control"
                  name="notes"
                  value={form.notes}
                  onChange={handleChange}
                  rows="2"
                />
              </div>
            </div>
            <div className="mt-4">
              <button type="submit" className="btn btn-primary" disabled={loading}>
                <FaSave /> {loading ? 'Saving...' : 'Save Part'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default PartForm;