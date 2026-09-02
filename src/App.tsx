import { useEffect, useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/layout/Layout';
import Auth from './components/auth/Auth';
import Dashboard from './pages/Dashboard';
import WorkoutEditor from './pages/WorkoutEditor';
import History from './pages/History';
import ProfilePage from './pages/Profile';
import Planner from './pages/Planner';
import Routines from './pages/Routines';
import ResetPassword from './pages/ResetPassword';
import AdminUsers from './pages/AdminUsers';

const App = () => {
  const [loading, setLoading] = useState(true);
  const authenticated = Boolean(localStorage.getItem('fitplanner_token'));

  useEffect(() => { setLoading(false); }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-12 h-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
      </div>
    );
  }

  if (window.location.pathname === '/reset-password') return <ResetPassword />;

  if (!authenticated) {
    return <Auth />;
  }

  return (
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/workout" element={<WorkoutEditor />} />
          <Route path="/history" element={<History />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/planner" element={<Planner />} />
          <Route path="/routines" element={<Routines />} />
          <Route path="/admin/users" element={<AdminUsers />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
  );
};

export default App;
