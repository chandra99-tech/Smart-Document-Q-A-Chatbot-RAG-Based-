import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, X, CheckCircle, Loader2, FileText, AlertCircle } from 'lucide-react'
import { uploadDocument } from '../services/api'

const ACCEPTED = {
  'application/pdf': ['.pdf'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx'],
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
  'text/plain': ['.txt'],
  'image/*': ['.png', '.jpg', '.jpeg'],
}

function FileItem({ file, onRemove }) {
  const [progress, setProgress] = useState(0)
  const [status, setStatus] = useState('pending') // pending | uploading | done | error
  const [error, setError] = useState('')

  const upload = useCallback(async () => {
    setStatus('uploading')
    try {
      await uploadDocument(file, p => setProgress(p))
      setStatus('done')
    } catch (err) {
      setStatus('error')
      setError(err.response?.data?.message || 'Upload failed')
    }
  }, [file])

  // Auto-upload on mount
  useState(() => { upload() }, [])

  return (
    <div className="flex items-center gap-3 px-4 py-3 rounded-xl"
         style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)' }}>
      <FileText size={16} style={{ color: 'var(--muted)', flexShrink: 0 }} />
      <div className="flex-1 min-w-0">
        <p className="text-sm truncate" style={{ color: 'var(--text)' }}>{file.name}</p>
        {status === 'uploading' && (
          <div className="mt-1.5 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.1)' }}>
            <div className="h-full rounded-full transition-all"
                 style={{ width: `${progress}%`, background: 'linear-gradient(90deg, #fbbf24, #f97316)' }} />
          </div>
        )}
        {status === 'error' && (
          <p className="text-xs mt-0.5" style={{ color: '#f87171' }}>{error}</p>
        )}
      </div>
      {status === 'uploading' && <Loader2 size={14} className="animate-spin flex-shrink-0" style={{ color: '#fbbf24' }} />}
      {status === 'done' && <CheckCircle size={14} className="flex-shrink-0" style={{ color: '#4ade80' }} />}
      {status === 'error' && <AlertCircle size={14} className="flex-shrink-0" style={{ color: '#f87171' }} />}
      {status === 'pending' && (
        <button onClick={() => onRemove(file)} className="p-1 rounded-lg hover:text-red-400"
                style={{ color: 'var(--muted)' }}>
          <X size={14} />
        </button>
      )}
    </div>
  )
}

export default function DocumentUpload({ onUploadComplete }) {
  const [files, setFiles] = useState([])

  const onDrop = useCallback((accepted) => {
    setFiles(prev => [...prev, ...accepted])
    setTimeout(() => {
      onUploadComplete?.()
    }, accepted.length * 1500 + 500)
  }, [onUploadComplete])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ACCEPTED,
    maxSize: 50 * 1024 * 1024, // 50MB
  })

  return (
    <div className="space-y-4">
      <div {...getRootProps()}
        className="rounded-2xl p-8 text-center cursor-pointer transition-all"
        style={{
          border: `2px dashed ${isDragActive ? '#fbbf24' : 'rgba(255,255,255,0.12)'}`,
          background: isDragActive ? 'rgba(251,191,36,0.05)' : 'rgba(255,255,255,0.02)',
        }}>
        <input {...getInputProps()} />
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center"
               style={{ background: isDragActive ? 'rgba(251,191,36,0.15)' : 'rgba(255,255,255,0.06)' }}>
            <Upload size={20} style={{ color: isDragActive ? '#fbbf24' : 'var(--muted)' }} />
          </div>
          <div>
            <p className="text-sm font-medium" style={{ color: isDragActive ? '#fbbf24' : 'var(--text)' }}>
              {isDragActive ? 'Drop to upload' : 'Drop files here or click to browse'}
            </p>
            <p className="text-xs mt-1" style={{ color: 'var(--muted)' }}>
              PDF, DOCX, PPTX, XLSX, TXT, Images · Max 50MB
            </p>
          </div>
        </div>
      </div>

      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((f, i) => (
            <FileItem key={i} file={f} onRemove={file => setFiles(prev => prev.filter(x => x !== file))} />
          ))}
        </div>
      )}
    </div>
  )
}
