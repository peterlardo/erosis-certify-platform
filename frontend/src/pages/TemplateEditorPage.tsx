import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Save,
  Eye,
  Undo2,
  Redo2,
  ZoomIn,
  ZoomOut,
  Type,
  Image,
  Text,
  Square,
  QrCode,
  PenLine,
  Hash,
  Grid3X3,
  Trash2,
} from 'lucide-react'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Select } from '../components/ui/select'
import { Separator } from '../components/ui/separator'
import type { TemplateElement } from '../lib/api'

interface DragItem {
  type: string
  label: string
  icon: React.ElementType
}

const elementTypes: DragItem[] = [
  { type: 'logo', label: 'Logo', icon: Image },
  { type: 'title', label: 'Titre', icon: Type },
  { type: 'text', label: 'Texte libre', icon: Text },
  { type: 'learnerName', label: 'Nom apprenant', icon: Hash },
  { type: 'courseName', label: 'Nom formation', icon: Text },
  { type: 'date', label: 'Date', icon: Square },
  { type: 'qrCode', label: 'QR Code', icon: QrCode },
  { type: 'signature', label: 'Signature', icon: PenLine },
]

export default function TemplateEditorPage() {
  const navigate = useNavigate()
  const [templateName, setTemplateName] = useState('Nouveau modèle')
  const [orientation] = useState('landscape')
  const [zoom, setZoom] = useState(100)
  const [elements, setElements] = useState<TemplateElement[]>([])
  const [selectedElement, setSelectedElement] = useState<string | null>(null)

  const addElement = useCallback((type: string) => {
    const newEl: TemplateElement = {
      id: `el-${Date.now()}`,
      type,
      x: 50 + Math.random() * 100,
      y: 50 + Math.random() * 100,
      width: 200,
      height: 40,
      content: type === 'title' ? 'Titre du certificat' :
               type === 'text' ? 'Texte libre' :
               type === 'learnerName' ? '[Nom de l\'apprenant]' :
               type === 'courseName' ? '[Nom de la formation]' :
               type === 'date' ? '01 janvier 2025' : '',
      fontSize: type === 'title' ? 24 : type === 'learnerName' ? 18 : 12,
      fontColor: type === 'title' ? '#1423A5' : type === 'learnerName' ? '#171717' : '#6b7280',
      fontFamily: 'Inter',
      bold: type === 'title',
      italic: false,
      textAlign: 'center',
    }
    setElements((prev) => [...prev, newEl])
    setSelectedElement(newEl.id)
  }, [])

  const updateElement = useCallback((id: string, updates: Partial<TemplateElement>) => {
    setElements((prev) =>
      prev.map((el) => (el.id === id ? { ...el, ...updates } : el))
    )
  }, [])

  const deleteElement = useCallback((id: string) => {
    setElements((prev) => prev.filter((el) => el.id !== id))
    setSelectedElement((prev) => (prev === id ? null : prev))
  }, [])

  const selectedEl = elements.find((el) => el.id === selectedElement)

  const previewStyle = {
    width: orientation === 'landscape' ? '800px' : '600px',
    height: orientation === 'landscape' ? '560px' : '800px',
  }

  return (
    <div className="h-[calc(100vh-6rem)] flex flex-col">
      {/* Toolbar */}
      <div className="flex items-center justify-between bg-white border border-gray-200 rounded-t-xl px-4 py-2">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/templates')} className="p-1.5 rounded text-gray-400 hover:text-gray-600 hover:bg-gray-100 cursor-pointer">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <Separator orientation="vertical" className="h-6" />
          <input
            type="text"
            value={templateName}
            onChange={(e) => setTemplateName(e.target.value)}
            className="text-sm font-medium text-gray-900 bg-transparent border-none focus:outline-none focus:ring-0 px-2 py-1 rounded hover:bg-gray-50"
          />
        </div>
        <div className="flex items-center gap-1">
          <button className="p-1.5 rounded text-gray-400 hover:text-gray-600 hover:bg-gray-100 cursor-pointer" title="Annuler">
            <Undo2 className="h-4 w-4" />
          </button>
          <button className="p-1.5 rounded text-gray-400 hover:text-gray-600 hover:bg-gray-100 cursor-pointer" title="Rétablir">
            <Redo2 className="h-4 w-4" />
          </button>
          <Separator orientation="vertical" className="h-6 mx-1" />
          <button
            className="p-1.5 rounded text-gray-400 hover:text-gray-600 hover:bg-gray-100 cursor-pointer"
            onClick={() => setZoom(Math.max(25, zoom - 10))}
          >
            <ZoomOut className="h-4 w-4" />
          </button>
          <span className="text-xs text-gray-500 w-10 text-center">{zoom}%</span>
          <button
            className="p-1.5 rounded text-gray-400 hover:text-gray-600 hover:bg-gray-100 cursor-pointer"
            onClick={() => setZoom(Math.min(200, zoom + 10))}
          >
            <ZoomIn className="h-4 w-4" />
          </button>
          <Separator orientation="vertical" className="h-6 mx-1" />
          <Button variant="outline" size="sm">
            <Eye className="h-4 w-4 mr-1" /> Aperçu
          </Button>
          <Button size="sm">
            <Save className="h-4 w-4 mr-1" /> Enregistrer
          </Button>
        </div>
      </div>

      <div className="flex-1 flex bg-gray-50 border-l border-r border-b border-gray-200 rounded-b-xl overflow-hidden">
        {/* Left - Elements panel */}
        <div className="w-56 bg-white border-r border-gray-200 p-3 overflow-y-auto">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Éléments</h3>
          <div className="space-y-1">
            {elementTypes.map((el) => {
              const Icon = el.icon
              return (
                <button
                  key={el.type}
                  onClick={() => addElement(el.type)}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-primary/5 hover:text-primary transition-colors cursor-pointer"
                >
                  <Icon className="h-4 w-4" />
                  {el.label}
                </button>
              )
            })}
          </div>
          <Separator className="my-4" />
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Disposition</h3>
          <div className="space-y-2">
            <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer">
              <Grid3X3 className="h-4 w-4" />
              Aligner
            </button>
          </div>
        </div>

        {/* Center - Canvas */}
        <div className="flex-1 flex items-center justify-center overflow-auto p-4">
          <div
            className="bg-white shadow-lg rounded relative transition-all duration-200"
            style={{
              ...previewStyle,
              transform: `scale(${zoom / 100})`,
              transformOrigin: 'center center',
            }}
          >
            {/* Decorative border */}
            <div className="absolute inset-3 border-2 border-gray-200 rounded pointer-events-none" />
            <div className="absolute inset-6 border border-gray-100 rounded pointer-events-none" />

            {/* Template elements */}
            {elements.map((el) => {
              const isSelected = selectedElement === el.id
              const elStyle: React.CSSProperties = {
                position: 'absolute',
                left: el.x,
                top: el.y,
                width: el.width,
                height: el.height,
                fontSize: el.fontSize,
                color: el.fontColor,
                fontFamily: el.fontFamily,
                fontWeight: el.bold ? 'bold' : 'normal',
                fontStyle: el.italic ? 'italic' : 'normal',
                textAlign: (el.textAlign as 'left' | 'center' | 'right') || 'center',
                cursor: 'move',
              }
              return (
                <div
                  key={el.id}
                  style={elStyle}
                  onClick={() => setSelectedElement(el.id)}
                  className={`flex items-center justify-center rounded transition-colors ${
                    isSelected ? 'ring-2 ring-primary bg-primary/5' : 'hover:bg-gray-50'
                  }`}
                >
                  <span className="truncate px-1">{el.content || el.type}</span>
                  {isSelected && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        deleteElement(el.id)
                      }}
                      className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center shadow cursor-pointer"
                    >
                      ×
                    </button>
                  )}
                </div>
              )
            })}

            {elements.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <Image className="h-10 w-10 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-400">Cliquez sur un élément pour l'ajouter</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right - Properties panel */}
        <div className="w-64 bg-white border-l border-gray-200 p-4 overflow-y-auto">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Propriétés</h3>
          {selectedEl ? (
            <div className="space-y-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Type</label>
                <p className="text-sm text-gray-700 font-medium capitalize">{selectedEl.type}</p>
              </div>
              <Input
                label="Contenu"
                value={selectedEl.content || ''}
                onChange={(e) => updateElement(selectedEl.id, { content: e.target.value })}
                placeholder="Texte..."
              />
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="X"
                  type="number"
                  value={String(selectedEl.x)}
                  onChange={(e) => updateElement(selectedEl.id, { x: Number(e.target.value) })}
                />
                <Input
                  label="Y"
                  type="number"
                  value={String(selectedEl.y)}
                  onChange={(e) => updateElement(selectedEl.id, { y: Number(e.target.value) })}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Largeur"
                  type="number"
                  value={String(selectedEl.width)}
                  onChange={(e) => updateElement(selectedEl.id, { width: Number(e.target.value) })}
                />
                <Input
                  label="Hauteur"
                  type="number"
                  value={String(selectedEl.height)}
                  onChange={(e) => updateElement(selectedEl.id, { height: Number(e.target.value) })}
                />
              </div>
              <Input
                label="Taille police"
                type="number"
                value={String(selectedEl.fontSize || 12)}
                onChange={(e) => updateElement(selectedEl.id, { fontSize: Number(e.target.value) })}
              />
              <div>
                <label className="block text-xs text-gray-500 mb-1">Couleur</label>
                <input
                  type="color"
                  value={selectedEl.fontColor || '#000000'}
                  onChange={(e) => updateElement(selectedEl.id, { fontColor: e.target.value })}
                  className="h-9 w-full rounded border border-gray-300 p-0.5 cursor-pointer"
                />
              </div>
              <Select
                label="Alignement"
                options={[
                  { value: 'left', label: 'Gauche' },
                  { value: 'center', label: 'Centré' },
                  { value: 'right', label: 'Droite' },
                ]}
                value={selectedEl.textAlign || 'center'}
                onChange={(e) => updateElement(selectedEl.id, { textAlign: e.target.value })}
              />
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedEl.bold || false}
                    onChange={(e) => updateElement(selectedEl.id, { bold: e.target.checked })}
                    className="rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  Gras
                </label>
                <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedEl.italic || false}
                    onChange={(e) => updateElement(selectedEl.id, { italic: e.target.checked })}
                    className="rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  Italique
                </label>
              </div>
              <Separator />
              <Button
                variant="destructive"
                size="sm"
                className="w-full"
                onClick={() => deleteElement(selectedEl.id)}
              >
                <Trash2 className="h-4 w-4 mr-2" /> Supprimer l'élément
              </Button>
            </div>
          ) : (
            <div className="text-center py-8">
              <Square className="h-8 w-8 text-gray-300 mx-auto mb-2" />
              <p className="text-xs text-gray-400">Sélectionnez un élément pour modifier ses propriétés</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}


