import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import { ChevronDown, ChevronUp, ExternalLink, BookOpen } from 'lucide-react'
import clsx from 'clsx'

function ConfidenceBadge({ confidence }) {
  const colors = {
    high:   { bg: 'rgba(74,222,128,0.12)', text: '#4ade80', dot: '#4ade80' },
    medium: { bg: 'rgba(251,191,36,0.12)', text: '#fbbf24', dot: '#fbbf24' },
    low:    { bg: 'rgba(248,113,113,0.12)', text: '#f87171', dot: '#f87171' },
  }
  const c = colors[confidence] || colors.medium
  return (
    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium"
          style={{ background: c.bg, color: c.text }}>
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: c.dot }} />
      {confidence} confidence
    </span>
  )
}

function SourceChunk({ source }) {
  const [expanded, setExpanded] = useState(false)
  return (
    <div className="rounded-xl overflow-hidden"
         style={{ background: 'rgba(129,140,248,0.06)', border: '1px solid rgba(129,140,248,0.15)' }}>
      <button onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 px-4 py-2.5 text-left"
        style={{ color: '#a5b4fc' }}>
        <BookOpen size={13} />
        <span className="flex-1 text-xs font-medium truncate">
          {source.document_name} · Page {source.page_number}
        </span>
        <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: 'rgba(129,140,248,0.15)' }}>
          {Math.round(source.score * 100)}% match
        </span>
        {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
      </button>
      {expanded && (
        <div className="px-4 pb-3">
          <p className="text-xs leading-relaxed" style={{ color: 'var(--muted)', fontFamily: 'var(--font-mono)' }}>
            "{source.content}"
          </p>
        </div>
      )}
    </div>
  )
}

export default function MessageBubble({ message }) {
  const isUser = message.role === 'user'
  const [showSources, setShowSources] = useState(false)
  const sources = message.sources || []

  if (isUser) {
    return (
      <div className="flex justify-end animate-fade-up">
        <div className="max-w-xl px-5 py-3.5 rounded-2xl rounded-tr-sm text-sm leading-relaxed"
             style={{ background: 'linear-gradient(135deg, rgba(251,191,36,0.15), rgba(249,115,22,0.1))',
                      border: '1px solid rgba(251,191,36,0.2)', color: 'var(--text)' }}>
          {message.content}
        </div>
      </div>
    )
  }

  return (
    <div className="flex gap-3 animate-fade-up">
      {/* Avatar */}
      <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 text-sm"
           style={{ background: 'linear-gradient(135deg, #818cf8, #a78bfa)' }}>🧠</div>

      <div className="flex-1 space-y-3 min-w-0">
        {/* Main answer */}
        <div className="px-5 py-4 rounded-2xl rounded-tl-sm text-sm leading-relaxed"
             style={{ background: 'var(--surface2)', border: '1px solid var(--border)', color: 'var(--text)' }}>
          {message.loading ? (
            <div className="flex items-center gap-2" style={{ color: 'var(--muted)' }}>
              <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse-soft" style={{ animationDelay: '0ms' }} />
              <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse-soft" style={{ animationDelay: '200ms' }} />
              <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse-soft" style={{ animationDelay: '400ms' }} />
            </div>
          ) : (
            <div className="prose prose-sm prose-invert max-w-none">
              <ReactMarkdown>{message.content}</ReactMarkdown>
            </div>
          )}
        </div>

        {/* Footer: confidence + sources toggle */}
        {!message.loading && (sources.length > 0 || message.confidence) && (
          <div className="flex items-center gap-3 flex-wrap">
            {message.confidence && <ConfidenceBadge confidence={message.confidence} />}
            {sources.length > 0 && (
              <button onClick={() => setShowSources(!showSources)}
                className="inline-flex items-center gap-1.5 text-xs px-3 py-1 rounded-full transition-all"
                style={{
                  background: showSources ? 'rgba(129,140,248,0.15)' : 'rgba(255,255,255,0.05)',
                  color: showSources ? '#a5b4fc' : 'var(--muted)',
                  border: '1px solid ' + (showSources ? 'rgba(129,140,248,0.3)' : 'var(--border)')
                }}>
                <ExternalLink size={11} />
                {sources.length} source{sources.length > 1 ? 's' : ''}
                {showSources ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
              </button>
            )}
          </div>
        )}

        {/* Source chunks */}
        {showSources && sources.length > 0 && (
          <div className="space-y-2 animate-fade-up">
            {sources.map((s, i) => <SourceChunk key={i} source={s} />)}
          </div>
        )}
      </div>
    </div>
  )
}
