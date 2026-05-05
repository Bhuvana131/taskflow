// frontend/src/App.js
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import AuthPage      from './pages/AuthPage';
import DashboardPage from './pages/DashboardPage';
import ProjectsPage  from './pages/ProjectsPage';
import TasksPage     from './pages/TasksPage';
import TeamPage      from './pages/TeamPage';

const App = () => (
  <AuthProvider>
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/login" element={<AuthPage />} />

        {/* Protected */}
        <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
        <Route path="/projects"  element={<ProtectedRoute><ProjectsPage  /></ProtectedRoute>} />
        <Route path="/tasks"     element={<ProtectedRoute><TasksPage     /></ProtectedRoute>} />
        <Route path="/team"      element={<ProtectedRoute><TeamPage      /></ProtectedRoute>} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  </AuthProvider>
);

export default App;
