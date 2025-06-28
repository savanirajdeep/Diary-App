import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import NewEntry from './pages/NewEntry';
import EditEntry from './pages/EditEntry';
import ViewEntry from './pages/ViewEntry';
import Settings from './pages/Settings';
import LoadingSpinner from './components/LoadingSpinner';

function App() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="App">
      <Routes>
        {/* Public routes */}
        <Route 
          path="/login" 
          element={isAuthenticated ? <Navigate to="/dashboard" /> : <Login />} 
        />
        <Route 
          path="/register" 
          element={isAuthenticated ? <Navigate to="/dashboard" /> : <Register />} 
        />
        
        {/* Protected routes */}
        <Route 
          path="/" 
          element={isAuthenticated ? <Navigate to="/dashboard" /> : <Navigate to="/login" />} 
        />
        <Route 
          path="/dashboard" 
          element={isAuthenticated ? <Layout><Dashboard /></Layout> : <Navigate to="/login" />} 
        />
        <Route 
          path="/new" 
          element={isAuthenticated ? <Layout><NewEntry /></Layout> : <Navigate to="/login" />} 
        />
        <Route 
          path="/entry/:id" 
          element={isAuthenticated ? <Layout><ViewEntry /></Layout> : <Navigate to="/login" />} 
        />
        <Route 
          path="/entry/:id/edit" 
          element={isAuthenticated ? <Layout><EditEntry /></Layout> : <Navigate to="/login" />} 
        />
        <Route 
          path="/settings" 
          element={isAuthenticated ? <Layout><Settings /></Layout> : <Navigate to="/login" />} 
        />
        
        {/* Catch all route */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </div>
  );
}

export default App; 