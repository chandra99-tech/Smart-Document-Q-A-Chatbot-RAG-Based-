import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import {
  MessageSquare, FileText, BarChart2, Plus, Trash2,
  LogOut, ChevronRight, Loader2
} from 'lucide-react'

export default function Sidebar({
  sessions, currentSession, onNewChat, onSelectSession, onDeleteSession,
  documents, selectedDocIds, onToggleDoc, loadingDocs
}) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [docExpanded, setDocExpanded] = useState(true)

  return (
    <aside className="flex flex-col h-full w-64 flex-shrink-0"
           style={{ borderRight: '1px solid var(--border)', background: 'var(--surface)' }}>
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5"
           style={{ borderBottom: '1px solid var(--border)' }}>
        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-base"
             style={{ background: 'linear-gradient(135deg, #fbbf24, #f97316)' }}>🧠</div>
        <span className="font-display font-bold text-base tracking-tight" style={{ color: 'var(--text)' }}>
          DocMind
        </span>
      </div>

      {/* Nav */}
      <nav className="px-3 py-3 space-y-1" style={{ borderBottom: '1px solid var(--border)' }}>
        {[
          { icon: MessageSquare, label: 'Chat', path: '/' },
          { icon: BarChart2, label: 'Analytics', path: '/analytics' },
        ].map(({ icon: Icon, label, path }) => (
          <button key={path} onClick={() => navigate(path)}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all"
            style={{
              background: location.pathname === path ? 'rgba(251,191,36,0.1)' : 'transparent',
              color: location.pathname === path ? '#fbbf24' : 'var(--muted)',
            }}>
            <Icon size={16} />
            {label}
          </button>
        ))}
      </nav>

      {/* New Chat */}
      <div className="px-3 py-3">
        <button onClick={onNewChat}
          className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium transition-all"
          style={{ background: 'rgba(251,191,36,0.08)', color: '#fbbf24', border: '1px solid rgba(251,191,36,0.2)' }}>
          <Plus size={14} />
          New Chat
        </button>
      </div>

      {/* Documents */}
      <div className="px-3 pb-2">
        <button onClick={() => setDocExpanded(!docExpanded)}
          className="w-full flex items-center justify-between px-2 py-1.5 text-xs font-semibold uppercase tracking-widest rounded"
          style={{ color: 'var(--muted)' }}>
          <span className="flex items-center gap-1.5">
            <FileText size={11} /> Documents
          </span>
          <ChevronRight size={11} style={{ transform: docExpanded ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }} />
        </button>

        {docExpanded && (
          <div className="mt-1 space-y-1 max-h-40 overflow-y-auto">
            {loadingDocs ? (
              <div className="flex items-center gap-2 px-2 py-2 text-xs" style={{ color: 'var(--muted)' }}>
                <Loader2 size={12} className="animate-spin" /> Loading…
              </div>
            ) : documents.length === 0 ? (
              <p className="px-2 py-2 text-xs" style={{ color: 'var(--muted)' }}>No documents yet</p>
            ) : documents.map(doc => (
              <label key={doc.id}
                className="flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer transition-all text-xs"
                style={{
                  background: selectedDocIds.includes(doc.id) ? 'rgba(129,140,248,0.1)' : 'transparent',
                  color: selectedDocIds.includes(doc.id) ? '#a5b4fc' : 'var(--muted)',
                }}>
                <input type="checkbox" className="w-3 h-3 accent-indigo-400"
                  checked={selectedDocIds.includes(doc.id)}
                  onChange={() => onToggleDoc(doc.id)} />
                <span className="truncate flex-1">{doc.filename}</span>
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Sessions */}
      <div className="flex-1 overflow-y-auto px-3 py-2">
        <p className="px-2 py-1.5 text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--muted)' }}>
          Recent Chats
        </p>
        <div className="space-y-1 mt-1">
          {sessions.map(s => (
            <div key={s.id}
              className="group flex items-center gap-2 px-3 py-2.5 rounded-xl cursor-pointer transition-all text-xs"
              onClick={() => onSelectSession(s.id)}
              style={{
                background: currentSession === s.id ? 'rgba(255,255,255,0.07)' : 'transparent',
                color: currentSession === s.id ? 'var(--text)' : 'var(--muted)',
              }}>
              <MessageSquare size={12} className="flex-shrink-0" />
              <span className="flex-1 truncate">{s.title || 'New conversation'}</span>
              <button onClick={e => { e.stopPropagation(); onDeleteSession(s.id) }}
                className="opacity-0 group-hover:opacity-100 p-0.5 rounded transition-opacity hover:text-red-400">
                <Trash2 size={11} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* User */}
      <div className="px-3 py-4" style={{ borderTop: '1px solid var(--border)' }}>
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl"
             style={{ background: 'rgba(255,255,255,0.04)' }}>
          <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
               style={{ background: 'linear-gradient(135deg, #818cf8, #a78bfa)', color: 'white' }}>
            {user?.name?.[0]?.toUpperCase() || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium truncate" style={{ color: 'var(--text)' }}>{user?.name}</p>
            <p className="text-xs truncate" style={{ color: 'var(--muted)', fontSize: '10px' }}>{user?.email}</p>
          </div>
          <button onClick={logout} className="p-1 rounded-lg transition-colors hover:text-red-400"
                  style={{ color: 'var(--muted)' }}>
            <LogOut size={13} />
          </button>
        </div>
      </div>
    </aside>
  )
}
