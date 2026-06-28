import { Link } from 'react-router-dom'
import { MapPin, Tag, ThumbsUp } from 'lucide-react'
import BadgeChip from './BadgeChip'

export default function IssueCard({ issue }) {
  const { id, title, location, category, votes, aiScore, date, status } = issue

  const statusVariant =
    status === 'In Progress' ? 'in-progress'
    : status === 'Resolved' ? 'resolved'
    : 'open'

  return (
    <Link to={`/issue/${id}`} className="block">
      <div className="py-4 border-b border-gray-100 hover:bg-gray-50 transition-colors px-1">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-gray-900 text-sm truncate">{title}</h3>
              <BadgeChip label={status} variant={statusVariant} />
            </div>
            <div className="flex items-center gap-3 text-xs text-gray-500">
              <span className="flex items-center gap-1">
                <MapPin size={11} /> {location}
              </span>
              <span className="flex items-center gap-1">
                <Tag size={11} /> {category}
              </span>
            </div>
            <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-500">
              <span className="flex items-center gap-1">
                <ThumbsUp size={11} /> {votes} votes
              </span>
              <span>
                AI Score: <span className="text-green-600 font-semibold">{aiScore}%</span>
              </span>
              <span>{date}</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}
