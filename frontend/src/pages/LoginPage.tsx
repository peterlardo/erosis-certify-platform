import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Award } from 'lucide-react'
import { Button } from '../components/ui/button'
import { useAuth } from '../contexts/AuthContext'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!email || !password) {
      setError('Veuillez remplir tous les champs')
      return
    }
    setLoading(true)
    try {
      await login(email, password)
      navigate('/dashboard')
    } catch {
      setError('Email ou mot de passe incorrect')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex bg-light-gray">
      {/* Left - Branding */}
      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-primary to-primary/80 items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-72 h-72 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-secondary rounded-full blur-3xl" />
        </div>
        <div className="text-center text-white z-10 px-12">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-white/20 backdrop-blur-sm mb-8">
            <Award className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold mb-2">EROSIS CERTIFY</h1>
          <p className="text-lg text-white/80 max-w-md">
            Plateforme de gestion et de délivrance de certificats de formation
          </p>
          <div className="mt-12 grid grid-cols-3 gap-6 max-w-sm mx-auto">
            {['Sécurisé', 'Rapide', 'Fiable'].map((tag) => (
              <div key={tag} className="bg-white/10 rounded-lg px-4 py-3 backdrop-blur-sm">
                <p className="text-sm font-medium">{tag}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right - Login Form */}
      <div className="flex-1 flex items-center justify-center px-6">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="lg:hidden flex flex-col items-center mb-8">
            <div className="h-14 w-14 rounded-2xl bg-primary flex items-center justify-center mb-3">
              <Award className="h-7 w-7 text-white" />
            </div>
            <h1 className="text-xl font-bold text-primary">EROSIS CERTIFY</h1>
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mb-1">Connexion</h2>
          <p className="text-sm text-gray-500 mb-8">
            Connectez-vous à votre espace de gestion
          </p>

          {error && (
            <div className="mb-6 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">
                Adresse email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="vous@exemple.com"
                className="w-full h-11 px-4 rounded-lg border border-gray-300 bg-white text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1.5">
                Mot de passe
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full h-11 px-4 pr-11 rounded-lg border border-gray-300 bg-white text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2">
                <input type="checkbox" className="rounded border-gray-300 text-primary focus:ring-primary" />
                <span className="text-sm text-gray-600">Se souvenir de moi</span>
              </label>
              <button type="button" className="text-sm text-primary hover:underline cursor-pointer">
                Mot de passe oublié ?
              </button>
            </div>

            <Button type="submit" className="w-full h-11" disabled={loading}>
              {loading ? 'Connexion en cours...' : 'Se connecter'}
            </Button>
          </form>

          <p className="text-center text-sm text-gray-400 mt-8">
            &copy; {new Date().getFullYear()} EROSIS CERTIFY. Tous droits réservés.
          </p>
        </div>
      </div>
    </div>
  )
}
