import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Edit,
  BookOpen,
  Clock,
  Users,
  CalendarDays,
  Award,
  BarChart3,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'
import { Skeleton } from '../components/ui/skeleton'
import { Separator } from '../components/ui/separator'
import { formatDate } from '../lib/utils'
import { coursesApi, type Course } from '../lib/api'

const statusLabels: Record<string, { label: string; variant: 'success' | 'warning' | 'outline' }> = {
  active: { label: 'Actif', variant: 'success' },
  draft: { label: 'Brouillon', variant: 'warning' },
  archived: { label: 'Archivé', variant: 'outline' },
}

export default function CourseDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [course, setCourse] = useState<Course | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const navigate = useNavigate()

  useEffect(() => {
    const fetchCourse = async () => {
      try {
        const res = await coursesApi.get(id!)
        setCourse(res.data)
      } catch {
        setCourse({
          _id: id || '1',
          title: 'Introduction à la cybersécurité',
          code: 'CYB-101',

          duration: 40,
          description: 'Cette formation couvre les fondamentaux de la cybersécurité, y compris la gestion des risques, la cryptographie, la sécurité réseau et les bonnes pratiques.',
          objectives: 'Comprendre les concepts clés de la cybersécurité\nIdentifier les menaces et vulnérabilités\nMettre en place des mesures de protection',
          status: 'active',
          learnerCount: 45,
          createdAt: '2025-01-15',
          updatedAt: '2025-03-20',
        })
      } finally {
        setLoading(false)
      }
    }
    fetchCourse()
  }, [id])

  const tabs = [
    { value: 'overview', label: 'Aperçu', icon: BookOpen },
    { value: 'sessions', label: 'Sessions', icon: CalendarDays },
    { value: 'learners', label: 'Apprenants', icon: Users },
    { value: 'certificates', label: 'Certificats', icon: Award },
  ]

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-48 w-full rounded-xl" />
      </div>
    )
  }

  if (!course) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-500">Formation introuvable</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate('/courses')}>
          Retour aux formations
        </Button>
      </div>
    )
  }

  const statusInfo = statusLabels[course.status]

  return (
    <div className="space-y-6">
      {/* Back button */}
      <button
        onClick={() => navigate('/courses')}
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors cursor-pointer"
      >
        <ArrowLeft className="h-4 w-4" />
        Retour aux formations
      </button>

      {/* Header */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
                <span className="text-xs text-gray-400 font-mono">{course.code}</span>
              </div>
              <h1 className="text-2xl font-bold text-gray-900">{course.title}</h1>
              <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">

                <span className="flex items-center gap-1"><Clock className="h-4 w-4" />{course.duration} heures</span>
                <span className="flex items-center gap-1"><Users className="h-4 w-4" />{course.learnerCount} apprenants</span>
              </div>
            </div>
            <Button variant="outline">
              <Edit className="h-4 w-4 mr-2" /> Modifier
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-gray-100 rounded-lg w-fit">
        {tabs.map((tab) => {
          const Icon = tab.icon
          return (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer ${
                activeTab === tab.value
                  ? 'bg-white text-primary shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Description</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 leading-relaxed">{course.description || 'Aucune description disponible.'}</p>
              </CardContent>
            </Card>
            {course.objectives && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Objectifs pédagogiques</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {course.objectives.split('\n').map((obj, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm text-gray-600">
                        <span className="h-5 w-5 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center mt-0.5 shrink-0">{idx + 1}</span>
                        {obj}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
          </div>
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Informations</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Créée le</span>
                  <span className="text-gray-700">{formatDate(course.createdAt)}</span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-gray-500">Dernière modification</span>
                  <span className="text-gray-700">{formatDate(course.updatedAt)}</span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-gray-500">Code</span>
                  <span className="text-gray-700 font-mono">{course.code}</span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-gray-500">Statut</span>
                  <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {activeTab !== 'overview' && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <BarChart3 className="h-12 w-12 text-gray-300 mb-4" />
            <p className="text-gray-500 font-medium">Module en cours de développement</p>
            <p className="text-sm text-gray-400 mt-1">Cette section sera disponible prochainement</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
