import { useState, useRef, useEffect, useCallback } from 'react'
import { Send, Paperclip, Zap } from 'lucide-react'
import MessageBubble from './MessageBubble'
import DocumentUpload from './DocumentUpload'
import { sendMessage, getChatHistory } from '../services/api'
import { v4 as uuidv4 } from 'uuid'

const SUGGESTIONS = [
  'Summarize the key points of this document',
  'What are the main conclusions?',
  'Explain the methodology used',
  'List all important dates and deadlines',
]

export default function ChatWindow({ sessionId, onSessionCreated, selectedDocIds, onRefreshDocs }) {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [showUpload, setShowUpload] = useState(false)
  const [currentSession, setCurrentSession] = useState(sessionId)
  const bottomRef = useRef(null)
  const inputRef = useRef(null)

  // Load history when session changes
  useEffect(() => {
    setCurrentSession(sessionId)
    if (sessionId) {
      getChatHistory(sessionId)
        .then(({ data }) => setMessages(data.messages || []))
        .catch(() => setMessages([]))
    } else {
      setMessages([])
    }
  }, [sessionId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const submit = useCallback(async (question) => {
    if (!question.trim() || loading) return

    const sid = currentSession || uuidv4()
    if (!currentSession) {
      setCurrentSession(sid)
      onSessionCreated?.(sid, question)
    }

    const userMsg = { id: Date.now(), role: 'user', content: question }
    const botMsg  = { id: Date.now() + 1, role: 'assistant', content: '', loading: true }

    setMessages(prev => [...prev, userMsg, botMsg])
    setInput('')
    setLoading(true)

    try {
      const { data } = await sendMessage(question, selectedDocIds, sid)
      setMessages(prev => prev.map(m => m.id === botMsg.id ? {
        ...m,
        loading: false,
        content: data.answer,
        sources: data.sources,
        confidence: data.confidence,
      } : m))
    } catch {
      setMessages(prev => prev.map(m => m.id === botMsg.id ? {
        ...m,
        loading: false,
        content: '⚠️ Something went wrong. Please try again.',
      } : m))
    } finally {
      setLoading(false)
      inputRef.current?.focus()
    }
  }, [currentSession, loading, selectedDocIds, onSessionCreated])

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      submit(input)
    }
  }

  const isEmpty = messages.length === 0

  return (
    <div className="flex flex-col h-full">
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
        {isEmpty ? (
          <div className="flex flex-col items-center justify-center h-full gap-8">
            <div className="text-center animate-fade-up">
              <div className="text-5xl mb-4">🧠</div>
              <h2 className="font-display text-2xl font-bold mb-2" style={{ color: 'var(--text)' }}>
                Ask your documents anything
              </h2>
              <p className="text-sm" style={{ color: 'var(--muted)' }}>
                Upload documents from the sidebar, then start asking questions
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 w-full max-w-lg animate-fade-up" style={{ animationDelay: '0.1s' }}>
              {SUGGESTIONS.map((s, i) => (
                <button key={i} onClick={() => submit(s)}
                  className="text-left px-4 py-3 rounded-xl text-sm transition-all"
                  style={{
                    background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)',
                    color: 'var(--muted)', animationDelay: `${i * 0.05}s`
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; e.currentTarget.style.color = 'var(--text)' }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = 'var(--muted)' }}>
                  <Zap size={12} className="inline mr-2 opacity-50" />
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map(msg => <MessageBubble key={msg.id} message={msg} />)
        )}
        <div ref={bottomRef} />
      </div>

      {/* Upload panel */}
      {showUpload && (
        <div className="px-6 pb-4 animate-fade-up">
          <DocumentUpload onUploadComplete={() => { onRefreshDocs?.(); setShowUpload(false) }} />
        </div>
      )}

      {/* Input area */}
      <div className="px-6 pb-6" style={{ borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
        {selectedDocIds.length === 0 && (
          <div className="text-xs px-3 py-2 rounded-lg mb-3 flex items-center gap-2"
               style={{ background: 'rgba(251,191,36,0.08)', color: '#fbbf24', border: '1px solid rgba(251,191,36,0.15)' }}>
            <Zap size={11} />
            Select documents from the sidebar to search within them
          </div>
        )}
        <div className="flex items-end gap-3 rounded-2xl p-3"
             style={{ background: 'var(--surface2)', border: '1px solid var(--border)' }}>
          <button onClick={() => setShowUpload(!showUpload)}
            className="p-2 rounded-xl transition-all flex-shrink-0"
            style={{
              background: showUpload ? 'rgba(251,191,36,0.15)' : 'rgba(255,255,255,0.06)',
              color: showUpload ? '#fbbf24' : 'var(--muted)'
            }}>
            <Paperclip size={16} />
          </button>

          <textarea
            ref={inputRef}
            rows={1}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Ask a question about your documents…"
            className="flex-1 bg-transparent text-sm resize-none outline-none leading-relaxed"
            style={{ color: 'var(--text)', maxHeight: '120px', overflow: 'auto' }}
          />

          <button onClick={() => submit(input)} disabled={!input.trim() || loading}
            className="p-2.5 rounded-xl flex-shrink-0 transition-all"
            style={{
              background: input.trim() && !loading ? 'linear-gradient(135deg, #fbbf24, #f97316)' : 'rgba(255,255,255,0.06)',
              color: input.trim() && !loading ? '#0d0d28' : 'var(--muted)',
              cursor: input.trim() && !loading ? 'pointer' : 'not-allowed',
            }}>
            <Send size={16} />
          </button>
        </div>
        <p className="text-center text-xs mt-3" style={{ color: 'var(--muted)', opacity: 0.5 }}>
          Powered by DeepSeek + RAG · Answers grounded in your documents
        </p>
      </div>
    </div>
  )
}
