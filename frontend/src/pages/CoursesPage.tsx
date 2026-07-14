import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Plus,
  Search,
  BookOpen,
  Clock,
  Users,
  MoreHorizontal,
  Edit,
  Trash2,
  Copy,
} from 'lucide-react'
import { Card, CardContent } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Skeleton } from '../components/ui/skeleton'
import { Dialog } from '../components/ui/dialog'
import { DropdownMenu, DropdownMenuItem, DropdownMenuSeparator } from '../components/ui/dropdown-menu'
import { formatDate } from '../lib/utils'
import { coursesApi, type Course } from '../lib/api'

const statusLabels: Record<string, { label: string; variant: 'default' | 'success' | 'warning' | 'outline' }> = {
  active: { label: 'Actif', variant: 'success' },
  draft: { label: 'Brouillon', variant: 'warning' },
  archived: { label: 'Archivé', variant: 'outline' },
}

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const res = await coursesApi.list()
        setCourses(res.data)
      } catch {
        setCourses([
          { _id: '1', title: 'Introduction à la cybersécurité', code: 'CYB-101', duration: 40, status: 'active', learnerCount: 45, createdAt: '2025-01-15', updatedAt: '2025-01-15' },
          { _id: '2', title: 'Développement Java avancé', code: 'JAVA-201', duration: 60, status: 'active', learnerCount: 32, createdAt: '2025-02-01', updatedAt: '2025-02-01' },
          { _id: '3', title: 'Gestion de projet agile', code: 'PRJ-301', duration: 35, status: 'draft', learnerCount: 0, createdAt: '2025-03-10', updatedAt: '2025-03-10' },
          { _id: '4', title: 'Machine Learning fondamentaux', code: 'ML-101', duration: 50, status: 'active', learnerCount: 28, createdAt: '2025-01-20', updatedAt: '2025-01-20' },
          { _id: '5', title: 'Anglais technique', code: 'ENG-101', duration: 30, status: 'archived', learnerCount: 120, createdAt: '2024-06-01', updatedAt: '2024-06-01' },
        ])
      } finally {
        setLoading(false)
      }
    }
    fetchCourses()
  }, [])

  const filtered = courses.filter((c) => {
    const matchesSearch = c.title.toLowerCase().includes(search.toLowerCase()) ||
      c.code.toLowerCase().includes(search.toLowerCase())
    const matchesStatus = statusFilter === 'all' || c.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const tabs = [
    { value: 'all', label: 'Toutes' },
    { value: 'active', label: 'Actives' },
    { value: 'draft', label: 'Brouillons' },
    { value: 'archived', label: 'Archivées' },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Formations</h1>
          <p className="text-sm text-gray-500 mt-1">Gérez votre catalogue de formations</p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nouvelle formation
        </Button>
      </div>

      {/* Search + Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher par titre ou code..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-10 pl-10 pr-4 rounded-lg border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-gray-100 rounded-lg w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setStatusFilter(tab.value)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer ${
              statusFilter === tab.value
                ? 'bg-white text-primary shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Course Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-48 rounded-xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <BookOpen className="h-12 w-12 text-gray-300 mb-4" />
            <p className="text-gray-500 font-medium">Aucune formation trouvée</p>
            <p className="text-sm text-gray-400 mt-1">
              {search ? 'Essayez d\'autres termes de recherche' : 'Créez votre première formation'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((course) => {
            const statusInfo = statusLabels[course.status]
            return (
              <Card
                key={course._id}
                className="hover:border-primary/30 hover:shadow-md transition-all duration-200 cursor-pointer group"
                onClick={() => navigate(`/courses/${course._id}`)}
              >
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
                    <DropdownMenu
                      trigger={
                        <button
                          onClick={(e) => e.stopPropagation()}
                          className="p-1 rounded text-gray-300 hover:text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
                        >
                          <MoreHorizontal className="h-5 w-5" />
                        </button>
                      }
                      align="end"
                    >
                      <DropdownMenuItem onClick={() => navigate(`/courses/${course._id}`)}>
                        <Edit className="h-4 w-4 mr-2" /> Modifier
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Copy className="h-4 w-4 mr-2" /> Dupliquer
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-red-600">
                        <Trash2 className="h-4 w-4 mr-2" /> Supprimer
                      </DropdownMenuItem>
                    </DropdownMenu>
                  </div>

                  <h3 className="font-semibold text-gray-900 mb-1 group-hover:text-primary transition-colors">
                    {course.title}
                  </h3>
                  <p className="text-xs text-gray-400 font-mono mb-3">{course.code}</p>

                  <div className="flex items-center gap-4 text-xs text-gray-500">

                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      {course.duration}h
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="h-3.5 w-3.5" />
                      {course.learnerCount}
                    </span>
                  </div>

                  <p className="text-xs text-gray-400 mt-3">
                    Créée le {formatDate(course.createdAt)}
                  </p>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Create Dialog */}
      <CreateCourseDialog open={showCreateDialog} onClose={() => setShowCreateDialog(false)} />
    </div>
  )
}

function CreateCourseDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [title, setTitle] = useState('')
  const [code, setCode] = useState('')
  const [duration, setDuration] = useState('')
  const [description, setDescription] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onClose()
  }

  return (
    <Dialog open={open} onClose={onClose} title="Nouvelle formation">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input label="Titre de la formation" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="ex: Introduction à la cybersécurité" required />
        <div className="grid grid-cols-2 gap-4">
          <Input label="Code" value={code} onChange={(e) => setCode(e.target.value)} placeholder="ex: CYB-101" required />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Input label="Durée (heures)" type="number" value={duration} onChange={(e) => setDuration(e.target.value)} placeholder="40" required />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            placeholder="Décrivez les objectifs de la formation..."
          />
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <Button variant="outline" type="button" onClick={onClose}>Annuler</Button>
          <Button type="submit">Créer la formation</Button>
        </div>
      </form>
    </Dialog>
  )
}
