import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import { authApi, type User } from '../lib/api'

interface AuthContextType {
  user: User | null
  loading: boolean
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  updateProfile: (data: Partial<User>) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      setLoading(false)
      return
    }
    authApi.getMe()
      .then((res) => {
        setUser(res.data)
      })
      .catch(() => {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
      })
      .finally(() => setLoading(false))
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    const res = await authApi.login({ email, password })
    const { user: userData, token } = res.data as { user: User; token: string }
    localStorage.setItem('token', token)
    localStorage.setItem('user', JSON.stringify(userData))
    setUser(userData)
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setUser(null)
  }, [])

  const updateProfile = useCallback(async (data: Partial<User>) => {
    const res = await authApi.updateProfile(data)
    setUser(res.data)
    localStorage.setItem('user', JSON.stringify(res.data))
  }, [])

  const isAuthenticated = !!user

  return (
    <AuthContext.Provider value={{ user, loading, isAuthenticated, login, logout, updateProfile }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
