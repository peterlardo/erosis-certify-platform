import { useState, useEffect } from 'react'
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  Eye,
  EyeOff,
  MoreHorizontal,
  Edit,
  Trash2,
  Fingerprint,
} from 'lucide-react'
import { Card, CardContent } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'
import { Skeleton } from '../components/ui/skeleton'
import { Input } from '../components/ui/input'
import { Dialog } from '../components/ui/dialog'
import { DropdownMenu, DropdownMenuItem, DropdownMenuSeparator } from '../components/ui/dropdown-menu'
import { masksApi, type Mask } from '../lib/api'

const maskTypes = [
  {
    type: 'watermark',
    label: 'Filigrane',
    description: 'Marque d\'eau transparente sur le certificat',
    icon: ShieldCheck,
    color: 'text-blue-500 bg-blue-50',
  },
  {
    type: 'border',
    label: 'Bordures de sécurité',
    description: 'Motif de bordure anti-contrefaçon',
    icon: ShieldAlert,
    color: 'text-red-500 bg-red-50',
  },
  {
    type: 'hologram',
    label: 'Hologramme',
    description: 'Élément holographique de vérification',
    icon: Fingerprint,
    color: 'text-purple-500 bg-purple-50',
  },
  {
    type: 'microtext',
    label: 'Micro-texte',
    description: 'Texte invisible à l\'œil nu',
    icon: Eye,
    color: 'text-green-500 bg-green-50',
  },
]

export default function MasksPage() {
  const [masks, setMasks] = useState<Mask[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateDialog, setShowCreateDialog] = useState(false)

  useEffect(() => {
    const fetchMasks = async () => {
      try {
        const res = await masksApi.list()
        setMasks(res.data)
      } catch {
        setMasks([
          { _id: '1', name: 'Filigrane EROSIS', type: 'watermark', isActive: true, settings: { opacity: 0.15, text: 'EROSIS CERTIFY' }, createdAt: '2025-01-01' },
          { _id: '2', name: 'Bordure de sécurité standard', type: 'border', isActive: true, settings: { pattern: 'waves', color: '#1423A5' }, createdAt: '2025-01-15' },
          { _id: '3', name: 'Micro-texte institutionnel', type: 'microtext', isActive: false, settings: { text: 'CERTIFICAT OFFICIEL - REPRODUCTION INTERDITE', size: 6 }, createdAt: '2025-02-01' },
          { _id: '4', name: 'Hologramme doré', type: 'hologram', isActive: true, settings: { pattern: 'seal', color: '#D4AF37' }, createdAt: '2025-02-15' },
        ])
      } finally {
        setLoading(false)
      }
    }
    fetchMasks()
  }, [])

  const toggleActive = async (id: string, current: boolean) => {
    setMasks((prev) =>
      prev.map((m) => (m._id === id ? { ...m, isActive: !current } : m))
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Masques de sécurité</h1>
          <p className="text-sm text-gray-500 mt-1">Gérez les éléments de sécurité de vos certificats</p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Shield className="h-4 w-4 mr-2" /> Nouveau masque
        </Button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-40 rounded-xl" />
          ))}
        </div>
      ) : masks.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Shield className="h-12 w-12 text-gray-300 mb-4" />
            <p className="text-gray-500 font-medium">Aucun masque de sécurité</p>
            <p className="text-sm text-gray-400 mt-1">Créez votre premier masque pour sécuriser vos certificats</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {masks.map((mask) => {
            const maskTypeInfo = maskTypes.find((mt) => mt.type === mask.type)
            const Icon = maskTypeInfo?.icon || Shield
            return (
              <Card key={mask._id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className={`p-3 rounded-xl ${maskTypeInfo?.color || 'bg-gray-100 text-gray-500'}`}>
                        <Icon className="h-6 w-6" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{mask.name}</h3>
                        <p className="text-sm text-gray-500 mt-0.5">{maskTypeInfo?.description}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant={mask.isActive ? 'success' : 'outline'}>
                            {mask.isActive ? 'Actif' : 'Inactif'}
                          </Badge>
                          {mask.type && <Badge variant="outline">{maskTypeInfo?.label || mask.type}</Badge>}
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
                      <DropdownMenuItem onClick={() => toggleActive(mask._id, mask.isActive)}>
                        {mask.isActive ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
                        {mask.isActive ? 'Désactiver' : 'Activer'}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-red-600"><Trash2 className="h-4 w-4 mr-2" /> Supprimer</DropdownMenuItem>
                    </DropdownMenu>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      <CreateMaskDialog open={showCreateDialog} onClose={() => setShowCreateDialog(false)} />
    </div>
  )
}

function CreateMaskDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [name, setName] = useState('')
  const [type, setType] = useState('watermark')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onClose()
  }

  return (
    <Dialog open={open} onClose={onClose} title="Nouveau masque de sécurité">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input label="Nom du masque" value={name} onChange={(e) => setName(e.target.value)} placeholder="ex: Filigrane institutionnel" required />
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Type de masque</label>
          <div className="space-y-2">
            {maskTypes.map((mt) => {
              const Icon = mt.icon
              return (
                <label
                  key={mt.type}
                  className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                    type === mt.type ? 'border-primary bg-primary/5' : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="maskType"
                    value={mt.type}
                    checked={type === mt.type}
                    onChange={(e) => setType(e.target.value)}
                    className="sr-only"
                  />
                  <div className={`p-2 rounded-lg ${mt.color}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">{mt.label}</p>
                    <p className="text-xs text-gray-400">{mt.description}</p>
                  </div>
                </label>
              )
            })}
          </div>
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <Button variant="outline" type="button" onClick={onClose}>Annuler</Button>
          <Button type="submit">Créer le masque</Button>
        </div>
      </form>
    </Dialog>
  )
}
