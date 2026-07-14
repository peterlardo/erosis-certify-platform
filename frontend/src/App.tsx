import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { ToastProvider } from './components/ui/toast'
import { ProtectedRoute } from './components/layout/ProtectedRoute'
import { AppLayout } from './components/layout/AppLayout'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import CoursesPage from './pages/CoursesPage'
import CourseDetailPage from './pages/CourseDetailPage'
import SessionsPage from './pages/SessionsPage'
import LearnersPage from './pages/LearnersPage'
import CertificatesPage from './pages/CertificatesPage'
import CertificateGeneratePage from './pages/CertificateGeneratePage'
import TemplatesPage from './pages/TemplatesPage'
import TemplateEditorPage from './pages/TemplateEditorPage'
import MasksPage from './pages/MasksPage'
import SignatoriesPage from './pages/SignatoriesPage'
import ResultsPage from './pages/ResultsPage'
import UsersPage from './pages/UsersPage'
import SettingsPage from './pages/SettingsPage'
import LearnerPortalPage from './pages/LearnerPortalPage'
import PublicVerifyPage from './pages/PublicVerifyPage'

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/verify" element={<PublicVerifyPage />} />
          <Route path="/learner-portal" element={<LearnerPortalPage />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="courses" element={<CoursesPage />} />
            <Route path="courses/:id" element={<CourseDetailPage />} />
            <Route path="sessions" element={<SessionsPage />} />
            <Route path="learners" element={<LearnersPage />} />
            <Route path="certificates" element={<CertificatesPage />} />
            <Route path="certificates/generate" element={<CertificateGeneratePage />} />
            <Route path="templates" element={<TemplatesPage />} />
            <Route path="templates/:id/edit" element={<TemplateEditorPage />} />
            <Route path="masks" element={<MasksPage />} />
            <Route path="signatories" element={<SignatoriesPage />} />
            <Route path="results" element={<ResultsPage />} />
            <Route path="users" element={<UsersPage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </ToastProvider>
    </AuthProvider>
  )
}
