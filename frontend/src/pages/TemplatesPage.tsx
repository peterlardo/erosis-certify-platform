import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, FileText, Copy, Edit, Trash2, Star, MoreHorizontal, Palette } from 'lucide-react'
import { Card, CardContent } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'
import { Skeleton } from '../components/ui/skeleton'
import { DropdownMenu, DropdownMenuItem, DropdownMenuSeparator } from '../components/ui/dropdown-menu'
import { templatesApi, type Template } from '../lib/api'

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const res = await templatesApi.list()
        setTemplates(res.data)
      } catch {
        setTemplates([
          { _id: '1', name: 'Modèle Standard', orientation: 'landscape', isDefault: true, elements: [], createdAt: '2025-01-01', updatedAt: '2025-03-15' },
          { _id: '2', name: 'Modèle Premium', orientation: 'portrait', isDefault: false, elements: [], createdAt: '2025-02-01', updatedAt: '2025-03-10' },
          { _id: '3', name: 'Modèle Minimaliste', orientation: 'landscape', isDefault: false, elements: [], createdAt: '2025-03-01', updatedAt: '2025-03-01' },
          { _id: '4', name: 'Modèle Certificat Avancé', orientation: 'landscape', isDefault: false, elements: [], createdAt: '2025-01-15', updatedAt: '2025-02-20' },
        ])
      } finally {
        setLoading(false)
      }
    }
    fetchTemplates()
  }, [])

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Modèles de certificats</h1>
          <p className="text-sm text-gray-500 mt-1">Créez et gérez vos modèles de certificats personnalisés</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" /> Nouveau modèle
        </Button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-64 rounded-xl" />
          ))}
        </div>
      ) : templates.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <FileText className="h-12 w-12 text-gray-300 mb-4" />
            <p className="text-gray-500 font-medium">Aucun modèle créé</p>
            <p className="text-sm text-gray-400 mt-1">Créez votre premier modèle de certificat</p>
            <Button className="mt-4"><Plus className="h-4 w-4 mr-2" /> Créer un modèle</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {templates.map((template) => (
            <Card
              key={template._id}
              className="hover:border-primary/30 hover:shadow-md transition-all duration-200 cursor-pointer group"
            >
              <CardContent className="p-0">
                {/* Preview area */}
                <div
                  className="relative bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center h-48 rounded-t-xl border-b border-gray-200"
                >
                  <div className={`relative bg-white shadow-sm rounded ${
                    template.orientation === 'portrait' ? 'w-28 h-40' : 'w-40 h-28'
                  }`}>
                    <div className="absolute inset-2 border-2 border-gray-200 rounded flex items-center justify-center">
                      <Palette className="h-6 w-6 text-gray-300" />
                    </div>
                  </div>
                  {template.isDefault && (
                    <div className="absolute top-2 right-2">
                      <Badge variant="default" className="text-[10px]">Par défaut</Badge>
                    </div>
                  )}
                  <div className="absolute top-2 left-2">
                    <Badge variant="outline" className="text-[10px]">
                      {template.orientation === 'landscape' ? 'Paysage' : 'Portrait'}
                    </Badge>
                  </div>
                </div>

                {/* Info */}
                <div className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 text-sm truncate group-hover:text-primary transition-colors">
                        {template.name}
                      </h3>
                      <p className="text-xs text-gray-400 mt-0.5">
                        Modifié le {new Date(template.updatedAt).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                    <DropdownMenu
                      trigger={
                        <button className="p-1 rounded text-gray-300 hover:text-gray-600 hover:bg-gray-100 transition-colors ml-2 cursor-pointer">
                          <MoreHorizontal className="h-4 w-4" />
                        </button>
                      }
                      align="end"
                    >
                      <DropdownMenuItem onClick={() => navigate(`/templates/${template._id}/edit`)}>
                        <Edit className="h-4 w-4 mr-2" /> Modifier
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Copy className="h-4 w-4 mr-2" /> Dupliquer
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Star className="h-4 w-4 mr-2" /> Définir par défaut
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-red-600">
                        <Trash2 className="h-4 w-4 mr-2" /> Supprimer
                      </DropdownMenuItem>
                    </DropdownMenu>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <div className="flex -space-x-1">
                      {['Rouge', 'Bleu', 'Or'].slice(0, 3).map((_color, i) => (
                        <div
                          key={i}
                          className="h-5 w-5 rounded-full border-2 border-white"
                          style={{ backgroundColor: i === 0 ? '#B0008F' : i === 1 ? '#1423A5' : '#D4AF37' }}
                        />
                      ))}
                    </div>
                    <span className="text-xs text-gray-400">+ couleurs</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
