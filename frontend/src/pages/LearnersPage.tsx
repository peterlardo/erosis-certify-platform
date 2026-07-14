import type React from 'react'
import { useState, useEffect } from 'react'
import { Plus, Search, Upload, Download, MoreHorizontal, Edit, Trash2, Mail, Phone } from 'lucide-react'
import { Card, CardContent } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Skeleton } from '../components/ui/skeleton'
import { Dialog } from '../components/ui/dialog'
import { DropdownMenu, DropdownMenuItem, DropdownMenuSeparator } from '../components/ui/dropdown-menu'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/table'
import { formatDate } from '../lib/utils'
import { learnersApi, type Learner } from '../lib/api'

export default function LearnersPage() {
  const [learners, setLearners] = useState<Learner[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const perPage = 10

  useEffect(() => {
    const fetchLearners = async () => {
      try {
        const res = await learnersApi.list()
        setLearners(res.data)
      } catch {
        setLearners(Array.from({ length: 24 }, (_, i) => ({
          _id: `${i + 1}`,
          matricule: `MAT-${String(i + 1).padStart(4, '0')}`,
          firstName: ['Jean', 'Marie', 'Ahmed', 'Fatima', 'Pierre', 'Amina', 'David', 'Sarah', 'Mohamed', 'Julie', 'Ali', 'Sophie', 'Omar', 'Leila', 'Thomas', 'Nadia', 'Youssef', 'Claire', 'Hassan', 'Inès', 'Lucas', 'Mona', 'Karim', 'Elise'][i],
          lastName: ['Dupont', 'Martin', 'Benali', 'Alami', 'Durand', 'Tazi', 'Lefèvre', 'El Fassi', 'Petit', 'Bernard', 'Idrissi', 'Moreau', 'Bennani', 'Rousseau', 'Mercier', 'Lamrani', 'Laurent', 'Simon', 'Chraibi', 'Michel', 'Leroy', 'Ouazzani', 'Roux', 'Fournier'][i],
          email: `apprenant${i + 1}@exemple.com`,
          phone: `+212 6${String(Math.floor(Math.random() * 100000000)).padStart(8, '0')}`,
          organization: ['OCP', 'ONCF', 'BMCE', 'Maroc Telecom', 'LafargeHolcim', 'Ciments du Maroc', 'Managem', 'Attijariwafa'][i % 8],
          registrationDate: new Date(2024, Math.floor(i / 2), (i % 28) + 1).toISOString(),
          createdAt: new Date().toISOString(),
        })))
      } finally {
        setLoading(false)
      }
    }
    fetchLearners()
  }, [])

  const filtered = learners.filter((l) => {
    const q = search.toLowerCase()
    return l.firstName.toLowerCase().includes(q) ||
      l.lastName.toLowerCase().includes(q) ||
      l.matricule.toLowerCase().includes(q) ||
      l.email.toLowerCase().includes(q)
  })

  const totalPages = Math.ceil(filtered.length / perPage)
  const paginated = filtered.slice((page - 1) * perPage, page * perPage)

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Apprenants</h1>
          <p className="text-sm text-gray-500 mt-1">Gérez votre base d'apprenants ({learners.length} inscrits)</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Upload className="h-4 w-4 mr-2" /> Importer CSV
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" /> Exporter
          </Button>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="h-4 w-4 mr-2" /> Ajouter
          </Button>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text"
          placeholder="Rechercher par nom, matricule ou email..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1) }}
          className="w-full h-10 pl-10 pr-4 rounded-lg border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
        />
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(8)].map((_, i) => (
            <Skeleton key={i} className="h-14 w-full rounded-lg" />
          ))}
        </div>
      ) : paginated.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Search className="h-12 w-12 text-gray-300 mb-4" />
            <p className="text-gray-500 font-medium">Aucun apprenant trouvé</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Matricule</TableHead>
                  <TableHead>Nom & Prénom</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Organisme</TableHead>
                  <TableHead>Date d'inscription</TableHead>
                  <TableHead className="w-16"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginated.map((learner) => (
                  <TableRow key={learner._id}>
                    <TableCell className="font-mono text-xs font-medium text-gray-900">
                      {learner.matricule}
                    </TableCell>
                    <TableCell>
                      <p className="text-sm font-medium text-gray-900">
                        {learner.firstName} {learner.lastName}
                      </p>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <span className="flex items-center gap-1 text-xs text-gray-500">
                          <Mail className="h-3 w-3" /> {learner.email}
                        </span>
                        {learner.phone && (
                          <span className="flex items-center gap-1 text-xs text-gray-500">
                            <Phone className="h-3 w-3" /> {learner.phone}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {learner.organization ? (
                        <Badge variant="outline">{learner.organization}</Badge>
                      ) : (
                        <span className="text-xs text-gray-400">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">
                      {formatDate(learner.registrationDate)}
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
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Page {page} sur {totalPages}
          </p>
          <div className="flex gap-1">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 1}
              onClick={() => setPage(page - 1)}
            >
              Précédent
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page === totalPages}
              onClick={() => setPage(page + 1)}
            >
              Suivant
            </Button>
          </div>
        </div>
      )}

      <CreateLearnerDialog open={showCreateDialog} onClose={() => setShowCreateDialog(false)} />
    </div>
  )
}

function CreateLearnerDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [organization, setOrganization] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onClose()
  }

  return (
    <Dialog open={open} onClose={onClose} title="Ajouter un apprenant">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Input label="Prénom" value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
          <Input label="Nom" value={lastName} onChange={(e) => setLastName(e.target.value)} required />
        </div>
        <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <div className="grid grid-cols-2 gap-4">
          <Input label="Téléphone" value={phone} onChange={(e) => setPhone(e.target.value)} />
          <Input label="Organisme" value={organization} onChange={(e) => setOrganization(e.target.value)} />
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <Button variant="outline" type="button" onClick={onClose}>Annuler</Button>
          <Button type="submit">Ajouter</Button>
        </div>
      </form>
    </Dialog>
  )
}
