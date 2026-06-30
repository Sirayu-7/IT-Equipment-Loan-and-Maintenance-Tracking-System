import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please fill in all fields');
      return;
    }
    setLoading(true);
    try {
      await login(email, password);
      toast.success('Login successful');
      navigate('/dashboard');
    } catch (error) {
      toast.error(error.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
    }}>
      <div style={{
        background: '#fff',
        borderRadius: 16,
        padding: 40,
        width: 420,
        maxWidth: '90%',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
      }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            width: 56,
            height: 56,
            background: '#2563eb',
            borderRadius: 14,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px',
            fontSize: 24,
            fontWeight: 'bold',
            color: '#fff',
          }}>IT</div>
          <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>IT Equipment Management</h1>
          <p style={{ color: '#64748b', fontSize: 14 }}>Sign in to your account</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input
              type="email"
              className="form-control"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              type="password"
              className="form-control"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', padding: 12, justifyContent: 'center', fontSize: 16, marginTop: 8 }}
            disabled={loading}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div style={{ marginTop: 24, padding: 16, background: '#f8fafc', borderRadius: 8, fontSize: 12, color: '#64748b' }}>
          <p style={{ fontWeight: 600, marginBottom: 8, color: '#1e293b' }}>Test Accounts:</p>
          <p>Super Admin: superadmin@company.com / admin123</p>
          <p>IT Admin: itadmin@company.com / admin123</p>
          <p>Employee: employee@company.com / admin123</p>
        </div>
      </div>
    </div>
  );
};

export default Login;