import type React from 'react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Award, FileText, Users, Eye, Send } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Select } from '../components/ui/select'

interface LearnerOption {
  id: string
  name: string
  matricule: string
  selected: boolean
}

export default function CertificateGeneratePage() {
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [sessionId, setSessionId] = useState('')
  const [courseId, setCourseId] = useState('')
  const [templateId, setTemplateId] = useState('')
  const [signatoryId, setSignatoryId] = useState('')
  const [issueDate, setIssueDate] = useState(new Date().toISOString().split('T')[0])
  const [learners, setLearners] = useState<LearnerOption[]>([
    { id: '1', name: 'Jean Dupont', matricule: 'MAT-0001', selected: false },
    { id: '2', name: 'Marie Martin', matricule: 'MAT-0002', selected: false },
    { id: '3', name: 'Ahmed Benali', matricule: 'MAT-0003', selected: false },
    { id: '4', name: 'Fatima Alami', matricule: 'MAT-0004', selected: false },
    { id: '5', name: 'Pierre Durand', matricule: 'MAT-0005', selected: false },
  ])
  const [selectAll, setSelectAll] = useState(false)

  const toggleLearner = (id: string) => {
    setLearners((prev) =>
      prev.map((l) => (l.id === id ? { ...l, selected: !l.selected } : l))
    )
  }

  const toggleSelectAll = () => {
    setSelectAll(!selectAll)
    setLearners((prev) => prev.map((l) => ({ ...l, selected: !selectAll })))
  }

  const selectedCount = learners.filter((l) => l.selected).length

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault()
    // Submit generation
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <button
        onClick={() => navigate('/certificates')}
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors cursor-pointer"
      >
        <ArrowLeft className="h-4 w-4" />
        Retour aux certificats
      </button>

      <div>
        <h1 className="text-2xl font-bold text-gray-900">Génération de certificats</h1>
        <p className="text-sm text-gray-500 mt-1">
          Générez des certificats pour un ou plusieurs apprenants
        </p>
      </div>

      {/* Steps indicator */}
      <div className="flex items-center gap-0">
        {[{ step: 1, label: 'Session', icon: FileText }, { step: 2, label: 'Apprenants', icon: Users }, { step: 3, label: 'Configuration', icon: Award }, { step: 4, label: 'Confirmation', icon: Send }].map((s, idx) => (
          <div key={s.step} className="flex-1 flex items-center">
            <div className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              step >= s.step ? 'bg-primary/10 text-primary' : 'text-gray-400'
            }`}>
              <div className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold ${
                step >= s.step ? 'bg-primary text-white' : 'bg-gray-200 text-gray-500'
              }`}>
                {s.step}
              </div>
              <span className="hidden sm:inline">{s.label}</span>
            </div>
            {idx < 3 && <div className="flex-1 h-px bg-gray-200 mx-2" />}
          </div>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {step === 1 && 'Sélectionnez la session'}
            {step === 2 && 'Sélectionnez les apprenants'}
            {step === 3 && 'Configurez le certificat'}
            {step === 4 && 'Vérifiez et générez'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {step === 1 && (
            <div className="space-y-4">
              <Select
                label="Formation"
                options={[
                  { value: '1', label: 'Introduction à la cybersécurité (CYB-101)' },
                  { value: '2', label: 'Développement Java avancé (JAVA-201)' },
                  { value: '3', label: 'Machine Learning fondamentaux (ML-101)' },
                ]}
                value={courseId}
                onChange={(e) => setCourseId(e.target.value)}
                placeholder="Sélectionner une formation"
              />
              <Select
                label="Session"
                options={[
                  { value: '1', label: 'CYB-2025-01 (01/03/2025 - 15/03/2025)' },
                  { value: '2', label: 'JAVA-2025-01 (10/04/2025 - 05/05/2025)' },
                ]}
                value={sessionId}
                onChange={(e) => setSessionId(e.target.value)}
                placeholder="Sélectionner une session"
              />
              <div className="flex justify-end pt-4">
                <Button onClick={() => setStep(2)} disabled={!sessionId}>
                  Suivant
                </Button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500">
                  {selectedCount} apprenant(s) sélectionné(s)
                </p>
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectAll}
                    onChange={toggleSelectAll}
                    className="rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  Tout sélectionner
                </label>
              </div>
              <div className="border border-gray-200 rounded-lg divide-y divide-gray-100">
                {learners.map((learner) => (
                  <label
                    key={learner.id}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={learner.selected}
                      onChange={() => toggleLearner(learner.id)}
                      className="rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    <span className="text-xs font-mono text-gray-400 w-20">{learner.matricule}</span>
                    <span className="text-sm text-gray-700">{learner.name}</span>
                  </label>
                ))}
              </div>
              <div className="flex justify-between pt-4">
                <Button variant="outline" onClick={() => setStep(1)}>Retour</Button>
                <Button onClick={() => setStep(3)} disabled={selectedCount === 0}>
                  Suivant
                </Button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <Select
                label="Modèle de certificat"
                options={[
                  { value: '1', label: 'Modèle Standard - Paysage' },
                  { value: '2', label: 'Modèle Premium - Portrait' },
                  { value: '3', label: 'Modèle Minimaliste' },
                ]}
                value={templateId}
                onChange={(e) => setTemplateId(e.target.value)}
                placeholder="Sélectionner un modèle"
              />
              <Select
                label="Signataire"
                options={[
                  { value: '1', label: 'Dr. Ahmed Benali - Directeur' },
                  { value: '2', label: 'Mme. Sarah El Amrani - Responsable pédagogique' },
                ]}
                value={signatoryId}
                onChange={(e) => setSignatoryId(e.target.value)}
                placeholder="Sélectionner un signataire"
              />
              <Input
                label="Date d'émission"
                type="date"
                value={issueDate}
                onChange={(e) => setIssueDate(e.target.value)}
              />
              <div className="flex justify-between pt-4">
                <Button variant="outline" onClick={() => setStep(2)}>Retour</Button>
                <Button onClick={() => setStep(4)} disabled={!templateId}>Suivant</Button>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Session :</span>
                  <span className="text-gray-700 font-medium">CYB-2025-01</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Apprenants :</span>
                  <span className="text-gray-700 font-medium">{selectedCount}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Modèle :</span>
                  <span className="text-gray-700 font-medium">Modèle Standard - Paysage</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Date d'émission :</span>
                  <span className="text-gray-700 font-medium">{issueDate}</span>
                </div>
              </div>

              <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 text-sm text-primary">
                <p className="font-medium">⚠️ Information importante</p>
                <p className="text-primary/70 mt-1">
                  La génération des certificats est irréversible. Veuillez vérifier les informations avant de confirmer.
                </p>
              </div>

              <div className="flex justify-between pt-4">
                <Button variant="outline" onClick={() => setStep(3)}>Retour</Button>
                <div className="flex gap-2">
                  <Button variant="outline">
                    <Eye className="h-4 w-4 mr-2" /> Aperçu
                  </Button>
                  <Button onClick={handleGenerate}>
                    <Send className="h-4 w-4 mr-2" />
                    Générer {selectedCount > 1 ? `les ${selectedCount} certificats` : 'le certificat'}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
