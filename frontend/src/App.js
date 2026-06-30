import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { AuthProvider, useAuth } from './context/AuthContext';
import MainLayout from './components/layouts/MainLayout';
import ErrorBoundary from './components/common/ErrorBoundary';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import AssetList from './pages/assets/AssetList';
import AssetDetail from './pages/assets/AssetDetail';
import AssetForm from './pages/assets/AssetForm';
import BorrowList from './pages/borrows/BorrowList';
import BorrowDetail from './pages/borrows/BorrowDetail';
import BorrowForm from './pages/borrows/BorrowForm';
import RepairList from './pages/repairs/RepairList';
import RepairDetail from './pages/repairs/RepairDetail';
import RepairForm from './pages/repairs/RepairForm';
import UserList from './pages/users/UserList';
import UserForm from './pages/users/UserForm';
import RoleList from './pages/roles/RoleList';
import NotificationList from './pages/notifications/NotificationList';
import ReportList from './pages/reports/ReportList';
import Profile from './pages/Profile';
import PartList from './pages/parts/PartList';
import PartDetail from './pages/parts/PartDetail';
import PartForm from './pages/parts/PartForm';
import Settings from './pages/settings/Settings';

const ProtectedRoute = ({ children, roles }) => {
  const { isAuthenticated, user, loading } = useAuth();
  
  if (loading) {
    return <div className="loading-page"><div className="spinner"></div><p>Loading...</p></div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (roles && !roles.some(role => user?.roles?.includes(role))) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return <div className="loading-page"><div className="spinner"></div><p>Loading...</p></div>;
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <ErrorBoundary>
        <ToastContainer position="top-right" autoClose={3000} hideProgressBar />
        <Routes>
          <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
          
          <Route element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
            <Route path="/dashboard" element={<Dashboard />} />
            
            <Route path="/assets" element={<AssetList />} />
            <Route path="/assets/new" element={<AssetForm />} />
            <Route path="/assets/:id" element={<AssetDetail />} />
            <Route path="/assets/:id/edit" element={<AssetForm />} />
            
            <Route path="/borrows" element={<BorrowList />} />
            <Route path="/borrows/new" element={<BorrowForm />} />
            <Route path="/borrows/:id" element={<BorrowDetail />} />
            
            <Route path="/repairs" element={<RepairList />} />
            <Route path="/repairs/new" element={<RepairForm />} />
            <Route path="/repairs/:id" element={<RepairDetail />} />
            
            <Route path="/users" element={<ProtectedRoute roles={['super_admin','it_admin']}><UserList /></ProtectedRoute>} />
            <Route path="/users/new" element={<ProtectedRoute roles={['super_admin','it_admin']}><UserForm /></ProtectedRoute>} />
            <Route path="/users/:id/edit" element={<ProtectedRoute roles={['super_admin','it_admin']}><UserForm /></ProtectedRoute>} />
            
            <Route path="/roles" element={<ProtectedRoute roles={['super_admin']}><RoleList /></ProtectedRoute>} />
            <Route path="/notifications" element={<NotificationList />} />
            <Route path="/reports" element={<ProtectedRoute roles={['super_admin','it_admin']}><ReportList /></ProtectedRoute>} />
            <Route path="/parts" element={<PartList />} />
            <Route path="/parts/new" element={<PartForm />} />
            <Route path="/parts/:id" element={<PartDetail />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/profile" element={<Profile />} />
          </Route>
          
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
        </ErrorBoundary>
      </Router>
    </AuthProvider>
  );
}

export default App;