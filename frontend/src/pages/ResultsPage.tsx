import { useState } from 'react'
import {
  Search,
  CheckCircle,
  XCircle,
  Users,
  CalendarDays,
  Save,
  Award,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/table'
import { formatDate } from '../lib/utils'

interface SessionResult {
  _id: string
  reference: string
  courseTitle: string
  startDate: string
  endDate: string
  learnerCount: number
  validatedCount: number
  status: 'pending' | 'completed'
}

interface LearnerResult {
  _id: string
  matricule: string
  firstName: string
  lastName: string
  grade: number | null
  mention: string | null
  hasPassed: boolean | null
}

export default function ResultsPage() {
  const [selectedSession, setSelectedSession] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  const sessions: SessionResult[] = [
    { _id: '1', reference: 'CYB-2025-01', courseTitle: 'Introduction à la cybersécurité', startDate: '2025-03-01', endDate: '2025-03-15', learnerCount: 25, validatedCount: 20, status: 'completed' },
    { _id: '2', reference: 'JAVA-2025-01', courseTitle: 'Développement Java avancé', startDate: '2025-04-10', endDate: '2025-05-05', learnerCount: 18, validatedCount: 0, status: 'pending' },
  ]

  const learnerResults: Record<string, LearnerResult[]> = {
    '1': [
      { _id: 'l1', matricule: 'MAT-0001', firstName: 'Jean', lastName: 'Dupont', grade: 17, mention: 'tres_bien', hasPassed: true },
      { _id: 'l2', matricule: 'MAT-0002', firstName: 'Marie', lastName: 'Martin', grade: 14, mention: 'bien', hasPassed: true },
      { _id: 'l3', matricule: 'MAT-0003', firstName: 'Ahmed', lastName: 'Benali', grade: 18, mention: 'excellent', hasPassed: true },
      { _id: 'l4', matricule: 'MAT-0004', firstName: 'Fatima', lastName: 'Alami', grade: 10, mention: 'passable', hasPassed: true },
      { _id: 'l5', matricule: 'MAT-0005', firstName: 'Pierre', lastName: 'Durand', grade: 8, mention: 'insuffisant', hasPassed: false },
    ],
    '2': [
      { _id: 'l6', matricule: 'MAT-0006', firstName: 'Amina', lastName: 'Tazi', grade: null, mention: null, hasPassed: null },
      { _id: 'l7', matricule: 'MAT-0007', firstName: 'David', lastName: 'Lefèvre', grade: null, mention: null, hasPassed: null },
    ],
  }

  const currentLearners = selectedSession ? (learnerResults[selectedSession] || []) : []
  const currentSession = sessions.find((s) => s._id === selectedSession)

  const [grades, setGrades] = useState<Record<string, string>>({})

  const updateGrade = (learnerId: string, value: string) => {
    setGrades((prev) => ({ ...prev, [learnerId]: value }))
  }

  const filteredLearners = currentLearners.filter((l) => {
    const q = search.toLowerCase()
    return `${l.firstName} ${l.lastName}`.toLowerCase().includes(q) || l.matricule.toLowerCase().includes(q)
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Résultats</h1>
        <p className="text-sm text-gray-500 mt-1">Saisie et validation des notes</p>
      </div>

      {!selectedSession ? (
        <>
          <p className="text-sm text-gray-500">Sélectionnez une session pour saisir les notes</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {sessions.map((session) => (
              <Card
                key={session._id}
                className="hover:border-primary/30 hover:shadow-md transition-all cursor-pointer"
                onClick={() => setSelectedSession(session._id)}
              >
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="text-xs font-mono text-gray-400">{session.reference}</p>
                      <h3 className="font-semibold text-gray-900 mt-1">{session.courseTitle}</h3>
                    </div>
                    <Badge variant={session.status === 'completed' ? 'success' : 'warning'}>
                      {session.status === 'completed' ? 'Terminée' : 'En cours'}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <CalendarDays className="h-3.5 w-3.5" />
                      {formatDate(session.startDate)} - {formatDate(session.endDate)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="h-3.5 w-3.5" />
                      {session.learnerCount} apprenants
                    </span>
                  </div>
                  {session.validatedCount > 0 && (
                    <div className="mt-3 flex items-center gap-2 text-xs text-green-600">
                      <CheckCircle className="h-3.5 w-3.5" />
                      {session.validatedCount}/{session.learnerCount} validés
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      ) : (
        <>
          {/* Session header */}
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setSelectedSession(null)}
                      className="text-sm text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                    >
                      &larr; Retour
                    </button>
                    <span className="text-gray-300">|</span>
                    <span className="text-xs font-mono text-gray-400">{currentSession?.reference}</span>
                  </div>
                  <h2 className="text-lg font-bold text-gray-900 mt-1">{currentSession?.courseTitle}</h2>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant={currentSession?.status === 'completed' ? 'success' : 'warning'}>
                    {currentSession?.status === 'completed' ? 'Terminée' : 'En cours'}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Grade Entry */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Saisie des notes</CardTitle>
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
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Matricule</TableHead>
                      <TableHead>Apprenant</TableHead>
                      <TableHead>Note /20</TableHead>
                      <TableHead>Mention</TableHead>
                      <TableHead>Statut</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredLearners.map((learner) => {
                      const finalGrade = grades[learner._id] !== undefined ? Number(grades[learner._id]) : learner.grade
                      const hasPassed = finalGrade !== null ? finalGrade >= 10 : null
                      return (
                        <TableRow key={learner._id}>
                          <TableCell className="font-mono text-xs text-gray-500">{learner.matricule}</TableCell>
                          <TableCell>
                            <p className="text-sm font-medium text-gray-900">{learner.firstName} {learner.lastName}</p>
                          </TableCell>
                          <TableCell>
                            <input
                              type="number"
                              min="0"
                              max="20"
                              step="0.5"
                              value={finalGrade ?? ''}
                              onChange={(e) => updateGrade(learner._id, e.target.value)}
                              className="w-20 h-9 rounded-lg border border-gray-300 px-3 text-sm text-center focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                              placeholder="-/20"
                            />
                          </TableCell>
                          <TableCell>
                            {finalGrade !== null && finalGrade !== undefined ? (
                              <Badge
                                variant={
                                  finalGrade >= 16 ? 'success' :
                                  finalGrade >= 14 ? 'default' :
                                  finalGrade >= 12 ? 'secondary' :
                                  finalGrade >= 10 ? 'warning' : 'danger'
                                }
                              >
                                {finalGrade >= 16 ? 'Excellent' :
                                 finalGrade >= 14 ? 'Très bien' :
                                 finalGrade >= 12 ? 'Bien' :
                                 finalGrade >= 10 ? 'Passable' : 'Insuffisant'}
                              </Badge>
                            ) : (
                              <span className="text-xs text-gray-400">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {hasPassed === true && (
                              <Badge variant="success">
                                <CheckCircle className="h-3 w-3 mr-1" /> Validé
                              </Badge>
                            )}
                            {hasPassed === false && (
                              <Badge variant="danger">
                                <XCircle className="h-3 w-3 mr-1" /> Échec
                              </Badge>
                            )}
                            {hasPassed === null && (
                              <span className="text-xs text-gray-400">En attente</span>
                            )}
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setSelectedSession(null)}>
              Annuler
            </Button>
            <Button>
              <Save className="h-4 w-4 mr-2" /> Enregistrer les notes
            </Button>
            <Button variant="secondary">
              <Award className="h-4 w-4 mr-2" /> Valider les résultats
            </Button>
          </div>
        </>
      )}
    </div>
  )
}
