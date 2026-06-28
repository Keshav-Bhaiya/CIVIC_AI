import { useEffect, useState, useRef } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  AlertTriangle, Clock, Users, Building2, CheckCircle,
  Send, Share2, Map, Loader2, Cpu,
} from 'lucide-react'
import Navbar from '../components/Navbar'
import { getReport } from '../lib/reportsService'

const categoryLabel = {
  road:      'Road & Potholes',
  lighting:  'Street Lighting',
  waste:     'Waste & Sanitation',
  parks:     'Parks & Green Spaces',
  water:     'Water & Drainage',
  vandalism: 'Vandalism & Safety',
}

export default function Analysis() {
  const { id }    = useParams()
  const navigate  = useNavigate()

  const [report,  setReport]  = useState(null)
  const [loading, setLoading] = useState(true)
  const [aiReady, setAiReady] = useState(false)
  const [fetchErr,setFetchErr]= useState('')

  // BUG FIX: Use a ref to prevent setState after unmount when setTimeout fires
  const mountedRef = useRef(true)
  useEffect(() => {
    mountedRef.current = true
    return () => { mountedRef.current = false }
  }, [])

  useEffect(() => {
    let attempts = 0
    const MAX      = 12
    const INTERVAL = 2000

    async function poll() {
      try {
        const r = await getReport(id)
        if (!mountedRef.current) return
        if (!r) {
          setFetchErr('Report not found.')
          setLoading(false)
          return
        }
        setReport(r)
        setLoading(false)
        if (r.aiScore !== null && r.aiScore !== undefined) {
          setAiReady(true)
          return
        }
        attempts++
        if (attempts < MAX && mountedRef.current) {
          setTimeout(poll, INTERVAL)
        }
      } catch (err) {
        if (mountedRef.current) {
          setFetchErr(err.message)
          setLoading(false)
        }
      }
    }

    poll()
    // No cleanup needed: setTimeout is guarded by mountedRef
  }, [id])

  // ── Loading state ──────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center flex-col gap-4">
          <div className="w-14 h-14 bg-green-50 rounded-2xl flex items-center justify-center">
            <Cpu size={28} className="text-green-600 animate-pulse" />
          </div>
          <p className="text-gray-700 font-semibold">Loading your report…</p>
        </div>
      </div>
    )
  }

  // ── Error / not found ──────────────────────────────────────────────────────
  if (fetchErr || !report) {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center flex-col gap-4">
          <p className="text-gray-500">{fetchErr || 'Report not found.'}</p>
          <Link to="/dashboard" className="text-green-600 font-medium hover:underline">← Back to Dashboard</Link>
        </div>
      </div>
    )
  }

  // ── Derived values ─────────────────────────────────────────────────────────
  const score      = report.aiScore   ?? null
  const summary    = report.aiSummary ?? null
  const tags       = report.aiTags    ?? []
  const confidence = score !== null ? Math.min(99, score + 7) : null

  const whatNext = [
    {
      icon: <Send size={20} className="text-white" />,
      bg:    'bg-green-600',
      title: 'Report Submitted',
      desc:  `Saved and forwarded to ${report.aiDepartment || 'the relevant department'}.`,
      done:  true,
    },
    {
      icon: <Users size={20} className={aiReady ? 'text-white' : 'text-gray-400'} />,
      bg:    aiReady ? 'bg-blue-500' : 'bg-gray-100',
      title: 'Community Verification',
      desc:  'Neighbours can now confirm and upvote this issue.',
      done:  aiReady,
    },
    {
      icon: <Building2 size={20} className="text-gray-400" />,
      bg:    'bg-gray-100',
      title: 'Scheduled for Repair',
      desc:  'A technician will be assigned after community verification.',
      done:  false,
    },
  ]

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">

        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
          <Link to="/dashboard" className="hover:text-gray-700">Dashboard</Link>
          <span>›</span>
          <Link to="/report-issue" className="hover:text-gray-700">Report Issue</Link>
          <span>›</span>
          <span className="text-gray-900 font-medium">AI Analysis</span>
        </div>

        {/* Header Banner */}
        <div className="bg-green-600 rounded-2xl p-6 flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <CheckCircle size={24} className="text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">
                {aiReady ? 'AI Analysis Complete' : 'Report Submitted!'}
              </h1>
              <p className="text-green-100 text-sm">
                {aiReady
                  ? `Processed · Report #CIV-${id.slice(0, 8).toUpperCase()}`
                  : `AI analysis running… · #CIV-${id.slice(0, 8).toUpperCase()}`}
              </p>
            </div>
          </div>
          {score !== null ? (
            <div className="text-right">
              <p className="text-4xl font-extrabold text-white">
                {score}<span className="text-lg font-medium text-green-200">/100</span>
              </p>
              <p className="text-green-100 text-xs">Severity Score</p>
            </div>
          ) : (
            <Loader2 size={32} className="text-white/70 animate-spin" />
          )}
        </div>

        {/* AI Summary */}
        {summary ? (
          <div className="bg-green-50 border border-green-200 rounded-xl p-5 mb-6 flex gap-4">
            <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <CheckCircle size={14} className="text-white" />
            </div>
            <div>
              <p className="font-semibold text-gray-900 mb-1">AI Summary</p>
              <p className="text-sm text-gray-600 leading-relaxed">{summary}</p>
            </div>
          </div>
        ) : (
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 mb-6 flex gap-4 items-center">
            <Loader2 size={20} className="text-green-600 animate-spin flex-shrink-0" />
            <p className="text-sm text-gray-600">AI is analysing your report. This usually takes a few seconds…</p>
          </div>
        )}

        {/* Metadata Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-5 mb-6">
          {[
            { icon: <AlertTriangle size={14} className="text-yellow-500" />, label: 'Issue Type',       value: categoryLabel[report.category] || report.category },
            { icon: <CheckCircle size={14} className="text-red-500" />,     label: 'Severity',         value: `${report.severity} (${score ?? '…'}/100)` },
            { icon: <Clock size={14} className="text-blue-500" />,          label: 'Est. Repair Time', value: report.aiEstRepairDays ? `${report.aiEstRepairDays} days` : '…' },
            { icon: <Map size={14} className="text-green-600" />,           label: 'Location',         value: report.city || report.address?.split(',')[0] || '—' },
            { icon: <Users size={14} className="text-orange-500" />,        label: 'Status',           value: 'Open — Awaiting verification' },
            { icon: <Building2 size={14} className="text-gray-500" />,      label: 'Department',       value: report.aiDepartment || '…' },
          ].map(({ icon, label, value }) => (
            <div key={label} className="bg-gray-50 rounded-xl p-4">
              <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-1">{icon} {label}</div>
              <p className="font-semibold text-gray-900 text-sm">{value}</p>
            </div>
          ))}
        </div>

        {/* Confidence Bar */}
        {confidence !== null && (
          <div className="bg-white border border-gray-200 rounded-xl p-5 mb-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-semibold text-gray-900">AI Confidence Level</p>
              <span className="text-sm font-bold text-green-600">{confidence}%</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2">
              <div className="bg-green-500 h-2 rounded-full transition-all" style={{ width: `${confidence}%` }} />
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {tags.map((tag) => (
                  <span key={tag} className="bg-gray-100 text-gray-600 text-xs px-3 py-1 rounded-full">{tag}</span>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Photos */}
        {report.imageUrls?.length > 0 && (
          <div className="mb-8">
            <h2 className="font-bold text-gray-900 mb-4">Submitted Photos</h2>
            <div className="grid grid-cols-2 gap-3">
              {report.imageUrls.map((url, i) => (
                <img key={i} src={url} alt="Issue" className="w-full h-48 object-cover rounded-xl border border-gray-200" />
              ))}
            </div>
          </div>
        )}

        {/* What Happens Next */}
        <div className="mb-8">
          <h2 className="font-bold text-gray-900 mb-5">What Happens Next?</h2>
          <div className="grid md:grid-cols-3 gap-4">
            {whatNext.map(({ icon, bg, title, desc, done }) => (
              <div key={title} className={`rounded-xl p-5 border ${done ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-white'}`}>
                <div className={`w-10 h-10 ${bg} rounded-xl flex items-center justify-center mb-3`}>{icon}</div>
                <h3 className="font-semibold text-gray-900 text-sm mb-1">{title}</h3>
                <p className="text-xs text-gray-500 leading-relaxed">{desc}</p>
                {done && (
                  <div className="flex items-center gap-1.5 mt-3">
                    <CheckCircle size={13} className="text-green-600" />
                    <span className="text-xs text-green-600 font-semibold">Done</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
          <button
            onClick={() => {
              if (navigator.share) {
                navigator.share({ title: report.title, url: window.location.href })
              } else {
                navigator.clipboard.writeText(window.location.href)
                  .then(() => alert('Link copied!'))
                  .catch(() => {})
              }
            }}
            className="flex items-center gap-2 text-sm text-gray-600 border border-gray-200 px-4 py-2.5 rounded-xl hover:bg-gray-50 transition-colors"
          >
            <Share2 size={14} /> Share Report
          </button>
          <button
            onClick={() => navigate(`/issue/${id}`)}
            className="bg-green-600 hover:bg-green-700 text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition-colors"
          >
            View Full Issue →
          </button>
        </div>
      </div>
    </div>
  )
}