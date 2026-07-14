import { Navigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'

interface ProtectedRouteProps {
  children: React.ReactNode
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-light-gray">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-500 text-sm">Chargement...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}
