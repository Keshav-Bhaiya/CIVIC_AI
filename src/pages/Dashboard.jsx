import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  FileText, CheckCircle, ThumbsUp, Award, MapPin, Tag,
  BarChart2, Shield, Map, Plus, ArrowRight, Bell, Loader2,
  Clock, TrendingUp, Users, Cpu,
} from 'lucide-react'
import Navbar from '../components/Navbar'
import BadgeChip from '../components/BadgeChip'
import { useAuth } from '../context/AuthContext'
import { subscribeToReports, subscribeToUserReports } from '../lib/reportsService'

function timeAgo(ts) {
  if (!ts) return ''
  const d = ts.toDate ? ts.toDate() : new Date(ts)
  const s = Math.floor((Date.now() - d.getTime()) / 1000)
  if (s < 60) return 'just now'
  if (s < 3600) return `${Math.floor(s/60)}m ago`
  if (s < 86400) return `${Math.floor(s/3600)}h ago`
  return `${Math.floor(s/86400)}d ago`
}

const statusVariant = { open:'open', 'in-progress':'in-progress', resolved:'resolved' }

function CommunityHealthScore({ all }) {
  const total    = all.length
  const resolved = all.filter(r => r.status === 'resolved').length
  const score    = total === 0 ? 72 : Math.min(100, Math.round(40 + (resolved/Math.max(total,1))*60))
  const color    = score >= 75 ? '#16a34a' : score >= 50 ? '#eab308' : '#dc2626'
  const label    = score >= 75 ? 'Good' : score >= 50 ? 'Moderate' : 'Needs Action'
  const circumference = 2 * Math.PI * 42
  const offset   = circumference - (score/100) * circumference

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-gray-900">Community Health Score</h3>
        <Link to="/analytics" className="text-xs text-green-600 font-medium hover:underline flex items-center gap-1">View Insights <ArrowRight size={11}/></Link>
      </div>
      <div className="flex items-center gap-6">
        <div className="relative w-24 h-24 flex-shrink-0">
          <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
            <circle cx="50" cy="50" r="42" fill="none" stroke="#f3f4f6" strokeWidth="10"/>
            <circle cx="50" cy="50" r="42" fill="none" stroke={color} strokeWidth="10"
              strokeDasharray={circumference} strokeDashoffset={offset}
              strokeLinecap="round" style={{transition:'stroke-dashoffset 1s ease'}}/>
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-extrabold text-gray-900">{score}</span>
            <span className="text-xs text-gray-400">/100</span>
          </div>
        </div>
        <div>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold mb-2" style={{background:color+'20',color}}>
            {label}
          </span>
          <p className="text-xs text-gray-500 leading-relaxed">
            {score >= 75 ? "Keep it up! Your community is doing better than last month." : "Community engagement is growing. Keep reporting!"}
          </p>
          {total > 0 && <p className="text-xs text-green-600 font-medium mt-2">↑ {Math.round((resolved/total)*100)}% resolution rate</p>}
        </div>
      </div>
    </div>
  )
}

export default function Dashboard() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const displayName = user?.displayName || user?.profile?.name || 'there'
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  const [myReports, setMyReports] = useState([])
  const [allReports, setAllReports] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user?.uid) return
    // BUG FIX: Pass error callbacks so a missing Firestore composite index
    // (or any other Firestore error) never leaves loading=true indefinitely.
    const u1 = subscribeToUserReports(
      user.uid,
      (data) => { setMyReports(data); setLoading(false) },
      (_err) => { setLoading(false) }   // fail-open: show empty list
    )
    const u2 = subscribeToReports(
      (data) => setAllReports(data),
      (_err) => setAllReports([])
    )
    return () => { u1(); u2() }
  }, [user?.uid])

  const totalReports  = myReports.length
  const resolved      = myReports.filter(r => r.status === 'resolved').length
  const totalVotes    = myReports.reduce((s,r) => s+(r.votes||0), 0)
  const points        = totalVotes * 10 + totalReports * 20

  // Recent issues from ALL (community feed)
  const recentAll = allReports.slice(0,4)

  const quickActions = [
    { icon: <FileText size={16} className="text-green-600" />, bg:'bg-green-50', label: 'Report Issue',    to: '/report-issue' },
    { icon: <Shield size={16} className="text-blue-600" />,    bg:'bg-blue-50',  label: 'Verify Issues',   to: '/community-verification' },
    { icon: <Map size={16} className="text-orange-500" />,     bg:'bg-orange-50',label: 'View Map',        to: '/map' },
    { icon: <Users size={16} className="text-purple-600" />,   bg:'bg-purple-50',label: 'Invite Friends',  to: '/community-verification' },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            {user?.photoURL ? (
              <img src={user.photoURL} alt={displayName} className="w-12 h-12 rounded-full object-cover" />
            ) : (
              <div className="w-12 h-12 rounded-full bg-green-600 flex items-center justify-center flex-shrink-0">
                <span className="text-white font-bold text-sm">{displayName.split(' ').map(n=>n[0]).join('').toUpperCase().slice(0,2)}</span>
              </div>
            )}
            <div>
              <h1 className="text-xl font-bold text-gray-900">{greeting}, {displayName.split(' ')[0]}! 👋</h1>
              <p className="text-sm text-gray-500">Let's make our community better today.</p>
            </div>
          </div>
          <button onClick={() => navigate('/report-issue')}
            className="bg-green-600 hover:bg-green-700 text-white font-semibold px-5 py-2.5 rounded-xl text-sm flex items-center gap-2 transition-colors">
            <Plus size={16}/> Report New Issue
          </button>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { icon:<FileText size={16}/>,    label:'Open Issues',        value: myReports.filter(r=>r.status==='open').length,        color:'text-red-600 bg-red-50' },
            { icon:<Clock size={16}/>,       label:'In Progress',        value: myReports.filter(r=>r.status==='in-progress').length,  color:'text-blue-600 bg-blue-50' },
            { icon:<CheckCircle size={16}/>, label:'Resolved',           value: resolved,                                              color:'text-green-600 bg-green-50' },
            { icon:<Award size={16}/>,       label:'Total Points',       value: `${points.toLocaleString()}`,                          color:'text-yellow-600 bg-yellow-50' },
          ].map(({ icon, label, value, color }) => (
            <div key={label} className="bg-white border border-gray-200 rounded-xl p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-gray-500">{label}</span>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${color}`}>{icon}</div>
              </div>
              {loading ? (
                <div className="w-12 h-7 bg-gray-100 rounded animate-pulse" />
              ) : (
                <span className="text-2xl font-bold text-gray-900">{value}</span>
              )}
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main: Recent Issues */}
          <div className="lg:col-span-2 space-y-5">

            {/* Community Health Score */}
            <CommunityHealthScore all={allReports} />

            {/* Recent Issues */}
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <div className="flex items-center justify-between mb-5">
                <h2 className="font-bold text-gray-900">Recent Issues</h2>
                <Link to="/community-verification" className="text-sm text-green-600 font-medium hover:underline flex items-center gap-1">
                  View all <ArrowRight size={14}/>
                </Link>
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-16 text-gray-400">
                  <Loader2 size={24} className="animate-spin"/>
                </div>
              ) : allReports.length === 0 ? (
                <div className="text-center py-16">
                  <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <FileText size={24} className="text-gray-400"/>
                  </div>
                  <p className="text-gray-500 mb-3">No issues reported yet</p>
                  <button onClick={() => navigate('/report-issue')}
                    className="bg-green-600 hover:bg-green-700 text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition-colors">
                    Report First Issue
                  </button>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {recentAll.map(report => (
                    <Link key={report.id} to={`/issue/${report.id}`}
                      className="flex items-start gap-4 py-4 hover:bg-gray-50 -mx-2 px-2 rounded-lg transition-colors">
                      {report.imageUrls?.[0] ? (
                        <img src={report.imageUrls[0]} alt="Issue" className="w-12 h-10 object-cover rounded-lg flex-shrink-0" />
                      ) : (
                        <div className="w-12 h-10 bg-gray-100 rounded-lg flex-shrink-0 flex items-center justify-center">
                          <MapPin size={14} className="text-gray-400"/>
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="font-semibold text-gray-900 text-sm truncate max-w-xs">{report.title}</span>
                          <BadgeChip label={report.status} variant={statusVariant[report.status]||'open'} />
                        </div>
                        <div className="flex items-center gap-3 text-xs text-gray-500">
                          <span className="flex items-center gap-1"><MapPin size={10}/> {report.address?.split(',')[0]||report.city||'—'}</span>
                          <span className="flex items-center gap-1"><Tag size={10}/> {report.category}</span>
                          <span>{timeAgo(report.createdAt)}</span>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className="flex items-center gap-1 text-xs text-gray-400">
                          <ThumbsUp size={10}/> {report.votes||0}
                        </div>
                        {report.aiScore && (
                          <p className="text-xs text-green-600 font-semibold mt-1">{report.aiScore}%</p>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* My Reports */}
            {myReports.length > 0 && (
              <div className="bg-white border border-gray-200 rounded-xl p-6">
                <div className="flex items-center justify-between mb-5">
                  <h2 className="font-bold text-gray-900">My Reports</h2>
                  <span className="text-sm text-gray-400">{totalReports} total</span>
                </div>
                <div className="divide-y divide-gray-100">
                  {myReports.slice(0,4).map(report => (
                    <Link key={report.id} to={`/issue/${report.id}`}
                      className="block py-3 hover:bg-gray-50 -mx-2 px-2 rounded-lg transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="flex-1 min-w-0">
                          <span className="font-medium text-gray-900 text-sm truncate block">{report.title}</span>
                          <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-400">
                            <span>{timeAgo(report.createdAt)}</span>
                            <span>·</span>
                            <span><ThumbsUp size={9} className="inline mr-0.5"/>{report.votes||0} votes</span>
                          </div>
                        </div>
                        <BadgeChip label={report.status} variant={statusVariant[report.status]||'open'} />
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Quick Actions */}
            <div className="bg-white border border-gray-200 rounded-xl p-5">
              <h3 className="font-bold text-gray-900 mb-4">Quick Actions</h3>
              <div className="grid grid-cols-2 gap-3">
                {quickActions.map(({ icon, bg, label, to }) => (
                  <Link key={label} to={to}
                    className="flex flex-col items-center gap-2 p-3 hover:bg-gray-50 rounded-xl transition-colors border border-gray-100">
                    <div className={`w-10 h-10 ${bg} rounded-xl flex items-center justify-center`}>{icon}</div>
                    <span className="text-xs font-medium text-gray-700 text-center leading-tight">{label}</span>
                  </Link>
                ))}
              </div>
            </div>

            {/* AI Insights teaser */}
            <div className="bg-white border border-gray-200 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <Cpu size={16} className="text-green-600" />
                <h3 className="font-bold text-gray-900">Insights</h3>
              </div>
              {allReports.length > 0 ? (
                <>
                  <p className="text-xs text-gray-600 leading-relaxed mb-3">
                    {(() => {
                      const cats = {}
                      allReports.forEach(r => { cats[r.category]=(cats[r.category]||0)+1 })
                      const top = Object.entries(cats).sort((a,b)=>b[1]-a[1])[0]
                      return top ? `${top[0].charAt(0).toUpperCase()+top[0].slice(1)} issues are most reported in your area this month.` : 'Start reporting to see AI insights.'
                    })()}
                  </p>
                  <Link to="/analytics" className="text-xs text-green-600 font-medium hover:underline flex items-center gap-1">
                    View Full Report <ArrowRight size={11}/>
                  </Link>
                </>
              ) : (
                <p className="text-xs text-gray-400">Report issues to unlock AI insights.</p>
              )}
            </div>

            {/* Activity Feed */}
            <div className="bg-white border border-gray-200 rounded-xl p-5">
              <h3 className="font-bold text-gray-900 mb-4">Recent Activity</h3>
              {loading ? (
                <div className="space-y-3">
                  {[1,2,3].map(i => <div key={i} className="h-10 bg-gray-100 rounded-lg animate-pulse" />)}
                </div>
              ) : allReports.length === 0 ? (
                <p className="text-sm text-gray-400">Activity will appear here as reports come in.</p>
              ) : (
                <div className="space-y-3">
                  {allReports.slice(0,3).map(r => (
                    <div key={r.id} className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Bell size={12} className="text-green-600"/>
                      </div>
                      <div>
                        <p className="text-xs text-gray-700 leading-relaxed line-clamp-2">{r.title}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{timeAgo(r.createdAt)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Map CTA */}
            <Link to="/map" className="bg-white border border-gray-200 rounded-xl overflow-hidden block hover:shadow-md transition-shadow">
              <div className="h-28 bg-gradient-to-br from-green-50 via-green-100 to-emerald-50 flex items-center justify-center relative">
                <Map size={40} className="text-green-500 opacity-50"/>
                {allReports.filter(r=>r.location).length > 0 && (
                  <div className="absolute top-3 right-3 bg-green-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                    {allReports.filter(r=>r.location).length} pins
                  </div>
                )}
              </div>
              <div className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-900">Issue Map</p>
                  <p className="text-xs text-gray-500">{allReports.filter(r=>r.location).length} active near you</p>
                </div>
                <span className="text-sm text-green-600 font-medium flex items-center gap-1">Open <ArrowRight size={12}/></span>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}