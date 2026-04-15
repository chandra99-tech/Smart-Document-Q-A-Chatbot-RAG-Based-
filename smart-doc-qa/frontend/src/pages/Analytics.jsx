import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts'
import { ArrowLeft, MessageSquare, FileText, TrendingUp, Zap } from 'lucide-react'
import { getAnalytics } from '../services/api'

const COLORS = ['#fbbf24', '#818cf8', '#4ade80', '#f87171', '#34d399']

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="px-3 py-2 rounded-xl text-xs"
         style={{ background: '#1a1a3e', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--text)' }}>
      <p className="font-semibold mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }}>{p.name}: {p.value}</p>
      ))}
    </div>
  )
}

export default function Analytics() {
  const navigate = useNavigate()
  const [data, setData] = useState(null)

  useEffect(() => {
    getAnalytics()
      .then(({ data }) => setData(data))
      .catch(() => setData(getMockData()))
  }, [])

  const d = data || getMockData()

  return (
    <div className="min-h-screen p-6" style={{ background: 'var(--bg)' }}>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/')}
            className="p-2 rounded-xl transition-all"
            style={{ background: 'rgba(255,255,255,0.06)', color: 'var(--muted)' }}>
            <ArrowLeft size={16} />
          </button>
          <div>
            <h1 className="font-display text-2xl font-bold" style={{ color: 'var(--text)' }}>Analytics</h1>
            <p className="text-sm" style={{ color: 'var(--muted)' }}>Usage insights and query trends</p>
          </div>
        </div>

        {/* Stats cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { icon: MessageSquare, label: 'Total Queries', value: d.totalQueries, color: '#fbbf24' },
            { icon: FileText, label: 'Documents', value: d.totalDocuments, color: '#818cf8' },
            { icon: TrendingUp, label: 'Avg Confidence', value: d.avgConfidence + '%', color: '#4ade80' },
            { icon: Zap, label: 'Unanswered', value: d.unanswered, color: '#f87171' },
          ].map(({ icon: Icon, label, value, color }, i) => (
            <div key={i} className="glass rounded-2xl p-5 animate-fade-up"
                 style={{ animationDelay: `${i * 0.05}s` }}>
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-medium" style={{ color: 'var(--muted)' }}>{label}</p>
                <div className="w-7 h-7 rounded-lg flex items-center justify-center"
                     style={{ background: `${color}18` }}>
                  <Icon size={14} style={{ color }} />
                </div>
              </div>
              <p className="font-display text-3xl font-bold" style={{ color: 'var(--text)' }}>{value}</p>
            </div>
          ))}
        </div>

        {/* Charts row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Queries over time */}
          <div className="glass rounded-2xl p-5">
            <h3 className="font-display font-semibold text-sm mb-4" style={{ color: 'var(--text)' }}>
              Queries Over Time
            </h3>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={d.queriesOverTime}>
                <defs>
                  <linearGradient id="qGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#fbbf24" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#fbbf24" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" tick={{ fill: 'var(--muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: 'var(--muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="queries" stroke="#fbbf24" strokeWidth={2}
                      fill="url(#qGrad)" name="Queries" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Confidence distribution */}
          <div className="glass rounded-2xl p-5">
            <h3 className="font-display font-semibold text-sm mb-4" style={{ color: 'var(--text)' }}>
              Confidence Distribution
            </h3>
            <div className="flex items-center gap-6">
              <ResponsiveContainer width="50%" height={180}>
                <PieChart>
                  <Pie data={d.confidenceDist} cx="50%" cy="50%" innerRadius={50} outerRadius={75}
                       dataKey="value" paddingAngle={3}>
                    {d.confidenceDist.map((_, i) => (
                      <Cell key={i} fill={COLORS[i]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2">
                {d.confidenceDist.map((item, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ background: COLORS[i] }} />
                    <span style={{ color: 'var(--muted)' }}>{item.name}</span>
                    <span className="font-medium ml-auto" style={{ color: 'var(--text)' }}>{item.value}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Top queries */}
        <div className="glass rounded-2xl p-5">
          <h3 className="font-display font-semibold text-sm mb-4" style={{ color: 'var(--text)' }}>
            Top Questions Asked
          </h3>
          <div className="space-y-3">
            {d.topQueries.map((q, i) => (
              <div key={i} className="flex items-center gap-4">
                <span className="text-xs w-4 text-right flex-shrink-0 font-mono" style={{ color: 'var(--muted)' }}>{i + 1}</span>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm" style={{ color: 'var(--text)' }}>{q.query}</p>
                    <span className="text-xs flex-shrink-0 ml-3" style={{ color: 'var(--muted)' }}>{q.count}×</span>
                  </div>
                  <div className="h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.07)' }}>
                    <div className="h-full rounded-full"
                         style={{ width: `${(q.count / d.topQueries[0].count) * 100}%`,
                                  background: `linear-gradient(90deg, ${COLORS[i % COLORS.length]}, transparent)` }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function getMockData() {
  return {
    totalQueries: 248,
    totalDocuments: 12,
    avgConfidence: 82,
    unanswered: 18,
    queriesOverTime: Array.from({ length: 7 }, (_, i) => ({
      date: ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'][i],
      queries: Math.floor(Math.random() * 50) + 10
    })),
    confidenceDist: [
      { name: 'High', value: 65 },
      { name: 'Medium', value: 25 },
      { name: 'Low', value: 10 },
    ],
    topQueries: [
      { query: 'What are the key findings?', count: 34 },
      { query: 'Summarize the document', count: 28 },
      { query: 'What is the conclusion?', count: 21 },
      { query: 'List the recommendations', count: 17 },
      { query: 'What methodology was used?', count: 12 },
    ]
  }
}
