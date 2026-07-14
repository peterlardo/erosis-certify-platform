import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Award,
  FileCheck,
  Clock,
  Ban,
  UserPlus,
  GraduationCap,
  CalendarDays,
  ShieldCheck,
  ArrowUpRight,
  Users,
  BookOpen,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { Skeleton } from '../components/ui/skeleton'
import { formatDate, formatNumber } from '../lib/utils'
import { useAuth } from '../contexts/AuthContext'
import { dashboardApi, type DashboardStats, type RecentActivity } from '../lib/api'

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [activities, setActivities] = useState<RecentActivity[]>([])
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, activityRes] = await Promise.all([
          dashboardApi.getStats(),
          dashboardApi.getRecentActivity(),
        ])
        setStats(statsRes.data)
        setActivities(activityRes.data)
      } catch {
        // Use mock data if API not available
        setStats({
          totalCertificates: 1247,
          validCertificates: 1023,
          pendingCertificates: 156,
          revokedCertificates: 68,
          totalCourses: 24,
          totalLearners: 892,
          totalSessions: 48,
          monthlyEvolution: [
            { month: 'Jan', count: 45 },
            { month: 'Fév', count: 62 },
            { month: 'Mar', count: 78 },
            { month: 'Avr', count: 55 },
            { month: 'Mai', count: 91 },
            { month: 'Juin', count: 103 },
            { month: 'Juil', count: 87 },
            { month: 'Août', count: 42 },
            { month: 'Sep', count: 115 },
            { month: 'Oct', count: 98 },
            { month: 'Nov', count: 76 },
            { month: 'Déc', count: 54 },
          ],
        })
        setActivities([
          { _id: '1', action: 'generate', description: 'Certificat généré pour Jean Dupont', createdAt: new Date().toISOString() },
          { _id: '2', action: 'enroll', description: '15 apprenants inscrits à la session JAVA-2025-01', createdAt: new Date().toISOString() },
          { _id: '3', action: 'create', description: 'Nouvelle formation créée : "Cybersécurité avancée"', createdAt: new Date().toISOString() },
          { _id: '4', action: 'verify', description: 'Certificat #CERT-2025-0892 vérifié', createdAt: new Date().toISOString() },
        ])
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const statCards = [
    {
      title: 'Total certificats',
      value: stats?.totalCertificates ?? 0,
      icon: Award,
      color: 'bg-primary/10 text-primary',
      bgIcon: 'text-primary/20',
    },
    {
      title: 'Valides',
      value: stats?.validCertificates ?? 0,
      icon: FileCheck,
      color: 'bg-green-50 text-green-600',
      bgIcon: 'text-green-200',
    },
    {
      title: 'En attente',
      value: stats?.pendingCertificates ?? 0,
      icon: Clock,
      color: 'bg-yellow-50 text-yellow-600',
      bgIcon: 'text-yellow-200',
    },
    {
      title: 'Révoqués',
      value: stats?.revokedCertificates ?? 0,
      icon: Ban,
      color: 'bg-red-50 text-red-600',
      bgIcon: 'text-red-200',
    },
  ]

  const quickActions = [
    { label: 'Créer une formation', icon: GraduationCap, color: 'bg-blue-50 text-blue-600', onClick: () => navigate('/courses') },
    { label: 'Créer une session', icon: CalendarDays, color: 'bg-purple-50 text-purple-600', onClick: () => navigate('/sessions') },
    { label: 'Ajouter un apprenant', icon: UserPlus, color: 'bg-green-50 text-green-600', onClick: () => navigate('/learners') },
    { label: 'Générer certificats', icon: Award, color: 'bg-secondary/10 text-secondary', onClick: () => navigate('/certificates/generate') },
    { label: 'Vérifier certificat', icon: ShieldCheck, color: 'bg-primary/10 text-primary', onClick: () => navigate('/verify') },
  ]

  const maxCount = stats?.monthlyEvolution ? Math.max(...stats.monthlyEvolution.map((m) => m.count)) : 1

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Bonjour, {user?.firstName || 'Utilisateur'}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Voici le résumé de votre plateforme de certificats
          </p>
        </div>
        <Badge variant="success" className="text-xs">
          {stats?.totalCertificates ? `${formatNumber(stats.totalCertificates)} certificats émis` : 'Système opérationnel'}
        </Badge>
      </div>

      {/* Stats Cards */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((card) => {
            const Icon = card.icon
            return (
              <Card key={card.title}>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-gray-500 font-medium">{card.title}</p>
                      <p className="text-3xl font-bold text-gray-900 mt-1">
                        {formatNumber(card.value)}
                      </p>
                    </div>
                    <div className={`p-3 rounded-xl ${card.color}`}>
                      <Icon className="h-6 w-6" />
                    </div>
                  </div>
                  <div className="mt-3 flex items-center text-xs text-green-600">
                    <ArrowUpRight className="h-3 w-3 mr-1" />
                    <span>+12% ce mois</span>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Charts + Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Evolution */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Évolution mensuelle</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-48 w-full" />
            ) : (
              <div className="flex items-end gap-2 h-48">
                {stats?.monthlyEvolution.map((m) => (
                  <div key={m.month} className="flex-1 flex flex-col items-center gap-1">
                    <span className="text-xs text-gray-400 font-medium">{m.count}</span>
                    <div
                      className="w-full rounded-md bg-gradient-to-t from-primary to-primary/60 transition-all duration-500 hover:from-primary/80"
                      style={{ height: `${(m.count / maxCount) * 100}%` }}
                    />
                    <span className="text-xs text-gray-500">{m.month}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Activité récente</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {[...Array(4)].map((_, i) => (
                  <Skeleton key={i} className="h-14 w-full" />
                ))}
              </div>
            ) : activities.length === 0 ? (
              <div className="text-center py-8">
                <Clock className="h-10 w-10 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-400">Aucune activité récente</p>
              </div>
            ) : (
              <div className="space-y-3">
                {activities.map((activity) => (
                  <div
                    key={activity._id}
                    className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <Award className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-700">{activity.description}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {formatDate(activity.createdAt)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Stats Row 2 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-5 flex items-center gap-4">
            <BookOpen className="h-10 w-10 text-primary/40" />
            <div>
              <p className="text-sm text-gray-500">Formations</p>
              <p className="text-2xl font-bold text-gray-900">{formatNumber(stats?.totalCourses ?? 0)}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5 flex items-center gap-4">
            <Users className="h-10 w-10 text-secondary/40" />
            <div>
              <p className="text-sm text-gray-500">Apprenants</p>
              <p className="text-2xl font-bold text-gray-900">{formatNumber(stats?.totalLearners ?? 0)}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5 flex items-center gap-4">
            <CalendarDays className="h-10 w-10 text-green-500/40" />
            <div>
              <p className="text-sm text-gray-500">Sessions</p>
              <p className="text-2xl font-bold text-gray-900">{formatNumber(stats?.totalSessions ?? 0)}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-base font-semibold text-gray-900 mb-3">Actions rapides</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {quickActions.map((action) => {
            const Icon = action.icon
            return (
              <button
                key={action.label}
                onClick={action.onClick}
                className="flex flex-col items-center gap-2 p-4 rounded-xl border border-gray-200 bg-white hover:border-primary/30 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer"
              >
                <div className={`p-3 rounded-xl ${action.color}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <span className="text-xs font-medium text-gray-600 text-center leading-tight">
                  {action.label}
                </span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
