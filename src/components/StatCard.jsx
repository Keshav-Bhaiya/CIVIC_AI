export default function StatCard({ icon, label, value, change, changeLabel }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-500">{label}</span>
        {icon && (
          <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center text-green-600">
            {icon}
          </div>
        )}
      </div>
      <div className="flex items-end gap-2">
        <span className="text-2xl font-bold text-gray-900">{value}</span>
        {change && (
          <span className="text-sm font-medium text-green-600 mb-0.5">{change}</span>
        )}
      </div>
      {changeLabel && (
        <span className="text-xs text-gray-400">{changeLabel}</span>
      )}
    </div>
  )
}
