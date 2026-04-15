import { useState, useEffect, useCallback } from 'react'
import Sidebar from '../components/Sidebar'
import ChatWindow from '../components/ChatWindow'
import { getDocuments, getSessions, deleteSession } from '../services/api'

export default function Dashboard() {
  const [sessions, setSessions] = useState([])
  const [currentSession, setCurrentSession] = useState(null)
  const [documents, setDocuments] = useState([])
  const [selectedDocIds, setSelectedDocIds] = useState([])
  const [loadingDocs, setLoadingDocs] = useState(false)

  const refreshDocs = useCallback(async () => {
    setLoadingDocs(true)
    try {
      const { data } = await getDocuments()
      setDocuments(data)
    } catch { /* ignore */ }
    finally { setLoadingDocs(false) }
  }, [])

  const refreshSessions = useCallback(async () => {
    try {
      const { data } = await getSessions()
      setSessions(data)
    } catch { /* ignore */ }
  }, [])

  useEffect(() => {
    refreshDocs()
    refreshSessions()
  }, [refreshDocs, refreshSessions])

  const handleNewChat = () => setCurrentSession(null)

  const handleSessionCreated = (sid, title) => {
    setSessions(prev => [{ id: sid, title: title.slice(0, 40) }, ...prev])
    setCurrentSession(sid)
  }

  const handleDeleteSession = async (sid) => {
    try { await deleteSession(sid) } catch { /* ignore */ }
    setSessions(prev => prev.filter(s => s.id !== sid))
    if (currentSession === sid) setCurrentSession(null)
  }

  const handleToggleDoc = (id) => {
    setSelectedDocIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
  }

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--bg)' }}>
      <Sidebar
        sessions={sessions}
        currentSession={currentSession}
        onNewChat={handleNewChat}
        onSelectSession={setCurrentSession}
        onDeleteSession={handleDeleteSession}
        documents={documents}
        selectedDocIds={selectedDocIds}
        onToggleDoc={handleToggleDoc}
        loadingDocs={loadingDocs}
      />
      <main className="flex-1 overflow-hidden">
        <ChatWindow
          sessionId={currentSession}
          onSessionCreated={handleSessionCreated}
          selectedDocIds={selectedDocIds}
          onRefreshDocs={refreshDocs}
        />
      </main>
    </div>
  )
}
