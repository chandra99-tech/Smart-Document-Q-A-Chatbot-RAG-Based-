import axios from 'axios'

const BASE = '/api'

const api = axios.create({
  baseURL: BASE,
  headers: { 'Content-Type': 'application/json' },
})

// Attach JWT on every request
api.interceptors.request.use(cfg => {
  const token = localStorage.getItem('token')
  if (token) cfg.headers.Authorization = `Bearer ${token}`
  return cfg
})

// Auth
export const login = (email, password) =>
  api.post('/auth/login', { email, password })

export const register = (name, email, password) =>
  api.post('/auth/register', { name, email, password })

// Documents
export const uploadDocument = (file, onProgress) => {
  const form = new FormData()
  form.append('file', file)
  return api.post('/documents/upload', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: e => onProgress && onProgress(Math.round((e.loaded * 100) / e.total))
  })
}

export const getDocuments = () => api.get('/documents')

export const deleteDocument = (id) => api.delete(`/documents/${id}`)

// Chat
export const sendMessage = (question, documentIds, sessionId) =>
  api.post('/chat/ask', { question, document_ids: documentIds, session_id: sessionId })

export const getChatHistory = (sessionId) =>
  api.get(`/chat/history/${sessionId}`)

export const getSessions = () => api.get('/chat/sessions')

export const deleteSession = (sessionId) =>
  api.delete(`/chat/sessions/${sessionId}`)

// Analytics
export const getAnalytics = () => api.get('/analytics')

export default api
