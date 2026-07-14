import type React from 'react'
import { useState, useEffect } from 'react'
import {
  Plus,
  Search,
  PenLine,
  MoreHorizontal,
  Edit,
  Trash2,
  UserCheck,
  Upload,
  BadgeCheck,
} from 'lucide-react'
import { Card, CardContent } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Skeleton } from '../components/ui/skeleton'
import { Avatar } from '../components/ui/avatar'
import { Dialog } from '../components/ui/dialog'
import { DropdownMenu, DropdownMenuItem, DropdownMenuSeparator } from '../components/ui/dropdown-menu'
import { type Signatory } from '../lib/api'

export default function SignatoriesPage() {
  const [signatories, setSignatories] = useState<Signatory[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showCreateDialog, setShowCreateDialog] = useState(false)

  useEffect(() => {
    const fetch = async () => {
      try {
        setSignatories([
          { _id: '1', firstName: 'Ahmed', lastName: 'Benali', title: 'Directeur général', organization: 'EROSIS Formation', signature: '', isActive: true, createdAt: '2024-01-01' },
          { _id: '2', firstName: 'Sarah', lastName: 'El Amrani', title: 'Responsable pédagogique', organization: 'EROSIS Formation', signature: '', isActive: true, createdAt: '2024-02-15' },
          { _id: '3', firstName: 'Mohamed', lastName: 'Idrissi', title: 'Coordonnateur', organization: 'EROSIS Formation', signature: '', isActive: false, createdAt: '2024-03-01' },
        ])
      } finally {
        setLoading(false)
      }
    }
    fetch()
  }, [])

  const filtered = signatories.filter((s) => {
    const q = search.toLowerCase()
    return `${s.firstName} ${s.lastName}`.toLowerCase().includes(q) ||
      s.title.toLowerCase().includes(q)
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Signataires</h1>
          <p className="text-sm text-gray-500 mt-1">Gérez les personnes autorisées à signer les certificats</p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="h-4 w-4 mr-2" /> Ajouter un signataire
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text"
          placeholder="Rechercher un signataire..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full h-10 pl-10 pr-4 rounded-lg border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
        />
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-36 rounded-xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <PenLine className="h-12 w-12 text-gray-300 mb-4" />
            <p className="text-gray-500 font-medium">Aucun signataire trouvé</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((signatory) => (
            <Card key={signatory._id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="relative">
                      <Avatar fallback={`${signatory.firstName} ${signatory.lastName}`} size="md" />
                      {signatory.isActive && (
                        <div className="absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full bg-green-500 border-2 border-white flex items-center justify-center">
                          <UserCheck className="h-2.5 w-2.5 text-white" />
                        </div>
                      )}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{signatory.firstName} {signatory.lastName}</h3>
                      <p className="text-sm text-gray-500">{signatory.title}</p>
                      {signatory.organization && (
                        <p className="text-xs text-gray-400 mt-0.5">{signatory.organization}</p>
                      )}
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant={signatory.isActive ? 'success' : 'outline'}>
                          {signatory.isActive ? 'Actif' : 'Inactif'}
                        </Badge>
                        {signatory.signature && <BadgeCheck className="h-4 w-4 text-green-500" />}
                      </div>
                    </div>
                  </div>
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
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <CreateSignatoryDialog open={showCreateDialog} onClose={() => setShowCreateDialog(false)} />
    </div>
  )
}

function CreateSignatoryDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [title, setTitle] = useState('')
  const [organization, setOrganization] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onClose()
  }

  return (
    <Dialog open={open} onClose={onClose} title="Ajouter un signataire">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Input label="Prénom" value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
          <Input label="Nom" value={lastName} onChange={(e) => setLastName(e.target.value)} required />
        </div>
        <Input label="Titre / Fonction" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="ex: Directeur général" required />
        <Input label="Organisation" value={organization} onChange={(e) => setOrganization(e.target.value)} placeholder="ex: EROSIS Formation" />
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Signature (image)</label>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-primary/50 transition-colors cursor-pointer">
            <Upload className="h-8 w-8 text-gray-300 mx-auto mb-2" />
            <p className="text-xs text-gray-400">Cliquez pour télécharger l'image de la signature</p>
            <p className="text-[10px] text-gray-300 mt-1">PNG, JPG • Max 2 MB</p>
          </div>
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <Button variant="outline" type="button" onClick={onClose}>Annuler</Button>
          <Button type="submit">Ajouter</Button>
        </div>
      </form>
    </Dialog>
  )
}
