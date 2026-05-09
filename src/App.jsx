// src/App.jsx
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'
import Layout from './components/Layout'
import HomePage from './pages/HomePage'
import JobsPage from './pages/JobsPage'
import JobDetailPage from './pages/JobDetailPage'
import PostJobPage from './pages/PostJobPage'
import ProfilePage from './pages/ProfilePage'
import CandidatesPage from './pages/CandidatesPage'
import AdminPage from './pages/AdminPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'

function PrivateRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="loading-screen"><div className="spinner" /></div>
  return user ? children : <Navigate to="/login" replace />
}

function AdminRoute({ children }) {
  const { user, isAdmin, loading } = useAuth()
  if (loading) return <div className="loading-screen"><div className="spinner" /></div>
  if (!user) return <Navigate to="/login" replace />
  if (!isAdmin) return <Navigate to="/" replace />
  return children
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="login"    element={<LoginPage />} />
        <Route path="register" element={<RegisterPage />} />

        <Route path="jobs"     element={<PrivateRoute><JobsPage /></PrivateRoute>} />
        <Route path="jobs/:id" element={<PrivateRoute><JobDetailPage /></PrivateRoute>} />
        <Route path="post-job" element={<PrivateRoute><PostJobPage /></PrivateRoute>} />
        <Route path="profile"  element={<PrivateRoute><ProfilePage /></PrivateRoute>} />
        <Route path="candidates" element={<PrivateRoute><CandidatesPage /></PrivateRoute>} />
        <Route path="admin"    element={<AdminRoute><AdminPage /></AdminRoute>} />
      </Route>
    </Routes>
  )
}
