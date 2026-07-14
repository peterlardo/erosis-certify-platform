import { useState } from 'react'
import {
  Award,
  Download,
  FileText,
  Calendar,
  Search,
  ExternalLink,
  Share2,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'
import { Avatar } from '../components/ui/avatar'
import { formatDate } from '../lib/utils'

interface LearnerCertificate {
  _id: string
  number: string
  courseTitle: string
  issueDate: string
  status: 'valid' | 'pending'
  pdfUrl?: string
}

export default function LearnerPortalPage() {
  const [search, setSearch] = useState('')
  const learnerName = 'Jean Dupont'
  const learnerEmail = 'jean.dupont@exemple.com'
  const learnerMatricule = 'MAT-0001'

  const certificates: LearnerCertificate[] = [
    { _id: '1', number: 'CERT-2025-0001', courseTitle: 'Introduction à la cybersécurité', issueDate: '2025-03-15', status: 'valid' },
    { _id: '2', number: 'CERT-2025-0007', courseTitle: 'Développement Java avancé', issueDate: '2025-05-05', status: 'pending' },
    { _id: '3', number: 'CERT-2024-0042', courseTitle: 'Machine Learning fondamentaux', issueDate: '2024-11-20', status: 'valid' },
  ]

  const filtered = certificates.filter((c) =>
    c.courseTitle.toLowerCase().includes(search.toLowerCase()) ||
    c.number.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Profile Header */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
            <Avatar fallback={learnerName} size="lg" />
            <div className="flex-1 text-center sm:text-left">
              <h1 className="text-xl font-bold text-gray-900">{learnerName}</h1>
              <p className="text-sm text-gray-500">{learnerEmail}</p>
              <p className="text-xs text-gray-400 font-mono mt-1">{learnerMatricule}</p>
            </div>
            <div className="flex gap-2">
              <Badge variant="success" className="text-xs">{certificates.length} certificats</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-5 flex items-center gap-3">
            <div className="p-3 rounded-xl bg-primary/10 text-primary">
              <Award className="h-6 w-6" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{certificates.filter((c) => c.status === 'valid').length}</p>
              <p className="text-xs text-gray-500">Certificats valides</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5 flex items-center gap-3">
            <div className="p-3 rounded-xl bg-yellow-50 text-yellow-600">
              <FileText className="h-6 w-6" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{certificates.filter((c) => c.status === 'pending').length}</p>
              <p className="text-xs text-gray-500">En attente</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5 flex items-center gap-3">
            <div className="p-3 rounded-xl bg-green-50 text-green-600">
              <Download className="h-6 w-6" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{certificates.length}</p>
              <p className="text-xs text-gray-500">Téléchargements</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Certificates */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Mes certificats</CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full h-9 pl-9 pr-3 rounded-lg border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filtered.length === 0 ? (
            <div className="text-center py-8">
              <Award className="h-10 w-10 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-400">Aucun certificat trouvé</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map((cert) => (
                <div
                  key={cert._id}
                  className="flex items-center justify-between p-4 rounded-lg border border-gray-100 hover:border-primary/20 hover:bg-primary/[0.02] transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-primary/5">
                      <Award className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-900">{cert.courseTitle}</h3>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-xs text-gray-400 font-mono">{cert.number}</span>
                        <span className="text-xs text-gray-300">•</span>
                        <span className="text-xs text-gray-400 flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(cert.issueDate)}
                        </span>
                        <Badge variant={cert.status === 'valid' ? 'success' : 'warning'}>
                          {cert.status === 'valid' ? 'Valide' : 'En attente'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" title="Télécharger">
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" title="Partager sur LinkedIn">
                      <Share2 className="h-4 w-4 text-blue-600" />
                    </Button>
                    <Button variant="ghost" size="sm" title="Voir en ligne">
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
