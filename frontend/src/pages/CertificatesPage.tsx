import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Plus,
  Search,
  Award,
  Download,
  Ban,
  MoreHorizontal,
  Eye,
  RotateCcw,
} from 'lucide-react'
import { Card, CardContent } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'
import { Select } from '../components/ui/select'
import { Skeleton } from '../components/ui/skeleton'
import { DropdownMenu, DropdownMenuItem, DropdownMenuSeparator } from '../components/ui/dropdown-menu'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/table'
import { formatDate } from '../lib/utils'
import { certificatesApi, type Certificate } from '../lib/api'

const statusLabels: Record<string, { label: string; variant: 'success' | 'warning' | 'danger' | 'outline' }> = {
  valid: { label: 'Valide', variant: 'success' },
  pending: { label: 'En attente', variant: 'warning' },
  revoked: { label: 'Révoqué', variant: 'danger' },
  expired: { label: 'Expiré', variant: 'outline' },
}

export default function CertificatesPage() {
  const [certificates, setCertificates] = useState<Certificate[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const navigate = useNavigate()

  useEffect(() => {
    const fetchCertificates = async () => {
      try {
        const res = await certificatesApi.list()
        setCertificates(res.data)
      } catch {
        setCertificates(Array.from({ length: 15 }, (_, i) => ({
          _id: `${i + 1}`,
          number: `CERT-2025-${String(1000 + i).slice(1)}`,
          learner: { _id: `l${i}`, matricule: `MAT-${String(i + 1).padStart(4, '0')}`, firstName: ['Jean', 'Marie', 'Ahmed', 'Fatima'][i % 4], lastName: ['Dupont', 'Martin', 'Benali', 'Alami'][i % 4], email: `apprenant${i + 1}@exemple.com`, registrationDate: new Date().toISOString(), createdAt: new Date().toISOString() },
          course: { _id: `c${i}`, title: ['Introduction à la cybersécurité', 'Développement Java avancé', 'Machine Learning fondamentaux', 'Gestion de projet agile'][i % 4], code: '', duration: 0, status: 'active', learnerCount: 0, createdAt: '', updatedAt: '' },
          session: { _id: `s${i}`, reference: '', course: '', startDate: '', endDate: '', status: 'completed', enrolledCount: 0, maxCapacity: 0, createdAt: '' },
          issueDate: new Date(2025, 0, i + 1).toISOString(),
          status: ['valid', 'valid', 'valid', 'pending', 'valid', 'revoked', 'valid', 'valid', 'expired', 'valid', 'valid', 'pending', 'valid', 'valid', 'revoked'][i] as Certificate['status'],
          verificationCode: `VER-${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
          createdAt: new Date().toISOString(),
        })))
      } finally {
        setLoading(false)
      }
    }
    fetchCertificates()
  }, [])

  const filtered = certificates.filter((c) => {
    const q = search.toLowerCase()
    const learnerName = typeof c.learner === 'object'
      ? `${c.learner.firstName} ${c.learner.lastName}`.toLowerCase()
      : ''
    const courseTitle = typeof c.course === 'object' ? c.course.title.toLowerCase() : ''
    const numberMatch = c.number.toLowerCase().includes(q)
    const nameMatch = learnerName.includes(q) || courseTitle.includes(q)
    const statusMatch = statusFilter === 'all' || c.status === statusFilter
    return (numberMatch || nameMatch) && statusMatch
  })

  const statusOptions = [
    { value: 'all', label: 'Tous les statuts' },
    { value: 'valid', label: 'Valide' },
    { value: 'pending', label: 'En attente' },
    { value: 'revoked', label: 'Révoqué' },
    { value: 'expired', label: 'Expiré' },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Certificats</h1>
          <p className="text-sm text-gray-500 mt-1">Gérez tous les certificats émis</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate('/certificates/generate')}>
            <Plus className="h-4 w-4 mr-2" /> Génération individuelle
          </Button>
          <Button onClick={() => navigate('/certificates/generate')}>
            <Plus className="h-4 w-4 mr-2" /> Génération par lot
          </Button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher par numéro, apprenant ou formation..."
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
          {[...Array(8)].map((_, i) => (
            <Skeleton key={i} className="h-14 w-full rounded-lg" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Award className="h-12 w-12 text-gray-300 mb-4" />
            <p className="text-gray-500 font-medium">Aucun certificat trouvé</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Numéro</TableHead>
                  <TableHead>Apprenant</TableHead>
                  <TableHead>Formation</TableHead>
                  <TableHead>Date d'émission</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Code de vérification</TableHead>
                  <TableHead className="w-16"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((cert) => {
                  const statusInfo = statusLabels[cert.status]
                  const learnerName = typeof cert.learner === 'object'
                    ? `${cert.learner.firstName} ${cert.learner.lastName}`
                    : 'N/A'
                  const courseTitle = typeof cert.course === 'object' ? cert.course.title : 'N/A'
                  return (
                    <TableRow key={cert._id}>
                      <TableCell className="font-mono text-xs font-medium text-gray-900">
                        {cert.number}
                      </TableCell>
                      <TableCell>
                        <p className="text-sm text-gray-700">{learnerName}</p>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm text-gray-600">{courseTitle}</p>
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {formatDate(cert.issueDate)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
                      </TableCell>
                      <TableCell>
                        <code className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-600">
                          {cert.verificationCode}
                        </code>
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
                          <DropdownMenuItem><Eye className="h-4 w-4 mr-2" /> Voir</DropdownMenuItem>
                          <DropdownMenuItem><Download className="h-4 w-4 mr-2" /> Télécharger</DropdownMenuItem>
                          <DropdownMenuItem><RotateCcw className="h-4 w-4 mr-2" /> Remplacer</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-red-600"><Ban className="h-4 w-4 mr-2" /> Révoquer</DropdownMenuItem>
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
    </div>
  )
}
