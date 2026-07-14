import { useState } from 'react'
import { Search, ShieldCheck, ShieldX, Award, QrCode, User, BookOpen, Calendar, CheckCircle, XCircle, AlertTriangle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'
import { Separator } from '../components/ui/separator'
import { formatDate } from '../lib/utils'
import { publicApi, type Certificate } from '../lib/api'

type VerifyStatus = 'idle' | 'loading' | 'valid' | 'revoked' | 'expired' | 'not_found'

export default function PublicVerifyPage() {
  const [code, setCode] = useState('')
  const [status, setStatus] = useState<VerifyStatus>('idle')
  const [certificate, setCertificate] = useState<Certificate | null>(null)
  const [error, setError] = useState('')

  const handleVerify = async () => {
    if (!code.trim()) {
      setError('Veuillez entrer un code de vérification')
      return
    }
    setError('')
    setStatus('loading')
    try {
      const res = await publicApi.verify(code.trim())
      setCertificate(res.data)
      setStatus(res.data.status === 'revoked' ? 'revoked' : res.data.status === 'expired' ? 'expired' : 'valid')
    } catch {
      setStatus('not_found')
      setCertificate(null)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-light-gray to-white">
      <div className="max-w-2xl mx-auto px-4 py-12">
        {/* Branding */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-primary mb-4">
            <Award className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-primary">EROSIS CERTIFY</h1>
          <p className="text-gray-500 mt-2">Plateforme de vérification de certificats</p>
        </div>

        <Card className="border-primary/20 shadow-lg">
          <CardHeader className="text-center border-b border-gray-100">
            <CardTitle className="text-lg">Vérifier un certificat</CardTitle>
            <p className="text-sm text-gray-500 mt-1">
              Entrez le numéro du certificat ou le code de vérification
            </p>
          </CardHeader>
          <CardContent className="p-6">
            {/* Search input */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Numéro ou code de vérification..."
                  value={code}
                  onChange={(e) => { setCode(e.target.value); setStatus('idle') }}
                  onKeyDown={(e) => e.key === 'Enter' && handleVerify()}
                  className="w-full h-12 pl-10 pr-4 rounded-lg border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                />
              </div>
              <Button className="h-12 px-6" onClick={handleVerify} disabled={status === 'loading'}>
                {status === 'loading' ? 'Vérification...' : 'Vérifier'}
              </Button>
            </div>

            {/* QR Code scan button */}
            <Button variant="outline" className="w-full mt-3 h-10">
              <QrCode className="h-4 w-4 mr-2" /> Scanner un QR Code
            </Button>

            {error && (
              <div className="mt-4 p-3 rounded-lg bg-yellow-50 border border-yellow-200 text-yellow-700 text-sm">
                {error}
              </div>
            )}

            {/* Result */}
            {status !== 'idle' && status !== 'loading' && (
              <div className="mt-6">
                <Separator className="mb-6" />

                {status === 'not_found' ? (
                  <div className="text-center py-8">
                    <ShieldX className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-700">Certificat introuvable</h3>
                    <p className="text-sm text-gray-500 mt-2">
                      Aucun certificat ne correspond à ce code. Veuillez vérifier le code saisi.
                    </p>
                  </div>
                ) : (
                  <>
                    {/* Status Banner */}
                    <div className={`rounded-xl p-4 mb-6 ${
                      status === 'valid' ? 'bg-green-50 border border-green-200' :
                      status === 'revoked' ? 'bg-red-50 border border-red-200' :
                      'bg-yellow-50 border border-yellow-200'
                    }`}>
                      <div className="flex items-center gap-3">
                        {status === 'valid' ? (
                          <CheckCircle className="h-8 w-8 text-green-500" />
                        ) : status === 'revoked' ? (
                          <XCircle className="h-8 w-8 text-red-500" />
                        ) : (
                          <AlertTriangle className="h-8 w-8 text-yellow-500" />
                        )}
                        <div>
                          <h3 className={`font-semibold text-lg ${
                            status === 'valid' ? 'text-green-700' :
                            status === 'revoked' ? 'text-red-700' :
                            'text-yellow-700'
                          }`}>
                            {status === 'valid' && 'Certificat valide'}
                            {status === 'revoked' && 'Certificat révoqué'}
                            {status === 'expired' && 'Certificat expiré'}
                          </h3>
                          <p className={`text-sm ${
                            status === 'valid' ? 'text-green-600' :
                            status === 'revoked' ? 'text-red-600' :
                            'text-yellow-600'
                          }`}>
                            {status === 'valid' && 'Ce certificat est authentique et en cours de validité.'}
                            {status === 'revoked' && 'Ce certificat a été révoqué et n\'est plus valide.'}
                            {status === 'expired' && 'Ce certificat a expiré et n\'est plus valide.'}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <User className="h-5 w-5 text-gray-400" />
                        <div>
                          <p className="text-xs text-gray-400">Apprenant</p>
                          <p className="text-sm font-medium text-gray-900">
                            {typeof certificate?.learner === 'object' ? `${certificate.learner.firstName} ${certificate.learner.lastName}` : 'N/A'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <BookOpen className="h-5 w-5 text-gray-400" />
                        <div>
                          <p className="text-xs text-gray-400">Formation</p>
                          <p className="text-sm font-medium text-gray-900">
                            {typeof certificate?.course === 'object' ? certificate.course.title : 'N/A'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Calendar className="h-5 w-5 text-gray-400" />
                        <div>
                          <p className="text-xs text-gray-400">Date d'émission</p>
                          <p className="text-sm font-medium text-gray-900">
                            {certificate?.issueDate ? formatDate(certificate.issueDate) : 'N/A'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Award className="h-5 w-5 text-gray-400" />
                        <div>
                          <p className="text-xs text-gray-400">Numéro de certificat</p>
                          <p className="text-sm font-medium text-gray-900">{certificate?.number}</p>
                        </div>
                      </div>
                      {status === 'valid' && (
                        <div className="flex items-center gap-3">
                          <ShieldCheck className="h-5 w-5 text-green-500" />
                          <div>
                            <p className="text-xs text-gray-400">Statut</p>
                            <Badge variant="success">Valide</Badge>
                          </div>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="text-center mt-8 space-y-2">
          <p className="text-xs text-gray-400">
            Cette plateforme permet de vérifier l'authenticité des certificats émis par EROSIS CERTIFY.
          </p>
          <p className="text-xs text-gray-400">
            &copy; {new Date().getFullYear()} EROSIS CERTIFY. Tous droits réservés.
          </p>
        </div>
      </div>
    </div>
  )
}
