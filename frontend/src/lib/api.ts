import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' }
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const token = localStorage.getItem('token')
    if (token === 'demo-token') {
      return Promise.resolve({ data: null, success: true })
    }
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      if (window.location.pathname !== '/login') {
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

export interface LoginData {
  email: string
  password: string
}

export interface RegisterData {
  firstName: string
  lastName: string
  email: string
  password: string
}

export interface ApiResponse<T> {
  data: T
  message?: string
  total?: number
  page?: number
  limit?: number
}

export interface User {
  _id: string
  firstName: string
  lastName: string
  email: string
  role: string
  avatar?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface Course {
  _id: string
  title: string
  code: string
  duration: number
  description?: string
  objectives?: string
  status: 'active' | 'draft' | 'archived'
  learnerCount: number
  createdAt: string
  updatedAt: string
}

export interface Session {
  _id: string
  reference: string
  course: Course | string
  startDate: string
  endDate: string
  trainer?: string
  status: 'planned' | 'in_progress' | 'completed' | 'cancelled'
  enrolledCount: number
  maxCapacity: number
  createdAt: string
}

export interface Learner {
  _id: string
  matricule: string
  firstName: string
  lastName: string
  email: string
  phone?: string
  organization?: string
  registrationDate: string
  createdAt: string
}

export interface Certificate {
  _id: string
  number: string
  learner: Learner | string
  course: Course | string
  session: Session | string
  issueDate: string
  expiryDate?: string
  status: 'valid' | 'pending' | 'revoked' | 'expired'
  template?: string
  pdfUrl?: string
  verificationCode: string
  createdAt: string
}

export interface Template {
  _id: string
  name: string
  orientation: 'portrait' | 'landscape'
  isDefault: boolean
  elements: TemplateElement[]
  createdAt: string
  updatedAt: string
}

export interface TemplateElement {
  id: string
  type: string
  x: number
  y: number
  width: number
  height: number
  content?: string
  fontSize?: number
  fontColor?: string
  fontFamily?: string
  bold?: boolean
  italic?: boolean
  textAlign?: string
}

export interface Mask {
  _id: string
  name: string
  type: string
  isActive: boolean
  settings: Record<string, unknown>
  createdAt: string
}

export interface Signatory {
  _id: string
  firstName: string
  lastName: string
  title: string
  organization?: string
  signature?: string
  isActive: boolean
  createdAt: string
}

export interface DashboardStats {
  totalCertificates: number
  validCertificates: number
  pendingCertificates: number
  revokedCertificates: number
  totalCourses: number
  totalLearners: number
  totalSessions: number
  monthlyEvolution: { month: string; count: number }[]
}

export interface RecentActivity {
  _id: string
  action: string
  description: string
  createdAt: string
}

// Auth
export const authApi = {
  login: (data: LoginData) => api.post('/auth/login', data) as Promise<ApiResponse<{ user: User; token: string }>>,
  register: (data: RegisterData) => api.post('/auth/register', data) as Promise<ApiResponse<User>>,
  getMe: () => api.get('/auth/me') as Promise<ApiResponse<User>>,
  updateProfile: (data: Partial<User>) => api.put('/auth/profile', data) as Promise<ApiResponse<User>>,
}

// Dashboard
export const dashboardApi = {
  getStats: () => api.get('/dashboard/stats') as Promise<ApiResponse<DashboardStats>>,
  getRecentActivity: () => api.get('/dashboard/activity') as Promise<ApiResponse<RecentActivity[]>>,
}

// Courses
export const coursesApi = {
  list: (params?: Record<string, string>) => api.get('/courses', { params }) as Promise<ApiResponse<Course[]>>,
  get: (id: string) => api.get(`/courses/${id}`) as Promise<ApiResponse<Course>>,
  create: (data: Partial<Course>) => api.post('/courses', data) as Promise<ApiResponse<Course>>,
  update: (id: string, data: Partial<Course>) => api.put(`/courses/${id}`, data) as Promise<ApiResponse<Course>>,
  delete: (id: string) => api.delete(`/courses/${id}`) as Promise<ApiResponse<void>>,
}

// Sessions
export const sessionsApi = {
  list: (params?: Record<string, string>) => api.get('/sessions', { params }) as Promise<ApiResponse<Session[]>>,
  get: (id: string) => api.get(`/sessions/${id}`) as Promise<ApiResponse<Session>>,
  create: (data: Partial<Session>) => api.post('/sessions', data) as Promise<ApiResponse<Session>>,
  update: (id: string, data: Partial<Session>) => api.put(`/sessions/${id}`, data) as Promise<ApiResponse<Session>>,
  enroll: (id: string, learnerIds: string[]) => api.post(`/sessions/${id}/enroll`, { learnerIds }) as Promise<ApiResponse<void>>,
  recordAttendance: (id: string, attendance: Record<string, boolean>) => api.post(`/sessions/${id}/attendance`, { attendance }) as Promise<ApiResponse<void>>,
}

// Learners
export const learnersApi = {
  list: (params?: Record<string, string>) => api.get('/learners', { params }) as Promise<ApiResponse<Learner[]>>,
  get: (id: string) => api.get(`/learners/${id}`) as Promise<ApiResponse<Learner>>,
  create: (data: Partial<Learner>) => api.post('/learners', data) as Promise<ApiResponse<Learner>>,
  update: (id: string, data: Partial<Learner>) => api.put(`/learners/${id}`, data) as Promise<ApiResponse<Learner>>,
  delete: (id: string) => api.delete(`/learners/${id}`) as Promise<ApiResponse<void>>,
  importCsv: (formData: FormData) => api.post('/learners/import', formData, { headers: { 'Content-Type': 'multipart/form-data' } }) as Promise<ApiResponse<{ imported: number }>>,
}

// Certificates
export const certificatesApi = {
  list: (params?: Record<string, string>) => api.get('/certificates', { params }) as Promise<ApiResponse<Certificate[]>>,
  get: (id: string) => api.get(`/certificates/${id}`) as Promise<ApiResponse<Certificate>>,
  generate: (data: { learnerId: string; sessionId: string; templateId: string; issueDate: string }) => api.post('/certificates/generate', data) as Promise<ApiResponse<Certificate>>,
  batchGenerate: (data: { learnerIds: string[]; sessionId: string; templateId: string; issueDate: string }) => api.post('/certificates/batch-generate', data) as Promise<ApiResponse<Certificate[]>>,
  download: (id: string) => api.get(`/certificates/${id}/download`, { responseType: 'blob' }) as Promise<Blob>,
  revoke: (id: string, reason: string) => api.post(`/certificates/${id}/revoke`, { reason }) as Promise<ApiResponse<Certificate>>,
  replace: (id: string) => api.post(`/certificates/${id}/replace`) as Promise<ApiResponse<Certificate>>,
}

// Templates
export const templatesApi = {
  list: (params?: Record<string, string>) => api.get('/templates', { params }) as Promise<ApiResponse<Template[]>>,
  get: (id: string) => api.get(`/templates/${id}`) as Promise<ApiResponse<Template>>,
  create: (data: Partial<Template>) => api.post('/templates', data) as Promise<ApiResponse<Template>>,
  update: (id: string, data: Partial<Template>) => api.put(`/templates/${id}`, data) as Promise<ApiResponse<Template>>,
  delete: (id: string) => api.delete(`/templates/${id}`) as Promise<ApiResponse<void>>,
  duplicate: (id: string) => api.post(`/templates/${id}/duplicate`) as Promise<ApiResponse<Template>>,
}

// Masks
export const masksApi = {
  list: (params?: Record<string, string>) => api.get('/masks', { params }) as Promise<ApiResponse<Mask[]>>,
  get: (id: string) => api.get(`/masks/${id}`) as Promise<ApiResponse<Mask>>,
  create: (data: Partial<Mask>) => api.post('/masks', data) as Promise<ApiResponse<Mask>>,
  update: (id: string, data: Partial<Mask>) => api.put(`/masks/${id}`, data) as Promise<ApiResponse<Mask>>,
  delete: (id: string) => api.delete(`/masks/${id}`) as Promise<ApiResponse<void>>,
}

// Results
export const resultsApi = {
  submitGrade: (sessionId: string, data: { learnerId: string; grade: number; mention?: string }) => api.post(`/results/${sessionId}/grade`, data) as Promise<ApiResponse<void>>,
  validate: (sessionId: string) => api.post(`/results/${sessionId}/validate`) as Promise<ApiResponse<void>>,
}

// Users
export const usersApi = {
  list: (params?: Record<string, string>) => api.get('/users', { params }) as Promise<ApiResponse<User[]>>,
  get: (id: string) => api.get(`/users/${id}`) as Promise<ApiResponse<User>>,
  create: (data: Partial<User>) => api.post('/users', data) as Promise<ApiResponse<User>>,
  update: (id: string, data: Partial<User>) => api.put(`/users/${id}`, data) as Promise<ApiResponse<User>>,
  delete: (id: string) => api.delete(`/users/${id}`) as Promise<ApiResponse<void>>,
  suspend: (id: string) => api.post(`/users/${id}/suspend`) as Promise<ApiResponse<User>>,
}

// Public
export const publicApi = {
  verify: (code: string) => api.get(`/public/verify/${code}`) as Promise<ApiResponse<Certificate>>,
  verifyQr: (data: string) => api.post('/public/verify-qr', { data }) as Promise<ApiResponse<Certificate>>,
}

export default api
