import { useEffect, useState, useRef } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  MapPin, Calendar, Tag, ThumbsUp, Share2, CheckCircle,
  Cpu, Users, Wrench, Clock, Flag, Loader2, Send,
} from 'lucide-react'
import Navbar from '../components/Navbar'
import BadgeChip from '../components/BadgeChip'
import { useAuth } from '../context/AuthContext'
import {
  subscribeToReport, subscribeToComments,
  toggleVote, addComment, toggleCommentLike,
  verifyReport, incrementViews,
} from '../lib/reportsService'

const catLabel = {
  road: 'Road & Potholes', lighting: 'Street Lighting',
  waste: 'Waste & Sanitation', parks: 'Parks & Green Spaces',
  water: 'Water & Drainage', vandalism: 'Vandalism & Safety',
}

function timeAgo(ts) {
  if (!ts) return ''
  const date = ts.toDate ? ts.toDate() : new Date(ts)
  const diff = Math.floor((Date.now() - date.getTime()) / 1000)
  if (diff < 60) return 'just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

export default function IssueDetail() {
  const { id } = useParams()
  const { user } = useAuth()

  const [report, setReport] = useState(null)
  const [comments, setComments] = useState([])
  const [loading, setLoading] = useState(true)
  const [commentText, setCommentText] = useState('')
  const [posting, setPosting] = useState(false)
  const [voting, setVoting] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const viewedRef = useRef(false)

  useEffect(() => {
    const unsub = subscribeToReport(
      id,
      (r) => { setReport(r); setLoading(false) },
      (_err) => setLoading(false)
    )
    const unsubC = subscribeToComments(id, setComments, () => setComments([]))

    if (!viewedRef.current) {
      viewedRef.current = true
      incrementViews(id).catch(() => {})
    }

    return () => { unsub(); unsubC() }
  }, [id])

  async function handleVote() {
    if (!user || voting) return
    setVoting(true)
    await toggleVote(id, user.uid)
    setVoting(false)
  }

  async function handleVerify(action) {
    if (!user || verifying) return
    setVerifying(true)
    await verifyReport(id, user.uid, action)
    setVerifying(false)
  }

  async function handleComment(e) {
    e.preventDefault()
    if (!commentText.trim() || posting) return
    setPosting(true)
    await addComment(id, user.uid, user.displayName || user.email, commentText.trim())
    setCommentText('')
    setPosting(false)
  }

  async function handleLike(commentId) {
    if (!user) return
    await toggleCommentLike(id, commentId, user.uid)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 size={28} className="text-green-600 animate-spin" />
        </div>
      </div>
    )
  }

  if (!report) {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center flex-col gap-4">
          <p className="text-gray-500">Issue not found.</p>
          <Link to="/dashboard" className="text-green-600 hover:underline">← Dashboard</Link>
        </div>
      </div>
    )
  }

  const hasVoted     = report.voters?.includes(user?.uid)
  const hasVerified  = report.verifiers?.includes(user?.uid)
  const hasFlagged   = report.flaggers?.includes(user?.uid)

  const timeline = [
    { icon: <Flag size={14} className="text-green-600" />,    color: 'border-green-500 bg-green-50',  title: 'Issue Reported',       desc: `${report.userDisplayName || 'User'} submitted the report.`,     time: timeAgo(report.createdAt), done: true },
    { icon: <Cpu size={14} className="text-green-600" />,     color: 'border-green-500 bg-green-50',  title: 'AI Analysis Complete', desc: report.aiScore ? `Severity: ${report.severity}. Routed to ${report.aiDepartment || 'department'}.` : 'Analysis pending…', time: '', done: !!report.aiScore },
    { icon: <Users size={14} className="text-blue-500" />,    color: 'border-blue-400 bg-blue-50',    title: 'Community Verification', desc: `${report.verifiedCount || 0} neighbour${report.verifiedCount !== 1 ? 's' : ''} confirmed this issue.`, time: '', done: (report.verifiedCount || 0) > 0 },
    { icon: <Wrench size={14} className="text-gray-400" />,   color: 'border-gray-200 bg-gray-50',    title: 'Technician Assigned',  desc: 'Pending community verification.',    time: '',             done: false },
    { icon: <CheckCircle size={14} className="text-gray-400" />, color: 'border-gray-200 bg-gray-50', title: 'Issue Resolved',       desc: 'Pending repair completion.',         time: 'Est. TBD',    done: report.status === 'resolved' },
  ]

  const statusVariant = { open: 'open', 'in-progress': 'in-progress', resolved: 'resolved' }

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
          <Link to="/dashboard" className="hover:text-gray-700">Dashboard</Link>
          <span>›</span>
          <span className="text-gray-900 font-medium">Issue #{id.slice(0, 8).toUpperCase()}</span>
        </div>

        {/* Issue Header */}
        <div className="flex items-start justify-between gap-4 mb-2 flex-wrap">
          <h1 className="text-2xl font-bold text-gray-900">{report.title}</h1>
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigator.clipboard.writeText(window.location.href).then(() => alert('Link copied!')).catch(() => {})}
              className="flex items-center gap-2 text-sm text-gray-600 border border-gray-200 px-4 py-2 rounded-xl hover:bg-gray-50 transition-colors"
            >
              <Share2 size={14} /> Share
            </button>
            <Link to="/map" className="flex items-center gap-2 text-sm text-gray-600 border border-gray-200 px-4 py-2 rounded-xl hover:bg-gray-50 transition-colors">
              <MapPin size={14} /> Map
            </Link>
          </div>
        </div>

        <div className="flex items-center gap-4 text-sm text-gray-500 flex-wrap mb-6">
          <span className="flex items-center gap-1.5"><MapPin size={13} /> {report.address?.split(',')[0] || report.city || '—'}</span>
          <span className="flex items-center gap-1.5"><Calendar size={13} /> {report.createdAt?.toDate ? report.createdAt.toDate().toLocaleDateString() : ''}</span>
          <span className="flex items-center gap-1.5"><Tag size={13} /> {catLabel[report.category] || report.category}</span>
          <BadgeChip label={report.status} variant={statusVariant[report.status] || 'open'} />
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Photos */}
            {report.imageUrls?.length > 0 && (
              <div>
                <h2 className="font-bold text-gray-900 mb-3">Photos</h2>
                <div className="grid grid-cols-2 gap-3">
                  {report.imageUrls.map((url, i) => (
                    <img key={i} src={url} alt="Issue" className="w-full h-52 object-cover rounded-xl border border-gray-200" />
                  ))}
                </div>
              </div>
            )}

            {/* Description */}
            <div>
              <h2 className="font-bold text-gray-900 mb-3">Description</h2>
              <p className="text-sm text-gray-600 leading-relaxed">{report.description}</p>
              <div className="flex items-center gap-2 mt-4 flex-wrap">
                <span className="bg-gray-100 text-gray-700 text-xs px-3 py-1 rounded-full">{catLabel[report.category] || report.category}</span>
                <span className={`text-xs px-3 py-1 rounded-full font-semibold ${
                  report.severity === 'Critical' ? 'bg-red-100 text-red-600' :
                  report.severity === 'High'     ? 'bg-orange-100 text-orange-600' :
                  report.severity === 'Medium'   ? 'bg-yellow-100 text-yellow-600' :
                  'bg-gray-100 text-gray-600'
                }`}>
                  {report.severity} Severity
                </span>
                {report.aiScore && (
                  <span className="bg-green-50 text-green-700 text-xs px-3 py-1 rounded-full">AI Score: {report.aiScore}/100</span>
                )}
              </div>
            </div>

            {/* Location */}
            {report.location && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="font-bold text-gray-900">Location</h2>
                  <Link to="/map" className="text-sm text-green-600 font-medium hover:underline">Full map →</Link>
                </div>
                <div className="rounded-xl overflow-hidden border border-gray-200 mb-3">
                  <iframe
                    title="issue-map"
                    className="w-full h-48"
                    src={`https://www.openstreetmap.org/export/embed.html?bbox=${report.location.lng - 0.008},${report.location.lat - 0.008},${report.location.lng + 0.008},${report.location.lat + 0.008}&layer=mapnik&marker=${report.location.lat},${report.location.lng}`}
                  />
                </div>
                <div className="flex items-center gap-1.5 text-sm text-gray-600">
                  <MapPin size={13} className="text-red-500" />
                  {report.address}
                </div>
              </div>
            )}

            {/* Comments */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-gray-900">Community Comments</h2>
                <span className="text-sm text-gray-500">{comments.length} comment{comments.length !== 1 ? 's' : ''}</span>
              </div>
              <div className="space-y-5">
                {comments.length === 0 && (
                  <p className="text-sm text-gray-400">No comments yet. Be the first!</p>
                )}
                {comments.map((c) => {
                  const hasLiked = c.likedBy?.includes(user?.uid)
                  const initials = (c.displayName || 'U').split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
                  return (
                    <div key={c.id} className="flex gap-3">
                      <div className="w-9 h-9 rounded-full bg-green-600 flex items-center justify-center flex-shrink-0 text-white text-xs font-bold">
                        {initials}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-sm text-gray-900">{c.displayName || 'Anonymous'}</span>
                          <span className="text-xs text-gray-400 ml-auto">{timeAgo(c.createdAt)}</span>
                        </div>
                        <p className="text-sm text-gray-600">{c.text}</p>
                        <button
                          onClick={() => handleLike(c.id)}
                          className={`flex items-center gap-1 text-xs mt-2 hover:text-green-600 transition-colors ${hasLiked ? 'text-green-600' : 'text-gray-400'}`}
                        >
                          <ThumbsUp size={11} /> {c.likes || 0}
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Add comment */}
              <form onSubmit={handleComment} className="flex items-center gap-3 mt-6 pt-5 border-t border-gray-100">
                <div className="w-9 h-9 rounded-full bg-green-600 flex items-center justify-center flex-shrink-0 text-white text-xs font-bold">
                  {(user?.displayName || user?.email || 'U').slice(0, 2).toUpperCase()}
                </div>
                <div className="flex-1 flex items-center gap-2">
                  <input
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Add a comment..."
                    className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                  <button
                    type="submit"
                    disabled={posting || !commentText.trim()}
                    className="bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors flex items-center gap-1"
                  >
                    {posting ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-5">
            {/* Community Support */}
            <div className="bg-white border border-gray-200 rounded-xl p-5">
              <h3 className="font-bold text-gray-900 mb-4">Community Support</h3>
              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-900">{report.votes || 0}</p>
                  <p className="text-xs text-gray-500">Votes</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">{report.verifiedCount || 0}</p>
                  <p className="text-xs text-gray-500">Verified</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-600">{report.views || 0}</p>
                  <p className="text-xs text-gray-500">Views</p>
                </div>
              </div>
              <button
                onClick={handleVote}
                disabled={voting}
                className={`w-full font-semibold py-2.5 rounded-xl text-sm transition-colors flex items-center justify-center gap-2 ${
                  hasVoted ? 'bg-green-50 text-green-600 border border-green-200' : 'bg-green-600 hover:bg-green-700 text-white'
                }`}
              >
                {voting ? <Loader2 size={14} className="animate-spin" /> : <ThumbsUp size={14} />}
                {hasVoted ? 'Voted!' : 'Upvote this Issue'}
              </button>

              {/* Verify buttons (only for non-reporters) */}
              {report.userId !== user?.uid && (
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => handleVerify('verify')}
                    disabled={verifying || hasVerified}
                    className={`flex-1 text-xs font-semibold py-2 rounded-xl transition-colors flex items-center justify-center gap-1 ${
                      hasVerified ? 'bg-blue-50 text-blue-600 border border-blue-200' : 'border border-gray-200 hover:bg-gray-50 text-gray-600'
                    }`}
                  >
                    <CheckCircle size={11} /> {hasVerified ? 'Confirmed' : 'Confirm'}
                  </button>
                  <button
                    onClick={() => handleVerify('flag')}
                    disabled={verifying || hasFlagged}
                    className={`flex-1 text-xs font-semibold py-2 rounded-xl transition-colors flex items-center justify-center gap-1 ${
                      hasFlagged ? 'bg-red-50 text-red-500 border border-red-200' : 'border border-gray-200 hover:bg-gray-50 text-gray-600'
                    }`}
                  >
                    <Flag size={11} /> {hasFlagged ? 'Flagged' : 'Flag'}
                  </button>
                </div>
              )}
            </div>

            {/* AI Analysis */}
            {report.aiScore && (
              <div className="bg-white border border-gray-200 rounded-xl p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Cpu size={16} className="text-green-600" />
                  <h3 className="font-bold text-gray-900">AI Analysis</h3>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Severity</span>
                    <span className="font-bold text-red-500">{report.aiScore}/100</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-1.5">
                    <div className="bg-red-400 h-1.5 rounded-full" style={{ width: `${report.aiScore}%` }} />
                  </div>
                  {report.aiDepartment && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Department</span>
                      <span className="font-semibold text-gray-900 text-xs text-right max-w-32">{report.aiDepartment}</span>
                    </div>
                  )}
                  {report.aiTags?.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {report.aiTags.map((t) => (
                        <span key={t} className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-full">{t}</span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Issue Timeline */}
            <div className="bg-white border border-gray-200 rounded-xl p-5">
              <h3 className="font-bold text-gray-900 mb-5">Issue Timeline</h3>
              <div className="relative">
                <div className="absolute left-3 top-0 bottom-0 w-px bg-gray-200" />
                <div className="space-y-5">
                  {timeline.map(({ icon, color, title, desc, time, done }) => (
                    <div key={title} className="flex gap-4 relative">
                      <div className={`w-7 h-7 rounded-full border-2 flex items-center justify-center flex-shrink-0 z-10 ${done ? color : 'border-gray-200 bg-white'}`}>
                        {icon}
                      </div>
                      <div>
                        <p className={`text-sm font-semibold ${done ? 'text-gray-900' : 'text-gray-400'}`}>{title}</p>
                        <p className={`text-xs mt-0.5 ${done ? 'text-gray-500' : 'text-gray-400'}`}>{desc}</p>
                        {time && <p className="text-xs text-gray-400 mt-0.5">{time}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}