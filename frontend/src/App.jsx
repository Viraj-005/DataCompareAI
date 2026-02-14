import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import DashboardLayout from './layouts/DashboardLayout';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Projects from './pages/Projects';
import ProjectDetails from './pages/ProjectDetails';
import Files from './pages/Files';
import Comparisons from './pages/Comparisons';
import ComparisonResult from './pages/ComparisonResult';
import Anomalies from './pages/Anomalies';
import Rules from './pages/Rules';
import Reports from './pages/Reports';
import Settings from './pages/Settings';

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex items-center justify-center h-screen bg-dark-900"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div></div>;
  if (!user) return <Navigate to="/login" />;
  return children;
}

function App() {
  useEffect(() => {
    const theme = localStorage.getItem('theme') || 'dark';
    if (theme === 'light') document.body.classList.add('light-mode');
  }, []);

  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
            <Route index element={<Dashboard />} />
            <Route path="projects" element={<Projects />} />
            <Route path="projects/:id" element={<ProjectDetails />} />
            <Route path="files" element={<Files />} />
            <Route path="comparisons" element={<Comparisons />} />
            <Route path="comparisons/:id" element={<ComparisonResult />} />
            <Route path="anomalies" element={<Anomalies />} />
            <Route path="rules" element={<Rules />} />
            <Route path="reports" element={<Reports />} />
            <Route path="settings" element={<Settings />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
