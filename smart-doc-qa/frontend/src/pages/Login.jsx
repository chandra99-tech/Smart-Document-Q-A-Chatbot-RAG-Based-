import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export default function Login() {
  const { login, register } = useAuth()
  const navigate = useNavigate()
  const [mode, setMode] = useState('login') // 'login' | 'register'
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      if (mode === 'login') {
        await login(form.email, form.password)
      } else {
        await register(form.name, form.email, form.password)
      }
      navigate('/')
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden"
         style={{ background: 'radial-gradient(ellipse at 20% 50%, #1a1a3e 0%, #07071a 60%)' }}>
      {/* Background orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full opacity-10"
           style={{ background: 'radial-gradient(circle, #818cf8, transparent)', filter: 'blur(80px)' }} />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full opacity-10"
           style={{ background: 'radial-gradient(circle, #fbbf24, transparent)', filter: 'blur(80px)' }} />

      <div className="relative z-10 w-full max-w-md px-6">
        {/* Logo */}
        <div className="text-center mb-10 animate-fade-up">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                 style={{ background: 'linear-gradient(135deg, #fbbf24, #f97316)' }}>
              <span className="text-lg">🧠</span>
            </div>
            <span className="font-display text-2xl font-bold text-white tracking-tight">DocMind</span>
          </div>
          <p className="text-sm" style={{ color: 'var(--muted)' }}>
            Intelligent document understanding
          </p>
        </div>

        {/* Card */}
        <div className="glass rounded-2xl p-8 animate-fade-up" style={{ animationDelay: '0.1s' }}>
          {/* Tabs */}
          <div className="flex rounded-xl p-1 mb-8" style={{ background: 'rgba(255,255,255,0.05)' }}>
            {['login', 'register'].map(m => (
              <button key={m} onClick={() => setMode(m)}
                className="flex-1 py-2 rounded-lg text-sm font-medium font-display transition-all capitalize"
                style={{
                  background: mode === m ? 'rgba(255,255,255,0.1)' : 'transparent',
                  color: mode === m ? 'var(--text)' : 'var(--muted)',
                }}>
                {m}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <div>
                <label className="block text-xs font-medium mb-2" style={{ color: 'var(--muted)' }}>
                  FULL NAME
                </label>
                <input
                  type="text" required value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all"
                  style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border)', color: 'var(--text)' }}
                  placeholder="Ada Lovelace"
                />
              </div>
            )}
            <div>
              <label className="block text-xs font-medium mb-2" style={{ color: 'var(--muted)' }}>EMAIL</label>
              <input
                type="email" required value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border)', color: 'var(--text)' }}
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-2" style={{ color: 'var(--muted)' }}>PASSWORD</label>
              <input
                type="password" required value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border)', color: 'var(--text)' }}
                placeholder="••••••••"
              />
            </div>

            {error && (
              <div className="text-sm px-4 py-3 rounded-xl"
                   style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#fca5a5' }}>
                {error}
              </div>
            )}

            <button type="submit" disabled={loading}
              className="w-full py-3 rounded-xl font-display font-semibold text-sm transition-all mt-2"
              style={{
                background: loading ? 'rgba(251,191,36,0.5)' : 'linear-gradient(135deg, #fbbf24, #f97316)',
                color: '#0d0d28',
                cursor: loading ? 'not-allowed' : 'pointer',
              }}>
              {loading ? 'Please wait...' : mode === 'login' ? 'Sign In' : 'Create Account'}
            </button>
          </form>
        </div>

        <p className="text-center text-xs mt-6" style={{ color: 'var(--muted)' }}>
          Powered by DeepSeek · RAG · FAISS
        </p>
      </div>
    </div>
  )
}
