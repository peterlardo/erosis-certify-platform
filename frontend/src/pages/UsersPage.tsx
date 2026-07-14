import type React from 'react'
import { useState, useEffect } from 'react'
import {
  Plus,
  Search,
  MoreHorizontal,
  Edit,
  Trash2,
  Ban,
  CheckCircle,
  Users,
} from 'lucide-react'
import { Card, CardContent } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Select } from '../components/ui/select'
import { Skeleton } from '../components/ui/skeleton'
import { Avatar } from '../components/ui/avatar'
import { Dialog } from '../components/ui/dialog'
import { DropdownMenu, DropdownMenuItem, DropdownMenuSeparator } from '../components/ui/dropdown-menu'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/table'
import { formatDate } from '../lib/utils'
import { usersApi, type User } from '../lib/api'

const roleColors: Record<string, 'default' | 'secondary' | 'success' | 'outline'> = {
  admin: 'default',
  manager: 'secondary',
  trainer: 'success',
  viewer: 'outline',
}

const roleLabels: Record<string, string> = {
  admin: 'Administrateur',
  manager: 'Gestionnaire',
  trainer: 'Formateur',
  viewer: 'Consultant',
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [showCreateDialog, setShowCreateDialog] = useState(false)

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await usersApi.list()
        setUsers(res.data)
      } catch {
        setUsers([
          { _id: '1', firstName: 'Admin', lastName: 'EROSIS', email: 'admin@erosis.ma', role: 'admin', isActive: true, createdAt: '2024-01-01', updatedAt: '2025-03-01' },
          { _id: '2', firstName: 'Sarah', lastName: 'El Amrani', email: 'sarah@erosis.ma', role: 'manager', isActive: true, createdAt: '2024-02-15', updatedAt: '2025-03-10' },
          { _id: '3', firstName: 'Kamal', lastName: 'Benslimane', email: 'kamal@erosis.ma', role: 'trainer', isActive: true, createdAt: '2024-03-01', updatedAt: '2025-02-20' },
          { _id: '4', firstName: 'Hassan', lastName: 'Benali', email: 'hassan@erosis.ma', role: 'trainer', isActive: false, createdAt: '2024-03-15', updatedAt: '2025-01-15' },
          { _id: '5', firstName: 'Nadia', lastName: 'Lamrani', email: 'nadia@erosis.ma', role: 'viewer', isActive: true, createdAt: '2024-04-01', updatedAt: '2025-03-05' },
        ])
      } finally {
        setLoading(false)
      }
    }
    fetchUsers()
  }, [])

  const filtered = users.filter((u) => {
    const q = search.toLowerCase()
    const nameMatch = `${u.firstName} ${u.lastName}`.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
    const roleMatch = roleFilter === 'all' || u.role === roleFilter
    return nameMatch && roleMatch
  })

  const roleOptions = [
    { value: 'all', label: 'Tous les rôles' },
    { value: 'admin', label: 'Administrateur' },
    { value: 'manager', label: 'Gestionnaire' },
    { value: 'trainer', label: 'Formateur' },
    { value: 'viewer', label: 'Consultant' },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Utilisateurs</h1>
          <p className="text-sm text-gray-500 mt-1">Gérez les accès à la plateforme</p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="h-4 w-4 mr-2" /> Nouvel utilisateur
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher par nom ou email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-10 pl-10 pr-4 rounded-lg border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
          />
        </div>
        <Select
          options={roleOptions}
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
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
            <Users className="h-12 w-12 text-gray-300 mb-4" />
            <p className="text-gray-500 font-medium">Aucun utilisateur trouvé</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Utilisateur</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Rôle</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Date d'inscription</TableHead>
                  <TableHead className="w-16"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((u) => (
                  <TableRow key={u._id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar fallback={`${u.firstName} ${u.lastName}`} size="sm" />
                        <p className="text-sm font-medium text-gray-900">{u.firstName} {u.lastName}</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">{u.email}</TableCell>
                    <TableCell>
                      <Badge variant={roleColors[u.role] || 'outline'}>
                        {roleLabels[u.role] || u.role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={u.isActive ? 'success' : 'danger'}>
                        {u.isActive ? 'Actif' : 'Suspendu'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">
                      {formatDate(u.createdAt)}
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
                        <DropdownMenuItem>
                          {u.isActive ? <Ban className="h-4 w-4 mr-2" /> : <CheckCircle className="h-4 w-4 mr-2" />}
                          {u.isActive ? 'Suspendre' : 'Activer'}
                        </DropdownMenuItem>
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

      <CreateUserDialog open={showCreateDialog} onClose={() => setShowCreateDialog(false)} />
    </div>
  )
}

function CreateUserDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState('viewer')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onClose()
  }

  return (
    <Dialog open={open} onClose={onClose} title="Nouvel utilisateur">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Input label="Prénom" value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
          <Input label="Nom" value={lastName} onChange={(e) => setLastName(e.target.value)} required />
        </div>
        <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <Input label="Mot de passe" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        <Select
          label="Rôle"
          options={[
            { value: 'admin', label: 'Administrateur' },
            { value: 'manager', label: 'Gestionnaire' },
            { value: 'trainer', label: 'Formateur' },
            { value: 'viewer', label: 'Consultant' },
          ]}
          value={role}
          onChange={(e) => setRole(e.target.value)}
        />
        <div className="flex justify-end gap-3 pt-2">
          <Button variant="outline" type="button" onClick={onClose}>Annuler</Button>
          <Button type="submit">Créer</Button>
        </div>
      </form>
    </Dialog>
  )
}
