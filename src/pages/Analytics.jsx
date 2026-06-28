import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { TrendingUp, CheckCircle, Clock, Users, Cpu, ArrowRight, Loader2 } from 'lucide-react'
import Navbar from '../components/Navbar'
import { subscribeToReports } from '../lib/reportsService'

const catColors = {
  road:      { bg: 'bg-blue-500',   label: 'Road & Potholes' },
  lighting:  { bg: 'bg-yellow-500', label: 'Street Lighting' },
  waste:     { bg: 'bg-green-500',  label: 'Waste & Sanitation' },
  parks:     { bg: 'bg-emerald-400',label: 'Parks & Green Spaces' },
  water:     { bg: 'bg-cyan-500',   label: 'Water & Drainage' },
  vandalism: { bg: 'bg-red-500',    label: 'Vandalism & Safety' },
}

function getMonthKey(ts) {
  if (!ts) return ''
  const d = ts.toDate ? ts.toDate() : new Date(ts)
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`
}

function getLastNMonths(n) {
  const months = []
  const now = new Date()
  for (let i = n-1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth()-i, 1)
    months.push({
      key: `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`,
      label: d.toLocaleString('default', { month: 'short' }),
    })
  }
  return months
}

export default function Analytics() {
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)
  const [range, setRange] = useState('month') // month | 3months | year

  useEffect(() => {
    const unsub = subscribeToReports(
      (data) => { setReports(data); setLoading(false) },
      (_err) => { setReports([]); setLoading(false) }
    )
    return unsub
  }, [])

  // Compute stats
  const total     = reports.length
  const resolved  = reports.filter(r => r.status === 'resolved').length
  const inProgress= reports.filter(r => r.status === 'in-progress').length
  const open      = reports.filter(r => r.status === 'open').length
  const citizens  = new Set(reports.map(r => r.userId)).size
  const totalVotes= reports.reduce((s,r) => s+(r.votes||0), 0)

  // Category breakdown
  const catCounts = {}
  reports.forEach(r => { catCounts[r.category] = (catCounts[r.category]||0)+1 })
  // maxCat unused — category bars use percentage of total, not max count

  // Severity breakdown
  const sevCounts = { Critical:0, High:0, Medium:0, Low:0 }
  reports.forEach(r => { if (sevCounts[r.severity] !== undefined) sevCounts[r.severity]++ })

  // Monthly timeline
  const nMonths = range === 'month' ? 6 : range === '3months' ? 9 : 12
  const months  = getLastNMonths(nMonths)
  const monthlyData = months.map(m => ({
    ...m,
    total:    reports.filter(r => getMonthKey(r.createdAt) === m.key).length,
    resolved: reports.filter(r => getMonthKey(r.createdAt) === m.key && r.status === 'resolved').length,
  }))
  const maxMonth = Math.max(...monthlyData.map(m => m.total), 1)

  // AI insight
  const topCat = Object.entries(catCounts).sort((a,b) => b[1]-a[1])[0]
  const aiInsight = total === 0
    ? 'No reports yet. Start reporting issues to see insights.'
    : topCat
      ? `${catColors[topCat[0]]?.label || topCat[0]} is your most reported issue type (${topCat[1]} reports, ${Math.round((topCat[1]/total)*100)}% of total). ${resolved > 0 ? `${Math.round((resolved/total)*100)}% of issues have been resolved.` : 'Keep reporting to drive community action!'}`
      : 'Analysis ready. Submit reports to build insights.'

  const statCards = [
    { icon: <TrendingUp size={16} />, label: 'Total Issues',     value: total,    change: open>0?`${open} open`:'', color: 'text-blue-600 bg-blue-50' },
    { icon: <CheckCircle size={16} />,label: 'Resolved',         value: resolved, change: total>0?`${Math.round((resolved/total)*100)}% rate`:'', color: 'text-green-600 bg-green-50' },
    { icon: <Clock size={16} />,      label: 'In Progress',      value: inProgress, change: '', color: 'text-orange-600 bg-orange-50' },
    { icon: <Users size={16} />,      label: 'Active Citizens',  value: citizens, change: `${totalVotes} votes`, color: 'text-purple-600 bg-purple-50' },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-bold text-gray-900">Analytics & Insights</h1>
          <div className="flex items-center gap-3">
            <select value={range} onChange={e => setRange(e.target.value)}
              className="border border-gray-200 rounded-xl px-4 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-green-500">
              <option value="month">Last 6 Months</option>
              <option value="3months">Last 9 Months</option>
              <option value="year">Last 12 Months</option>
            </select>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {statCards.map(({ icon, label, value, change, color }) => (
            <div key={label} className="bg-white border border-gray-200 rounded-xl p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-gray-500">{label}</span>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${color}`}>{icon}</div>
              </div>
              {loading ? (
                <div className="w-12 h-8 bg-gray-100 rounded animate-pulse" />
              ) : (
                <>
                  <p className="text-2xl font-bold text-gray-900">{value}</p>
                  {change && <p className="text-xs text-green-600 font-medium mt-0.5">{change}</p>}
                </>
              )}
            </div>
          ))}
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-6">
          {/* Monthly Timeline */}
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-bold text-gray-900">Issues Over Time</h2>
              <div className="flex items-center gap-3 text-xs text-gray-500">
                <span className="flex items-center gap-1"><div className="w-2 h-2 bg-green-500 rounded-full" />Reported</span>
                <span className="flex items-center gap-1"><div className="w-2 h-2 bg-blue-400 rounded-full" />Resolved</span>
              </div>
            </div>
            {loading ? (
              <div className="h-40 flex items-center justify-center"><Loader2 size={20} className="animate-spin text-green-600" /></div>
            ) : (
              <>
                <div className="h-40 flex items-end gap-1.5">
                  {monthlyData.map((m, i) => (
                    <div key={i} className="flex-1 flex flex-col gap-1 items-center group relative">
                      <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-10">
                        {m.label}: {m.total} reported, {m.resolved} resolved
                      </div>
                      <div className="w-full flex flex-col-reverse gap-0.5" style={{height: '100%'}}>
                        <div className="w-full bg-blue-400 rounded-t-sm" style={{height: maxMonth ? `${(m.resolved/maxMonth)*100}%` : '0%'}} />
                        <div className="w-full bg-green-500 rounded-t-sm" style={{height: maxMonth ? `${((m.total-m.resolved)/maxMonth)*100}%` : '0%'}} />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between text-xs text-gray-400 mt-2">
                  {monthlyData.filter((_, i) => i === 0 || i === Math.floor(monthlyData.length/2) || i === monthlyData.length-1).map(m => (
                    <span key={m.key}>{m.label}</span>
                  ))}
                </div>
                {total === 0 && (
                  <p className="text-center text-sm text-gray-400 mt-4">No data yet. Report issues to see your timeline.</p>
                )}
              </>
            )}
          </div>

          {/* Category Breakdown */}
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <h2 className="font-bold text-gray-900 mb-5">Issues by Category</h2>
            {loading ? (
              <div className="flex items-center justify-center h-40"><Loader2 size={20} className="animate-spin text-green-600" /></div>
            ) : total === 0 ? (
              <div className="flex items-center justify-center h-40 text-gray-400 text-sm">No data yet</div>
            ) : (
              <div className="space-y-3">
                {Object.entries(catCounts).sort((a,b) => b[1]-a[1]).map(([cat, count]) => {
                  const meta = catColors[cat] || { bg: 'bg-gray-400', label: cat }
                  const pct = Math.round((count/total)*100)
                  return (
                    <div key={cat}>
                      <div className="flex justify-between text-sm mb-1.5">
                        <span className="font-medium text-gray-700">{meta.label}</span>
                        <span className="text-gray-500">{count} · {pct}%</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2">
                        <div className={`${meta.bg} h-2 rounded-full transition-all`} style={{width:`${pct}%`}} />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-6">
          {/* Severity Distribution */}
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <h2 className="font-bold text-gray-900 mb-5">Severity Distribution</h2>
            {loading ? (
              <div className="flex items-center justify-center h-32"><Loader2 size={20} className="animate-spin text-green-600" /></div>
            ) : (
              <div className="space-y-3">
                {[['Critical','#dc2626'],['High','#ea580c'],['Medium','#eab308'],['Low','#16a34a']].map(([sev,color]) => {
                  const count = sevCounts[sev] || 0
                  const pct = total ? Math.round((count/total)*100) : 0
                  return (
                    <div key={sev}>
                      <div className="flex justify-between text-sm mb-1.5">
                        <span className="font-medium text-gray-700">{sev}</span>
                        <span className="text-gray-500">{count} · {pct}%</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2">
                        <div className="h-2 rounded-full transition-all" style={{width:`${pct}%`,background:color}} />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Status Overview */}
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <h2 className="font-bold text-gray-900 mb-5">Status Overview</h2>
            {loading ? (
              <div className="flex items-center justify-center h-32"><Loader2 size={20} className="animate-spin text-green-600" /></div>
            ) : (
              <div className="space-y-4">
                {[
                  { label: 'Open', value: open, color: 'bg-green-500', text: 'text-green-600' },
                  { label: 'In Progress', value: inProgress, color: 'bg-blue-500', text: 'text-blue-600' },
                  { label: 'Resolved', value: resolved, color: 'bg-gray-400', text: 'text-gray-600' },
                ].map(({ label, value, color, text }) => (
                  <div key={label} className="flex items-center gap-4">
                    <div className="flex-1">
                      <div className="flex justify-between mb-1">
                        <span className="text-sm font-medium text-gray-700">{label}</span>
                        <span className={`text-sm font-bold ${text}`}>{value}</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2">
                        <div className={`${color} h-2 rounded-full`} style={{width: total ? `${(value/total)*100}%` : '0%'}} />
                      </div>
                    </div>
                  </div>
                ))}
                {total > 0 && (
                  <div className="pt-2 border-t border-gray-100">
                    <p className="text-xs text-gray-500">Resolution rate: <span className="font-semibold text-green-600">{Math.round((resolved/total)*100)}%</span></p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* AI Insight */}
        <div className="bg-green-50 border border-green-200 rounded-xl p-5 flex items-start gap-4 mb-6">
          <div className="w-10 h-10 bg-green-600 rounded-xl flex items-center justify-center flex-shrink-0">
            <Cpu size={18} className="text-white" />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-gray-900 text-sm mb-1">AI Insight</p>
            <p className="text-sm text-gray-600">{aiInsight}</p>
          </div>
          {total > 0 && (
            <Link to="/community-verification" className="flex items-center gap-1 text-sm text-green-600 font-medium hover:underline flex-shrink-0">
              Verify Issues <ArrowRight size={13} />
            </Link>
          )}
        </div>

        {/* Recent Top Reports */}
        {reports.length > 0 && (
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-gray-900">Top Voted Reports</h2>
            </div>
            <div className="space-y-3">
              {[...reports].sort((a,b) => (b.votes||0)-(a.votes||0)).slice(0,5).map(r => (
                <Link key={r.id} to={`/issue/${r.id}`} className="flex items-center gap-4 py-2 hover:bg-gray-50 -mx-2 px-2 rounded-lg transition-colors">
                  <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${catColors[r.category]?.bg || 'bg-gray-400'}`} />
                  <span className="text-sm text-gray-700 flex-1 truncate">{r.title}</span>
                  <span className="text-xs text-gray-400 flex-shrink-0">{r.votes||0} votes</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${r.status==='resolved'?'bg-gray-100 text-gray-600':r.status==='in-progress'?'bg-blue-100 text-blue-600':'bg-green-100 text-green-700'}`}>
                    {r.status}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}