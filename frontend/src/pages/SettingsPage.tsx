import { useState } from 'react'
import {
  Settings,
  Shield,
  Mail,
  FileText,
  Save,
  Building2,
  Search,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Badge } from '../components/ui/badge'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/table'

const tabs = [
  { value: 'general', label: 'Général', icon: Settings },
  { value: 'security', label: 'Sécurité', icon: Shield },
  { value: 'email', label: 'Emails', icon: Mail },
  { value: 'audit', label: 'Audit', icon: FileText },
]

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('general')
  const auditLogs = Array.from({ length: 10 }, (_, i) => ({
    id: `${i + 1}`,
    user: ['Admin', 'Jean Dupont', 'Sarah El Amrani', 'System'][i % 4],
    action: ['Connexion', 'Génération certificat', 'Modification modèle', 'Création utilisateur', 'Révocation certificat', 'Modification paramètres', 'Export données', 'Suppression apprenant', 'Modification session', 'Connexion'][i],
    details: `Détails de l'action ${i + 1}...`,
    ip: `192.168.1.${10 + i}`,
    date: new Date(2025, 0, 15 + i).toISOString(),
  }))

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Paramètres</h1>
        <p className="text-sm text-gray-500 mt-1">Configurez votre plateforme EROSIS CERTIFY</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-gray-100 rounded-lg w-fit flex-wrap">
        {tabs.map((tab) => {
          const Icon = tab.icon
          return (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer ${
                activeTab === tab.value
                  ? 'bg-white text-primary shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          )
        })}
      </div>

      {activeTab === 'general' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Informations du centre</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input label="Nom du centre" defaultValue="EROSIS Formation" />
                <Input label="Slogan" defaultValue="Excellence & Innovation" />
              </div>
              <Input label="Adresse" defaultValue="123, Avenue de la Formation, Casablanca" />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Input label="Téléphone" defaultValue="+212 5XX XX XX XX" />
                <Input label="Email" defaultValue="contact@erosis.ma" />
                <Input label="Site web" defaultValue="https://erosis.ma" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Identité visuelle</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Logo</label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-primary/50 transition-colors cursor-pointer">
                    <Building2 className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                    <p className="text-xs text-gray-400">Cliquez pour uploader</p>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Couleur principale</label>
                  <div className="flex items-center gap-3">
                    <input type="color" defaultValue="#1423A5" className="h-10 w-16 rounded border border-gray-300 p-0.5 cursor-pointer" />
                    <span className="text-sm text-gray-500">#1423A5</span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Couleur secondaire</label>
                  <div className="flex items-center gap-3">
                    <input type="color" defaultValue="#B0008F" className="h-10 w-16 rounded border border-gray-300 p-0.5 cursor-pointer" />
                    <span className="text-sm text-gray-500">#B0008F</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          <div className="flex justify-end">
            <Button><Save className="h-4 w-4 mr-2" /> Enregistrer</Button>
          </div>
        </div>
      )}

      {activeTab === 'security' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Politique de mot de passe</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input label="Longueur minimale" type="number" defaultValue="8" />
                <Input label="Expiration (jours)" type="number" defaultValue="90" />
              </div>
              <div className="space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" defaultChecked className="rounded border-gray-300 text-primary focus:ring-primary" />
                  <span className="text-sm text-gray-700">Exiger des majuscules</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" defaultChecked className="rounded border-gray-300 text-primary focus:ring-primary" />
                  <span className="text-sm text-gray-700">Exiger des chiffres</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" className="rounded border-gray-300 text-primary focus:ring-primary" />
                  <span className="text-sm text-gray-700">Exiger des caractères spéciaux</span>
                </label>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Authentification multi-facteurs (MFA)</CardTitle>
            </CardHeader>
            <CardContent>
              <label className="flex items-center justify-between cursor-pointer">
                <div>
                  <p className="text-sm font-medium text-gray-700">Activer la MFA</p>
                  <p className="text-xs text-gray-400">Renforce la sécurité des comptes administrateurs</p>
                </div>
                <div className="relative">
                  <input type="checkbox" className="sr-only peer" />
                  <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:bg-primary peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all cursor-pointer" />
                </div>
              </label>
            </CardContent>
          </Card>
          <div className="flex justify-end">
            <Button><Save className="h-4 w-4 mr-2" /> Enregistrer</Button>
          </div>
        </div>
      )}

      {activeTab === 'email' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Configuration SMTP</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input label="Serveur SMTP" defaultValue="smtp.erosis.ma" />
                <Input label="Port" defaultValue="587" />
                <Input label="Utilisateur" defaultValue="noreply@erosis.ma" />
                <Input label="Mot de passe" type="password" defaultValue="********" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Modèles d'email</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                { name: 'Certificat généré', desc: 'Notification d\'émission de certificat' },
                { name: 'Certificat révoqué', desc: 'Notification de révocation' },
                { name: 'Inscription session', desc: 'Confirmation d\'inscription' },
                { name: 'Rappel session', desc: 'Rappel avant début de session' },
              ].map((t) => (
                <div key={t.name} className="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:bg-gray-50">
                  <div>
                    <p className="text-sm font-medium text-gray-700">{t.name}</p>
                    <p className="text-xs text-gray-400">{t.desc}</p>
                  </div>
                  <Button variant="outline" size="sm">Modifier</Button>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'audit' && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Journal d'audit</CardTitle>
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Rechercher..."
                  className="w-full h-9 pl-9 pr-3 rounded-lg border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Utilisateur</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Détails</TableHead>
                    <TableHead>Adresse IP</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {auditLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="text-sm text-gray-700">{log.user}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{log.action}</Badge>
                      </TableCell>
                      <TableCell className="text-sm text-gray-500">{log.details}</TableCell>
                      <TableCell className="text-xs font-mono text-gray-500">{log.ip}</TableCell>
                      <TableCell className="text-sm text-gray-500">
                        {new Date(log.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
