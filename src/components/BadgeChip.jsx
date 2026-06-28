const variants = {
  open: 'bg-green-100 text-green-700',
  'in-progress': 'bg-blue-100 text-blue-700',
  resolved: 'bg-gray-100 text-gray-600',
  high: 'bg-red-100 text-red-600',
  medium: 'bg-yellow-100 text-yellow-700',
  low: 'bg-gray-100 text-gray-500',
  critical: 'bg-red-600 text-white',
  live: 'bg-green-500 text-white',
}

export default function BadgeChip({ label, variant = 'open', className = '' }) {
  const cls = variants[variant?.toLowerCase()] || variants.open
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${cls} ${className}`}>
      {label}
    </span>
  )
}
