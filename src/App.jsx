import { Routes, Route, Navigate } from 'react-router-dom'
import Landing from './pages/Landing'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Dashboard from './pages/Dashboard'
import ReportIssue from './pages/ReportIssue'
import Analysis from './pages/Analysis'
import IssueDetail from './pages/IssueDetail'
import CommunityVerification from './pages/CommunityVerification'
import MapPage from './pages/MapPage'
import Analytics from './pages/Analytics'
import Profile from './pages/Profile'
import ProtectedRoute from './components/ProtectedRoute'
import PublicRoute from './components/PublicRoute'

export default function App() {
  return (
    <Routes>
      {/* Public — redirect logged-in users to dashboard */}
      <Route path="/" element={<Landing />} />
      <Route path="/login"  element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/signup" element={<PublicRoute><Signup /></PublicRoute>} />

      {/* Protected */}
      <Route path="/dashboard"              element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/report-issue"           element={<ProtectedRoute><ReportIssue /></ProtectedRoute>} />
      <Route path="/analysis/:id"           element={<ProtectedRoute><Analysis /></ProtectedRoute>} />
      <Route path="/issue/:id"              element={<ProtectedRoute><IssueDetail /></ProtectedRoute>} />
      <Route path="/community-verification" element={<ProtectedRoute><CommunityVerification /></ProtectedRoute>} />
      <Route path="/map"                    element={<ProtectedRoute><MapPage /></ProtectedRoute>} />
      <Route path="/analytics"              element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
      <Route path="/profile"                element={<ProtectedRoute><Profile /></ProtectedRoute>} />

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}