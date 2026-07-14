import type React from 'react'
import { useState, useEffect } from 'react'
import { Plus, Search, CalendarDays, Users, UserCog, MoreHorizontal, Edit, Trash2 } from 'lucide-react'
import { Card, CardContent } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Select } from '../components/ui/select'
import { Skeleton } from '../components/ui/skeleton'
import { Dialog } from '../components/ui/dialog'
import { DropdownMenu, DropdownMenuItem, DropdownMenuSeparator } from '../components/ui/dropdown-menu'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/table'
import { formatDate } from '../lib/utils'
import { sessionsApi, type Session } from '../lib/api'

const statusLabels: Record<string, { label: string; variant: 'default' | 'success' | 'warning' | 'danger' | 'outline' }> = {
  planned: { label: 'Planifiée', variant: 'outline' },
  in_progress: { label: 'En cours', variant: 'warning' },
  completed: { label: 'Terminée', variant: 'success' },
  cancelled: { label: 'Annulée', variant: 'danger' },
}

export default function SessionsPage() {
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [showCreateDialog, setShowCreateDialog] = useState(false)

  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const res = await sessionsApi.list()
        setSessions(res.data)
      } catch {
        setSessions([
          { _id: '1', reference: 'CYB-2025-01', course: { _id: '1', title: 'Introduction à la cybersécurité', code: 'CYB-101', duration: 40, status: 'active', learnerCount: 45, createdAt: '', updatedAt: '' }, startDate: '2025-03-01', endDate: '2025-03-15', trainer: 'Dr. Kamal Benslimane', status: 'in_progress', enrolledCount: 25, maxCapacity: 30, createdAt: '2025-02-01' },
          { _id: '2', reference: 'JAVA-2025-01', course: { _id: '2', title: 'Développement Java avancé', code: 'JAVA-201', duration: 60, status: 'active', learnerCount: 32, createdAt: '', updatedAt: '' }, startDate: '2025-04-10', endDate: '2025-05-05', trainer: 'Mme. Sarah El Amrani', status: 'planned', enrolledCount: 18, maxCapacity: 25, createdAt: '2025-03-15' },
          { _id: '3', reference: 'ML-2024-02', course: { _id: '4', title: 'Machine Learning fondamentaux', code: 'ML-101', duration: 50, status: 'active', learnerCount: 28, createdAt: '', updatedAt: '' }, startDate: '2024-11-01', endDate: '2024-11-20', trainer: 'Pr. Hassan Benali', status: 'completed', enrolledCount: 22, maxCapacity: 20, createdAt: '2024-10-01' },
        ])
      } finally {
        setLoading(false)
      }
    }
    fetchSessions()
  }, [])

  const filtered = sessions.filter((s) => {
    const refMatch = s.reference.toLowerCase().includes(search.toLowerCase())
    const courseMatch = typeof s.course === 'object' ? s.course.title.toLowerCase().includes(search.toLowerCase()) : false
    const statusMatch = statusFilter === 'all' || s.status === statusFilter
    return (refMatch || courseMatch) && statusMatch
  })

  const statusOptions = [
    { value: 'all', label: 'Tous les statuts' },
    { value: 'planned', label: 'Planifiée' },
    { value: 'in_progress', label: 'En cours' },
    { value: 'completed', label: 'Terminée' },
    { value: 'cancelled', label: 'Annulée' },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Sessions</h1>
          <p className="text-sm text-gray-500 mt-1">Gérez les sessions de formation</p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="h-4 w-4 mr-2" /> Nouvelle session
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher par référence ou formation..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-10 pl-10 pr-4 rounded-lg border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
          />
        </div>
        <Select
          options={statusOptions}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="w-full sm:w-48"
        />
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-lg" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <CalendarDays className="h-12 w-12 text-gray-300 mb-4" />
            <p className="text-gray-500 font-medium">Aucune session trouvée</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Référence</TableHead>
                  <TableHead>Formation</TableHead>
                  <TableHead>Dates</TableHead>
                  <TableHead>Formateur</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Inscrits</TableHead>
                  <TableHead className="w-16"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((session) => {
                  const statusInfo = statusLabels[session.status]
                  const courseTitle = typeof session.course === 'object' ? session.course.title : 'N/A'
                  return (
                    <TableRow key={session._id}>
                      <TableCell className="font-medium text-gray-900 font-mono text-xs">
                        {session.reference}
                      </TableCell>
                      <TableCell>
                        <p className="text-sm text-gray-700">{courseTitle}</p>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm text-gray-600">
                          {formatDate(session.startDate)} - {formatDate(session.endDate)}
                        </p>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <UserCog className="h-4 w-4 text-gray-400" />
                          <span className="text-sm text-gray-600">{session.trainer || 'Non assigné'}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-gray-400" />
                          <span className="text-sm text-gray-600">
                            {session.enrolledCount}/{session.maxCapacity}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu
                          trigger={
                            <button className="p-1 rounded text-gray-300 hover:text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer">
                              <MoreHorizontal className="h-5 w-5" />
                            </button>
                          }
                          align="end"
                        >
                          <DropdownMenuItem><Edit className="h-4 w-4 mr-2" /> Modifier</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-red-600"><Trash2 className="h-4 w-4 mr-2" /> Supprimer</DropdownMenuItem>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}

      <CreateSessionDialog open={showCreateDialog} onClose={() => setShowCreateDialog(false)} />
    </div>
  )
}

function CreateSessionDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [reference, setReference] = useState('')
  const [courseId, setCourseId] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [maxCapacity, setMaxCapacity] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onClose()
  }

  return (
    <Dialog open={open} onClose={onClose} title="Nouvelle session">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input label="Référence" value={reference} onChange={(e) => setReference(e.target.value)} placeholder="ex: CYB-2025-02" required />
        <Select
          label="Formation"
          options={[
            { value: '1', label: 'Introduction à la cybersécurité' },
            { value: '2', label: 'Développement Java avancé' },
          ]}
          value={courseId}
          onChange={(e) => setCourseId(e.target.value)}
          placeholder="Sélectionner une formation"
        />
        <div className="grid grid-cols-2 gap-4">
          <Input label="Date de début" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required />
          <Input label="Date de fin" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} required />
        </div>
        <Input label="Capacité maximale" type="number" value={maxCapacity} onChange={(e) => setMaxCapacity(e.target.value)} placeholder="30" required />
        <div className="flex justify-end gap-3 pt-2">
          <Button variant="outline" type="button" onClick={onClose}>Annuler</Button>
          <Button type="submit">Créer la session</Button>
        </div>
      </form>
    </Dialog>
  )
}
