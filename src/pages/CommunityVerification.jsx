import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Search, MapPin, Tag, CheckCircle, X, Award, Shield, Star, Loader2 } from 'lucide-react'
import Navbar from '../components/Navbar'
import BadgeChip from '../components/BadgeChip'
import { useAuth } from '../context/AuthContext'
import { subscribeToVerificationQueue, verifyReport } from '../lib/reportsService'

function timeAgo(ts) {
  if (!ts) return ''
  const d = ts.toDate ? ts.toDate() : new Date(ts)
  const s = Math.floor((Date.now() - d.getTime()) / 1000)
  if (s < 3600) return `${Math.floor(s / 60)}m ago`
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`
  return `${Math.floor(s / 86400)}d ago`
}

const catLabel = {
  road: 'Road', lighting: 'Lighting', waste: 'Waste',
  parks: 'Parks', water: 'Water', vandalism: 'Safety',
}

const howItWorks = [
  { icon: <Search size={14} className="text-green-600" />,      text: 'Review the report and photos' },
  { icon: <CheckCircle size={14} className="text-green-600" />, text: 'Confirm or flag incorrect reports' },
  { icon: <Award size={14} className="text-green-600" />,       text: 'Earn 10 civic points per verification' },
  { icon: <CheckCircle size={14} className="text-green-600" />, text: 'Verified issues get faster resolution' },
]

export default function CommunityVerification() {
  const { user } = useAuth()
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [catFilter, setCatFilter] = useState('All')
  const [actionState, setActionState] = useState({}) // { [reportId]: 'confirm' | 'deny' | 'loading' }

  useEffect(() => {
    if (!user?.uid) return
    const unsub = subscribeToVerificationQueue(
      user.uid,
      (data) => { setReports(data); setLoading(false) },
      (_err) => { setReports([]); setLoading(false) }
    )
    return unsub
  }, [user?.uid])

  async function handleAction(reportId, action) {
    if (actionState[reportId] === 'loading') return
    setActionState((p) => ({ ...p, [reportId]: 'loading' }))
    try {
      await verifyReport(reportId, user.uid, action === 'confirm' ? 'verify' : 'flag')
      setActionState((p) => ({ ...p, [reportId]: action }))
    } catch {
      setActionState((p) => ({ ...p, [reportId]: null }))
    }
  }

  const filtered = reports.filter((r) => {
    const matchSearch = !search || r.title.toLowerCase().includes(search.toLowerCase())
    const matchCat = catFilter === 'All' || catLabel[r.category] === catFilter
    const alreadyActed = r.verifiers?.includes(user?.uid) || r.flaggers?.includes(user?.uid)
    return matchSearch && matchCat && !alreadyActed
  })

  const myVerifications = reports.filter((r) => r.verifiers?.includes(user?.uid))
  const totalPoints = (myVerifications.length * 10) + (user?.profile?.points || 0)

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-6 flex-wrap gap-4">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Community Verification</h1>
            <p className="text-sm text-gray-500 mt-0.5">Confirm real issues, earn points, and help your city</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl px-4 py-2">
              <Award size={16} className="text-green-600" />
              <span className="text-sm font-bold text-green-700">{totalPoints} Points</span>
            </div>
            <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2">
              <CheckCircle size={16} className="text-gray-500" />
              <span className="text-sm font-semibold text-gray-700">{myVerifications.length} Verified</span>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main */}
          <div className="lg:col-span-2">
            {/* Filters */}
            <div className="flex items-center gap-3 mb-5 flex-wrap">
              <div className="relative flex-1 min-w-48">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  type="text"
                  placeholder="Search issues to verify..."
                  className="w-full pl-8 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div className="flex gap-2 flex-wrap">
                {['All', 'Road', 'Lighting', 'Waste', 'Parks', 'Water', 'Safety'].map((c) => (
                  <button
                    key={c}
                    onClick={() => setCatFilter(c)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors border ${
                      catFilter === c ? 'bg-green-600 text-white border-green-600' : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            {/* Needs Verification count */}
            {filtered.length > 0 && (
              <p className="text-sm text-gray-500 mb-4">
                <span className="font-semibold text-red-500">{filtered.length}</span> issue{filtered.length !== 1 ? 's' : ''} need your verification
              </p>
            )}

            {/* Issue List */}
            {loading ? (
              <div className="flex items-center justify-center py-24">
                <Loader2 size={28} className="text-green-600 animate-spin" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-20">
                <CheckCircle size={40} className="mx-auto text-green-400 mb-4" />
                <p className="font-semibold text-gray-700">All caught up!</p>
                <p className="text-sm text-gray-400 mt-1">No issues need verification right now. Check back soon.</p>
              </div>
            ) : (
              <div className="space-y-5">
                {filtered.map((issue) => {
                  const pct = Math.min(100, Math.round(((issue.verifiedCount || 0) / 30) * 100))
                  const state = actionState[issue.id]

                  return (
                    <div key={issue.id} className="border border-gray-200 rounded-2xl overflow-hidden">
                      <div className="grid md:grid-cols-2">
                        {/* Info */}
                        <div className="p-5">
                          <div className="flex items-start justify-between mb-2">
                            <Link to={`/issue/${issue.id}`} className="font-semibold text-gray-900 text-sm pr-2 hover:text-green-600 transition-colors">
                              {issue.title}
                            </Link>
                            <BadgeChip label={issue.status} variant={issue.status} />
                          </div>
                          <div className="flex items-center gap-3 text-xs text-gray-500 mb-3">
                            <span className="flex items-center gap-1"><MapPin size={10} /> {issue.address?.split(',')[0] || issue.city || '—'}</span>
                            <span className="flex items-center gap-1"><Tag size={10} /> {catLabel[issue.category] || issue.category}</span>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-gray-400 mb-3">
                            <span>By {issue.userDisplayName || 'Anonymous'}</span>
                            <span>{timeAgo(issue.createdAt)}</span>
                          </div>

                          {/* Progress */}
                          <div className="mb-4">
                            <div className="flex justify-between text-xs text-gray-500 mb-1">
                              <span>{issue.verifiedCount || 0}/30 verified</span>
                              <span className={`font-semibold ${pct >= 50 ? 'text-green-600' : 'text-gray-400'}`}>{pct}%</span>
                            </div>
                            <div className="w-full bg-gray-100 rounded-full h-1.5">
                              <div className="bg-green-500 h-1.5 rounded-full transition-all" style={{ width: `${pct}%` }} />
                            </div>
                          </div>

                          {/* AI score badge */}
                          {issue.aiScore && (
                            <div className="mb-3">
                              <span className="bg-green-50 text-green-700 text-xs px-2.5 py-1 rounded-full">
                                AI Score: {issue.aiScore}/100 · {issue.severity}
                              </span>
                            </div>
                          )}

                          {/* Action Buttons */}
                          {state === 'loading' ? (
                            <div className="flex items-center gap-2 text-sm text-gray-400">
                              <Loader2 size={14} className="animate-spin" /> Processing…
                            </div>
                          ) : state ? (
                            <div className={`flex items-center gap-2 text-sm font-semibold ${state === 'confirm' ? 'text-green-600' : 'text-gray-500'}`}>
                              {state === 'confirm' ? <CheckCircle size={16} /> : <X size={16} />}
                              {state === 'confirm' ? 'Confirmed! +10 pts' : 'Flagged as incorrect'}
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleAction(issue.id, 'confirm')}
                                className="flex-1 bg-green-600 hover:bg-green-700 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors flex items-center justify-center gap-1.5"
                              >
                                <CheckCircle size={12} /> Confirm Issue
                              </button>
                              <button
                                onClick={() => handleAction(issue.id, 'deny')}
                                className="flex-1 border border-gray-200 hover:bg-gray-50 text-gray-600 text-xs font-semibold px-4 py-2 rounded-lg transition-colors flex items-center justify-center gap-1.5"
                              >
                                <X size={12} /> Can't Confirm
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Image */}
                        <div className="relative bg-gray-100">
                          {issue.imageUrls?.[0] ? (
                            <img src={issue.imageUrls[0]} alt={issue.title} className="w-full h-48 md:h-full object-cover" />
                          ) : (
                            <div className="w-full h-48 md:h-full flex items-center justify-center text-gray-300">
                              <MapPin size={36} />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-5">
            {/* How It Works */}
            <div className="bg-white border border-gray-200 rounded-xl p-5">
              <h3 className="font-bold text-gray-900 mb-4">How Verification Works</h3>
              <div className="space-y-3">
                {howItWorks.map(({ icon, text }) => (
                  <div key={text} className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-green-50 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">{icon}</div>
                    <p className="text-sm text-gray-600">{text}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* My Badges */}
            <div className="bg-white border border-gray-200 rounded-xl p-5">
              <h3 className="font-bold text-gray-900 mb-4">My Badges</h3>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { icon: <Shield size={20} className={myVerifications.length >= 1 ? 'text-green-600' : 'text-gray-300'} />, label: 'Verifier',     earned: myVerifications.length >= 1 },
                  { icon: <Star size={20} className={myVerifications.length >= 10 ? 'text-yellow-500' : 'text-gray-300'} />, label: 'Top 10%',     earned: myVerifications.length >= 10 },
                  { icon: <Award size={20} className={myVerifications.length >= 100 ? 'text-orange-500' : 'text-gray-300'} />, label: '100 Club',   earned: myVerifications.length >= 100 },
                  { icon: <CheckCircle size={20} className={myVerifications.length >= 5 ? 'text-blue-500' : 'text-gray-300'} />, label: 'Rapid Rep', earned: myVerifications.length >= 5 },
                  { icon: <MapPin size={20} className={myVerifications.length >= 20 ? 'text-red-500' : 'text-gray-300'} />,    label: 'Local Hero', earned: myVerifications.length >= 20 },
                  { icon: <Award size={20} className={myVerifications.length >= 50 ? 'text-purple-600' : 'text-gray-300'} />,  label: 'Champion',   earned: myVerifications.length >= 50 },
                ].map(({ icon, label, earned }) => (
                  <div key={label} className={`flex flex-col items-center gap-1.5 p-3 rounded-xl ${earned ? 'bg-gray-50' : 'opacity-40'}`}>
                    {icon}
                    <span className="text-xs text-gray-600 text-center font-medium">{label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* My verifications count */}
            <div className="bg-green-50 border border-green-200 rounded-xl p-5 text-center">
              <p className="text-3xl font-extrabold text-green-700">{myVerifications.length}</p>
              <p className="text-sm text-green-600 font-medium mt-1">Your Verifications</p>
              <p className="text-xs text-green-500 mt-1">{myVerifications.length * 10} points earned from verifications</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}