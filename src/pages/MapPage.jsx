import { useEffect, useState, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Filter, Loader2, X, MapPin, Tag, ThumbsUp, Navigation, Layers } from 'lucide-react'
import Navbar from '../components/Navbar'
import BadgeChip from '../components/BadgeChip'
import { subscribeToReports } from '../lib/reportsService'

const SEV_COLOR  = { Critical: '#dc2626', High: '#ea580c', Medium: '#d97706', Low: '#16a34a' }
const SEV_PULSE  = { Critical: '#fca5a5', High: '#fed7aa', Medium: '#fde68a', Low: '#bbf7d0' }
const catLabel   = { road:'Road', lighting:'Lighting', waste:'Waste', parks:'Parks', water:'Water', vandalism:'Safety' }

function timeAgo(ts) {
  if (!ts) return ''
  const d = ts.toDate ? ts.toDate() : new Date(ts)
  const s = Math.floor((Date.now() - d.getTime()) / 1000)
  if (s < 3600) return `${Math.floor(s/60)}m ago`
  if (s < 86400) return `${Math.floor(s/3600)}h ago`
  return `${Math.floor(s/86400)}d ago`
}

// Build self-contained Leaflet HTML using string concatenation
// (avoids "Unexpected token '<'" from </script> inside template literals)
function buildLeafletHtml(reports, center, zoom, userLoc) {
  const markers = reports.map(r => ({
    id:    r.id,
    lat:   r.location.lat,
    lng:   r.location.lng,
    color: r.status === 'resolved' ? '#6b7280' : (SEV_COLOR[r.severity] || '#16a34a'),
    pulse: r.status === 'resolved' ? '#d1d5db' : (SEV_PULSE[r.severity] || '#bbf7d0'),
    title: (r.title || '').replace(/\\/g,'\\\\').replace(/'/g,"\\'").replace(/"/g,'&quot;').replace(/\n/g,' ').slice(0,60),
    sev:   r.severity || 'Low',
    cat:   catLabel[r.category] || r.category || '',
    addr:  ((r.address || r.city || '').split(',')[0] || '').replace(/'/g,"\\'").slice(0,40),
    img:   (r.imageUrls?.[0] || '').replace(/'/g,"\\'"),
    time:  timeAgo(r.createdAt),
    score: r.aiScore || '',
    status:r.status || 'open',
    reporter:(r.userDisplayName||'Anonymous').replace(/'/g,"\\'").slice(0,20),
  }))

  let markerJS = ''
  for (const m of markers) {
    // Custom SVG pulse marker
    const svgIcon = (
      "<div style=\"position:relative;width:28px;height:28px\">" +
      "<div style=\"position:absolute;inset:0;border-radius:50%;background:" + m.pulse + ";animation:ping 1.8s ease-in-out infinite;opacity:0.6\"></div>" +
      "<div style=\"position:absolute;inset:4px;border-radius:50%;background:" + m.color + ";border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,.35)\"></div>" +
      "</div>"
    )

    const popupImg   = m.img ? "<img src='" + m.img + "' style='width:100%;height:120px;object-fit:cover;border-radius:8px;margin-bottom:10px' onerror=\"this.style.display='none'\"/>" : ''
    const scoreHtml  = m.score ? "<span style='background:#dcfce7;color:#166534;font-size:10px;padding:2px 7px;border-radius:20px;font-weight:600'>AI " + m.score + "/100</span>" : ''
    const statusClr  = m.status === 'resolved' ? '#6b7280' : m.status === 'in-progress' ? '#2563eb' : '#16a34a'
    const statusHtml = "<span style='background:" + statusClr + "20;color:" + statusClr + ";font-size:10px;padding:2px 8px;border-radius:20px;font-weight:600;text-transform:capitalize'>" + m.status + "</span>"

    const popupHtml = (
      "<div style='font-family:system-ui,sans-serif;width:240px;padding:4px'>" +
      popupImg +
      "<p style='font-weight:700;font-size:13px;color:#111;margin:0 0 6px;line-height:1.3'>" + m.title + "</p>" +
      "<div style='display:flex;gap:5px;flex-wrap:wrap;margin-bottom:8px'>" + statusHtml + scoreHtml + "</div>" +
      "<div style='font-size:11px;color:#6b7280;space-y:4px'>" +
      "<div style='margin-bottom:3px'>📁 " + m.cat + " &bull; ⚠️ " + m.sev + "</div>" +
      "<div style='margin-bottom:3px'>📍 " + m.addr + "</div>" +
      "<div style='margin-bottom:3px'>🕐 " + m.time + " &bull; 👤 " + m.reporter + "</div>" +
      "</div>" +
      "<button onclick=\"window.parent.postMessage({id:'" + m.id + "'},'*')\" " +
      "style='margin-top:10px;width:100%;padding:8px;background:#16a34a;color:white;border:none;" +
      "border-radius:8px;cursor:pointer;font-size:12px;font-weight:600'>View Details →</button>" +
      "</div>"
    )

    markerJS +=
      "(function(){" +
      "var el=document.createElement('div');" +
      "el.innerHTML='" + svgIcon.replace(/\\/g,'\\\\').replace(/'/g,"\\'") + "';" +
      "var ic=L.divIcon({html:el.innerHTML,className:'',iconSize:[28,28],iconAnchor:[14,14],popupAnchor:[0,-14]});" +
      "L.marker([" + m.lat + "," + m.lng + "],{icon:ic})" +
      ".addTo(map)" +
      ".bindPopup('" + popupHtml.replace(/\\/g,'\\\\').replace(/'/g,"\\'") + "',{maxWidth:260,className:'civic-popup'})" +
      ";})();\n"
  }

  const userMarker = userLoc
    ? "L.circleMarker([" + userLoc.lat + "," + userLoc.lng + "],{radius:8,fillColor:'#2563eb',color:'white',weight:3,fillOpacity:1}).addTo(map).bindPopup('📍 Your Location');\n"
    : ''

  const latLngs = reports.map(r => '[' + r.location.lat + ',' + r.location.lng + ']').join(',')
  const fitBounds = reports.length > 1
    ? 'try{map.fitBounds([' + latLngs + '],{padding:[40,40],maxZoom:15});}catch(e){}'
    : ''

  const css = (
    '<style>' +
    'body{margin:0;padding:0}' +
    '#map{width:100%;height:100vh}' +
    '@keyframes ping{0%{transform:scale(1);opacity:.6}70%{transform:scale(2.2);opacity:0}100%{transform:scale(2.2);opacity:0}}' +
    '.civic-popup .leaflet-popup-content-wrapper{border-radius:12px;box-shadow:0 8px 30px rgba(0,0,0,.15);border:1px solid #e5e7eb;padding:0}' +
    '.civic-popup .leaflet-popup-content{margin:12px}' +
    '.leaflet-control-zoom{border:none!important;box-shadow:0 2px 8px rgba(0,0,0,.15)!important}' +
    '.leaflet-control-zoom a{border-radius:8px!important;margin-bottom:2px!important;font-size:16px!important;width:30px!important;height:30px!important;line-height:30px!important}' +
    '</style>'
  )

  return (
    '<!DOCTYPE html><html><head><meta charset="utf-8"/>' +
    '<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>' +
    '<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"><' + '/script>' +
    css +
    '</head><body>' +
    '<div id="map"></div>' +
    '<script>' +
    'var map=L.map("map",{zoomControl:false}).setView([' + center.lat + ',' + center.lng + '],' + zoom + ');' +
    'L.control.zoom({position:"bottomright"}).addTo(map);' +
    'L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",' +
    '{attribution:"&copy; <a href=\\"https://www.openstreetmap.org/copyright\\">OpenStreetMap</a>",maxZoom:19}).addTo(map);' +
    markerJS +
    userMarker +
    fitBounds +
    '<' + '/script>' +
    '</body></html>'
  )
}

export default function MapPage() {
  const navigate = useNavigate()

  const [reports,   setReports]   = useState([])
  const [loading,   setLoading]   = useState(true)
  const [loadErr,   setLoadErr]   = useState('')
  const [showPanel, setShowPanel] = useState(false)
  const [catFilter, setCatFilter] = useState('All')
  const [sevFilter, setSevFilter] = useState('All')
  const [staFilter, setStaFilter] = useState('All')
  const [selected,  setSelected]  = useState(null)
  const [userLoc,   setUserLoc]   = useState(null)
  const [locLoading,setLocLoading]= useState(false)

  useEffect(() => {
    const unsub = subscribeToReports(
      d  => { setReports(d); setLoading(false) },
      () => { setLoadErr('Could not load reports.'); setLoading(false) }
    )
    return unsub
  }, [])

  useEffect(() => {
    function handler(e) {
      if (!e.data?.id) return
      const r = reports.find(x => x.id === e.data.id)
      if (r) setSelected(r)
    }
    window.addEventListener('message', handler)
    return () => window.removeEventListener('message', handler)
  }, [reports])

  function getLocation() {
    if (!navigator.geolocation) return
    setLocLoading(true)
    navigator.geolocation.getCurrentPosition(
      pos => { setUserLoc({ lat: pos.coords.latitude, lng: pos.coords.longitude }); setLocLoading(false) },
      ()  => setLocLoading(false),
      { timeout: 8000 }
    )
  }

  const geoReports = reports.filter(r => r.location?.lat && r.location?.lng)
  const filtered   = geoReports.filter(r => {
    const mc = catFilter === 'All' || catLabel[r.category] === catFilter
    const ms = sevFilter === 'All' || r.severity === sevFilter
    const mst= staFilter === 'All' || r.status === staFilter
    return mc && ms && mst
  })

  const center = useMemo(() => {
    if (userLoc) return userLoc
    if (filtered.length === 0) return { lat: 23.2599, lng: 77.4126 }
    return {
      lat: filtered.reduce((s,r) => s+r.location.lat, 0) / filtered.length,
      lng: filtered.reduce((s,r) => s+r.location.lng, 0) / filtered.length,
    }
  }, [filtered.length, catFilter, sevFilter, staFilter, userLoc])

  const osmHtml = useMemo(
    () => buildLeafletHtml(filtered, center, filtered.length > 1 ? 13 : 12, userLoc),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [filtered.length, catFilter, sevFilter, staFilter, center.lat, center.lng, userLoc]
  )

  const activeFilters = [catFilter, sevFilter, staFilter].filter(f => f !== 'All').length

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      <div className="flex-1 flex flex-col px-4 sm:px-6 lg:px-8 py-4 max-w-7xl mx-auto w-full">

        {/* Header */}
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Issue Map</h1>
            <p className="text-sm text-gray-500">
              {loading ? 'Loading…' : `${filtered.length} issue${filtered.length !== 1 ? 's' : ''} on map`}
              {geoReports.length > filtered.length && ` (${geoReports.length} total)`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {/* Current location */}
            <button onClick={getLocation} disabled={locLoading}
              title="Use my location"
              className="flex items-center gap-1.5 border border-gray-200 bg-white text-sm px-3 py-2 rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-60">
              {locLoading ? <Loader2 size={14} className="animate-spin text-green-600" /> : <Navigation size={14} className="text-green-600" />}
              <span className="hidden sm:inline">My Location</span>
            </button>
            {/* Filters */}
            <button onClick={() => setShowPanel(p => !p)}
              className="flex items-center gap-2 border border-gray-200 bg-white text-sm px-3 py-2 rounded-xl hover:bg-gray-50 transition-colors">
              <Layers size={14} />
              Filters
              {activeFilters > 0 && (
                <span className="w-5 h-5 bg-green-600 text-white text-xs rounded-full flex items-center justify-center font-bold">{activeFilters}</span>
              )}
            </button>
          </div>
        </div>

        {/* Filter Panel */}
        {showPanel && (
          <div className="bg-white border border-gray-200 rounded-xl p-4 mb-4 space-y-3">
            <div className="flex flex-wrap gap-4">
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Category</p>
                <div className="flex gap-1.5 flex-wrap">
                  {['All','Road','Lighting','Waste','Parks','Water','Safety'].map(c => (
                    <button key={c} onClick={() => setCatFilter(c)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${catFilter===c?'bg-green-600 text-white border-green-600':'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>{c}</button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Severity</p>
                <div className="flex gap-1.5 flex-wrap">
                  {['All','Low','Medium','High','Critical'].map(s => (
                    <button key={s} onClick={() => setSevFilter(s)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${sevFilter===s?'bg-green-600 text-white border-green-600':'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>{s}</button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Status</p>
                <div className="flex gap-1.5 flex-wrap">
                  {['All','open','in-progress','resolved'].map(s => (
                    <button key={s} onClick={() => setStaFilter(s)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${staFilter===s?'bg-green-600 text-white border-green-600':'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                      {s === 'All' ? 'All' : s.charAt(0).toUpperCase()+s.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            {activeFilters > 0 && (
              <button onClick={() => { setCatFilter('All'); setSevFilter('All'); setStaFilter('All') }}
                className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1">
                <X size={11} /> Clear all filters
              </button>
            )}
          </div>
        )}

        {loadErr && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">{loadErr}</div>
        )}

        {/* Map + side panel */}
        <div className="flex gap-4 flex-1" style={{ minHeight: '60vh' }}>
          {/* Map iframe */}
          <div className="relative flex-1 rounded-2xl overflow-hidden border border-gray-200 bg-gray-100 min-h-96">
            {loading ? (
              <div className="absolute inset-0 flex items-center justify-center">
                <Loader2 size={28} className="text-green-600 animate-spin" />
              </div>
            ) : (
              <iframe
                key={catFilter+sevFilter+staFilter+filtered.length+String(userLoc?.lat)}
                title="civic-map"
                className="w-full h-full border-0"
                srcDoc={osmHtml}
                sandbox="allow-scripts allow-same-origin"
              />
            )}

            {/* Floating Legend */}
            <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-sm rounded-xl p-3 shadow-lg z-10 pointer-events-none">
              <p className="text-xs font-semibold text-gray-700 mb-2">Severity</p>
              {[['Critical','#dc2626'],['High','#ea580c'],['Medium','#d97706'],['Low','#16a34a'],['Resolved','#6b7280']].map(([l,c]) => (
                <div key={l} className="flex items-center gap-2 text-xs text-gray-600 mb-1">
                  <div className="w-3 h-3 rounded-full border-2 border-white shadow-sm flex-shrink-0" style={{background:c}} />{l}
                </div>
              ))}
            </div>

            {!loading && geoReports.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center bg-white/80 flex-col gap-3">
                <MapPin size={36} className="text-gray-300" />
                <p className="text-gray-500 font-medium">No geo-tagged reports yet</p>
              </div>
            )}
            {!loading && geoReports.length > 0 && filtered.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center bg-white/80 flex-col gap-2">
                <Filter size={28} className="text-gray-300" />
                <p className="text-gray-500 font-medium">No issues match filters</p>
              </div>
            )}
          </div>

          {/* Side Panel */}
          {selected && (
            <div className="w-72 flex-shrink-0 bg-white rounded-2xl border border-gray-200 flex flex-col overflow-hidden">
              {selected.imageUrls?.[0] ? (
                <img src={selected.imageUrls[0]} alt="Issue" className="w-full h-36 object-cover flex-shrink-0" />
              ) : (
                <div className="w-full h-24 bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center flex-shrink-0">
                  <MapPin size={28} className="text-green-400" />
                </div>
              )}
              <div className="p-4 flex flex-col flex-1 overflow-y-auto">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-bold text-gray-900 text-sm leading-snug pr-2 flex-1">{selected.title}</h3>
                  <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600 flex-shrink-0 mt-0.5">
                    <X size={15} />
                  </button>
                </div>

                <div className="flex flex-wrap gap-1.5 mb-3">
                  <BadgeChip label={selected.status} variant={selected.status} />
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    selected.severity==='Critical'?'bg-red-100 text-red-600':
                    selected.severity==='High'?'bg-orange-100 text-orange-600':
                    selected.severity==='Medium'?'bg-yellow-100 text-yellow-600':
                    'bg-gray-100 text-gray-600'}`}>
                    {selected.severity}
                  </span>
                  {selected.aiScore && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-green-50 text-green-700 font-medium">AI {selected.aiScore}/100</span>
                  )}
                </div>

                <div className="space-y-1.5 text-xs text-gray-500 mb-3">
                  <div className="flex items-center gap-1.5"><MapPin size={10} className="flex-shrink-0" />{selected.address?.split(',')[0]||selected.city||'—'}</div>
                  <div className="flex items-center gap-1.5"><Tag size={10} className="flex-shrink-0" />{catLabel[selected.category]||selected.category}</div>
                  <div className="flex items-center gap-1.5"><ThumbsUp size={10} className="flex-shrink-0" />{selected.votes||0} votes · {selected.verifiedCount||0} verified</div>
                </div>

                {selected.aiSummary && (
                  <p className="text-xs text-gray-600 bg-green-50 border border-green-100 rounded-lg p-2.5 mb-3 leading-relaxed flex-1">
                    {selected.aiSummary.slice(0,140)}{selected.aiSummary.length>140?'…':''}
                  </p>
                )}

                <button onClick={() => navigate('/issue/'+selected.id)}
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2.5 rounded-xl text-sm transition-colors mt-auto">
                  View Full Details →
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}