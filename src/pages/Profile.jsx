import { useState, useRef, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { MapPin, Award, CheckCircle, FileText, ThumbsUp, Settings, LogOut, Camera, Shield, Star, Zap, Bell, Edit2, X, Loader2 } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import Navbar from '../components/Navbar'
import { subscribeToUserReports, subscribeToVerificationQueue } from '../lib/reportsService'
import { updateProfile } from 'firebase/auth'
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore'
import { auth, db } from '../lib/firebase'

function timeAgo(ts) {
  if (!ts) return ''
  const d = ts.toDate ? ts.toDate() : new Date(ts)
  const s = Math.floor((Date.now() - d.getTime()) / 1000)
  if (s < 60) return 'just now'
  if (s < 3600) return `${Math.floor(s/60)}m ago`
  if (s < 86400) return `${Math.floor(s/3600)}h ago`
  return `${Math.floor(s/86400)}d ago`
}

function RankBadge({ points }) {
  if (points >= 1000) return { label: 'City Champion', color: 'text-purple-600 bg-purple-50 border-purple-200', icon: '🏆' }
  if (points >= 500)  return { label: 'Civic Hero',    color: 'text-orange-600 bg-orange-50 border-orange-200', icon: '⭐' }
  if (points >= 200)  return { label: 'Active Citizen',color: 'text-blue-600 bg-blue-50 border-blue-200',     icon: '🎖️' }
  if (points >= 50)   return { label: 'Contributor',   color: 'text-green-600 bg-green-50 border-green-200',  icon: '✅' }
  return                      { label: 'Newcomer',      color: 'text-gray-600 bg-gray-50 border-gray-200',    icon: '🌱' }
}

export default function Profile() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const fileRef  = useRef(null)

  const [myReports,    setMyReports]    = useState([])
  const [verQueue,     setVerQueue]     = useState([])
  const [editing,      setEditing]      = useState(false)
  const [editName,     setEditName]     = useState('')
  const [saving,       setSaving]       = useState(false)
  const [saveMsg,      setSaveMsg]      = useState('')

  const displayName = user?.displayName || user?.profile?.name || 'User'
  const email       = user?.email || ''
  const photoURL    = user?.photoURL || null
  const points      = user?.profile?.points ?? 0
  const joinedAt    = user?.profile?.createdAt
  const initials    = displayName.split(' ').map(n=>n[0]).join('').toUpperCase().slice(0,2)
  const rank        = RankBadge({ points })

  useEffect(() => {
    if (!user?.uid) return
    const u1 = subscribeToUserReports(user.uid, setMyReports, () => setMyReports([]))
    const u2 = subscribeToVerificationQueue(user.uid, setVerQueue, () => setVerQueue([]))
    return () => { u1(); u2() }
  }, [user?.uid])

  const resolved       = myReports.filter(r=>r.status==='resolved').length
  const myVerified     = myReports.length // verifications I did on others — use queue length diff
  const totalVotes     = myReports.reduce((s,r)=>s+(r.votes||0), 0)
  const earnedPoints   = myReports.length*20 + totalVotes*10
  const displayPoints  = Math.max(points, earnedPoints)

  async function handleSaveName() {
    if (!editName.trim() || editName === displayName) { setEditing(false); return }
    setSaving(true)
    try {
      await updateProfile(auth.currentUser, { displayName: editName.trim() })
      await updateDoc(doc(db, 'users', user.uid), { name: editName.trim() })
      setSaveMsg('Profile updated!')
      setTimeout(() => setSaveMsg(''), 3000)
    } catch (err) {
      console.error(err)
    }
    setSaving(false)
    setEditing(false)
  }

  async function handleLogout() {
    await logout()
    navigate('/login')
  }

  const badges = [
    { icon: <FileText size={16}/>,    label: 'First Report',   earned: myReports.length >= 1,    color:'text-blue-600 bg-blue-50' },
    { icon: <CheckCircle size={16}/>, label: 'Verified 5',     earned: myReports.length >= 5,    color:'text-green-600 bg-green-50' },
    { icon: <ThumbsUp size={16}/>,    label: '10 Votes',       earned: totalVotes >= 10,          color:'text-orange-600 bg-orange-50' },
    { icon: <Shield size={16}/>,      label: 'Verifier',       earned: true,                      color:'text-purple-600 bg-purple-50' },
    { icon: <Star size={16}/>,        label: 'Top Reporter',   earned: myReports.length >= 10,   color:'text-yellow-600 bg-yellow-50' },
    { icon: <Zap size={16}/>,         label: 'AI Pioneer',     earned: myReports.some(r=>r.aiScore), color:'text-pink-600 bg-pink-50' },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">

        {saveMsg && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 text-sm rounded-xl flex items-center gap-2">
            <CheckCircle size={14}/> {saveMsg}
          </div>
        )}

        {/* Profile Card */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 sm:p-8 mb-5">
          <div className="flex flex-col sm:flex-row items-start gap-5">
            {/* Avatar */}
            <div className="relative flex-shrink-0">
              {photoURL ? (
                <img src={photoURL} alt={displayName} className="w-20 h-20 rounded-full object-cover border-4 border-green-100"/>
              ) : (
                <div className="w-20 h-20 rounded-full bg-green-600 flex items-center justify-center border-4 border-green-100">
                  <span className="text-white text-2xl font-bold">{initials}</span>
                </div>
              )}
              {/* Camera overlay (visual only — Storage upload requires Blaze plan) */}
              <div className="absolute bottom-0 right-0 w-7 h-7 bg-white border-2 border-gray-200 rounded-full flex items-center justify-center cursor-pointer hover:bg-gray-50 shadow-sm"
                title="Avatar changes via Google profile photo">
                <Camera size={12} className="text-gray-500"/>
              </div>
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              {editing ? (
                <div className="flex items-center gap-2 mb-2">
                  <input
                    value={editName}
                    onChange={e=>setEditName(e.target.value)}
                    onKeyDown={e=>e.key==='Enter'&&handleSaveName()}
                    className="text-lg font-bold border border-gray-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-green-500 flex-1 max-w-xs"
                    autoFocus
                  />
                  <button onClick={handleSaveName} disabled={saving}
                    className="bg-green-600 text-white text-xs px-3 py-1.5 rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-1">
                    {saving ? <Loader2 size={12} className="animate-spin"/> : <CheckCircle size={12}/>} Save
                  </button>
                  <button onClick={()=>setEditing(false)} className="text-gray-400 hover:text-gray-600">
                    <X size={16}/>
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2 mb-1">
                  <h1 className="text-2xl font-bold text-gray-900">{displayName}</h1>
                  <button onClick={()=>{ setEditName(displayName); setEditing(true) }}
                    className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition-colors">
                    <Edit2 size={14}/>
                  </button>
                </div>
              )}
              <p className="text-gray-500 text-sm">{email}</p>
              <div className="flex items-center gap-1.5 text-gray-500 text-sm mt-1">
                <MapPin size={13}/> <span>CivicAI Member</span>
                {joinedAt && <span className="text-gray-400">· Joined {timeAgo(joinedAt)}</span>}
              </div>
              <div className="flex flex-wrap items-center gap-2 mt-3">
                <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full border ${rank.color}`}>
                  {rank.icon} {rank.label}
                </span>
                <span className="inline-flex items-center gap-1.5 bg-green-50 text-green-700 text-xs font-semibold px-3 py-1 rounded-full border border-green-200">
                  <Award size={11}/> {displayPoints} civic points
                </span>
              </div>
            </div>

            {/* Logout on desktop */}
            <button onClick={handleLogout}
              className="hidden sm:flex items-center gap-2 border border-gray-200 text-red-500 hover:bg-red-50 text-sm px-4 py-2 rounded-xl transition-colors">
              <LogOut size={14}/> Sign Out
            </button>
          </div>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
          {[
            { icon:<FileText size={16} className="text-blue-600"/>,    label:'My Reports',    value: myReports.length,  bg:'bg-blue-50' },
            { icon:<CheckCircle size={16} className="text-green-600"/>, label:'Resolved',      value: resolved,           bg:'bg-green-50' },
            { icon:<ThumbsUp size={16} className="text-orange-500"/>,  label:'Votes Received',value: totalVotes,         bg:'bg-orange-50' },
            { icon:<Award size={16} className="text-yellow-600"/>,     label:'Civic Points',  value: displayPoints,      bg:'bg-yellow-50' },
          ].map(({ icon, label, value, bg }) => (
            <div key={label} className="bg-white border border-gray-200 rounded-xl p-4 text-center">
              <div className={`w-10 h-10 ${bg} rounded-xl flex items-center justify-center mx-auto mb-2`}>{icon}</div>
              <p className="text-2xl font-bold text-gray-900">{value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        {/* Badges */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 mb-5">
          <h2 className="font-bold text-gray-900 mb-4">Badges & Achievements</h2>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
            {badges.map(({ icon, label, earned, color }) => (
              <div key={label} className={`flex flex-col items-center gap-2 p-3 rounded-xl border transition-all ${
                earned ? 'border-gray-100 bg-gray-50' : 'border-gray-100 opacity-35'
              }`}>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${earned ? color : 'text-gray-300 bg-gray-100'}`}>{icon}</div>
                <span className="text-xs text-gray-600 font-medium text-center leading-tight">{label}</span>
                {earned && <div className="w-1.5 h-1.5 bg-green-500 rounded-full"/>}
              </div>
            ))}
          </div>
        </div>

        {/* Recent Reports */}
        {myReports.length > 0 && (
          <div className="bg-white border border-gray-200 rounded-xl p-5 mb-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-gray-900">My Reports</h2>
              <Link to="/dashboard" className="text-xs text-green-600 font-medium hover:underline">View all →</Link>
            </div>
            <div className="space-y-3">
              {myReports.slice(0,5).map(r => (
                <Link key={r.id} to={`/issue/${r.id}`}
                  className="flex items-center gap-3 py-2 hover:bg-gray-50 -mx-2 px-2 rounded-lg transition-colors">
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${r.status==='resolved'?'bg-gray-400':r.status==='in-progress'?'bg-blue-500':'bg-green-500'}`}/>
                  <span className="text-sm text-gray-700 flex-1 truncate">{r.title}</span>
                  <span className="text-xs text-gray-400 flex-shrink-0">{timeAgo(r.createdAt)}</span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Activity Timeline */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 mb-5">
          <h2 className="font-bold text-gray-900 mb-4">Activity Timeline</h2>
          {myReports.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">No activity yet. Start reporting issues!</p>
          ) : (
            <div className="relative pl-6">
              <div className="absolute left-2.5 top-0 bottom-0 w-px bg-gray-100"/>
              <div className="space-y-4">
                {myReports.slice(0,6).map(r => (
                  <div key={r.id} className="relative">
                    <div className="absolute -left-4 top-1 w-3 h-3 rounded-full border-2 border-white bg-green-500 shadow-sm"/>
                    <div>
                      <p className="text-sm text-gray-700 font-medium leading-snug">{r.title.slice(0,50)}{r.title.length>50?'…':''}</p>
                      <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-2">
                        <Bell size={9}/> {timeAgo(r.createdAt)}
                        <span className={`px-1.5 py-0.5 rounded text-xs ${r.status==='resolved'?'bg-gray-100 text-gray-600':r.status==='in-progress'?'bg-blue-100 text-blue-600':'bg-green-100 text-green-700'}`}>
                          {r.status}
                        </span>
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Settings */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5">
          <h2 className="font-bold text-gray-900 mb-4">Account Settings</h2>
          <div className="space-y-0">
            {['Email Notifications','Push Notifications','Public Profile'].map((setting, i) => (
              <div key={setting} className={`flex items-center justify-between py-3.5 ${i<2?'border-b border-gray-100':''}`}>
                <span className="text-sm text-gray-700">{setting}</span>
                <div className="w-9 h-5 bg-green-600 rounded-full relative cursor-pointer">
                  <div className="absolute right-0.5 top-0.5 w-4 h-4 bg-white rounded-full shadow-sm"/>
                </div>
              </div>
            ))}
          </div>
          {/* Mobile logout */}
          <button onClick={handleLogout}
            className="sm:hidden flex items-center gap-2 text-red-500 text-sm mt-5 hover:text-red-700 transition-colors">
            <LogOut size={14}/> Sign Out
          </button>
        </div>
      </div>
    </div>
  )
}