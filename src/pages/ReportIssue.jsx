import { useState, useRef, useEffect, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Triangle, Zap, Trash2, Trees, Droplets, ShieldAlert,
  Camera, MapPin, X, Loader2, CheckCircle,
} from 'lucide-react'
import Navbar from '../components/Navbar'
import { useAuth } from '../context/AuthContext'
import { createReport, saveAiAnalysis } from '../lib/reportsService'
import { analyzeIssue } from '../lib/gemini'

const GMAPS_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY

const categories = [
  { id: 'road',      icon: Triangle,    label: 'Road & Potholes' },
  { id: 'lighting',  icon: Zap,         label: 'Street Lighting' },
  { id: 'waste',     icon: Trash2,      label: 'Waste & Sanitation' },
  { id: 'parks',     icon: Trees,       label: 'Parks & Green Spaces' },
  { id: 'water',     icon: Droplets,    label: 'Water & Drainage' },
  { id: 'vandalism', icon: ShieldAlert, label: 'Vandalism & Safety' },
]

const severities = ['Low', 'Medium', 'High', 'Critical']
const severityColors = {
  Low: 'bg-gray-600 border-gray-600',
  Medium: 'bg-yellow-500 border-yellow-500',
  High: 'bg-orange-500 border-orange-500',
  Critical: 'bg-red-600 border-red-600',
}

const STEPS = ['Category', 'Details', 'Location', 'Photos', 'Review']

/* ─── Google Maps loader ──────────────────────────────────────────────────── */
let gmapsLoaded = false
let gmapsCallbacks = []

function loadGoogleMaps(apiKey) {
  return new Promise((resolve) => {
    if (window.google?.maps) { resolve(); return }
    if (gmapsLoaded) { gmapsCallbacks.push(resolve); return }
    gmapsLoaded = true
    window.__gmapsInit = () => {
      gmapsCallbacks.forEach(cb => cb())
      gmapsCallbacks = []
      resolve()
    }
    const script = document.createElement('script')
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&callback=__gmapsInit`
    script.async = true
    document.head.appendChild(script)
  })
}

/* ─── Google Map picker component ─────────────────────────────────────────── */
function GoogleMapPicker({ location, onLocationChange }) {
  const mapRef = useRef(null)
  const mapInstance = useRef(null)
  const markerRef = useRef(null)
  const [ready, setReady] = useState(!!window.google?.maps)

  useEffect(() => {
    if (!GMAPS_KEY) return
    loadGoogleMaps(GMAPS_KEY).then(() => setReady(true))
  }, [])

  useEffect(() => {
    if (!ready || !mapRef.current || mapInstance.current) return

    const center = location
      ? { lat: location.lat, lng: location.lng }
      : { lat: 23.2599, lng: 77.4126 } // Bhopal default

    const map = new window.google.maps.Map(mapRef.current, {
      center,
      zoom: location ? 15 : 12,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
    })

    const marker = new window.google.maps.Marker({
      map,
      position: center,
      draggable: true,
      title: 'Issue location',
    })

    map.addListener('click', (e) => {
      const lat = e.latLng.lat()
      const lng = e.latLng.lng()
      marker.setPosition({ lat, lng })
      reverseGeocode(lat, lng, onLocationChange)
    })

    marker.addListener('dragend', (e) => {
      const lat = e.latLng.lat()
      const lng = e.latLng.lng()
      reverseGeocode(lat, lng, onLocationChange)
    })

    mapInstance.current = map
    markerRef.current = marker
  }, [ready])

  // Pan to new location when it changes externally (Use My Location)
  useEffect(() => {
    if (!mapInstance.current || !location) return
    mapInstance.current.panTo({ lat: location.lat, lng: location.lng })
    mapInstance.current.setZoom(15)
    markerRef.current?.setPosition({ lat: location.lat, lng: location.lng })
  }, [location?.lat, location?.lng])

  if (!GMAPS_KEY) {
    // OSM iframe fallback
    return (
      <div className="rounded-xl overflow-hidden border border-gray-200 h-52">
        {location ? (
          <iframe
            title="map"
            className="w-full h-full border-0"
            src={`https://www.openstreetmap.org/export/embed.html?bbox=${location.lng-0.01},${location.lat-0.01},${location.lng+0.01},${location.lat+0.01}&layer=mapnik&marker=${location.lat},${location.lng}`}
          />
        ) : (
          <div className="w-full h-full bg-gray-100 flex items-center justify-center text-gray-400 text-sm">
            Map preview will appear after getting location
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="rounded-xl overflow-hidden border border-gray-200 h-52 relative">
      <div ref={mapRef} className="w-full h-full" />
      {!ready && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
          <Loader2 size={20} className="animate-spin text-green-600" />
        </div>
      )}
    </div>
  )
}

function reverseGeocode(lat, lng, callback) {
  if (window.google?.maps?.Geocoder) {
    const geocoder = new window.google.maps.Geocoder()
    geocoder.geocode({ location: { lat, lng } }, (results, status) => {
      if (status === 'OK' && results[0]) {
        const addr = results[0].formatted_address
        const cityComp = results[0].address_components.find(c =>
          c.types.includes('locality') || c.types.includes('administrative_area_level_2')
        )
        callback({ lat, lng }, addr, cityComp?.long_name || '')
      } else {
        callback({ lat, lng }, `${lat.toFixed(5)}, ${lng.toFixed(5)}`, '')
      }
    })
  } else {
    // OSM nominatim fallback
    fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`)
      .then(r => r.json())
      .then(d => {
        callback({ lat, lng }, d.display_name?.split(',').slice(0, 3).join(',') || `${lat.toFixed(4)}, ${lng.toFixed(4)}`, d.address?.city || d.address?.town || '')
      })
      .catch(() => callback({ lat, lng }, `${lat.toFixed(5)}, ${lng.toFixed(5)}`, ''))
  }
}

export default function ReportIssue() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const fileInputRef = useRef(null)

  const [step, setStep] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const [category, setCategory] = useState('road')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [severity, setSeverity] = useState('High')
  const [address, setAddress] = useState('')
  const [city, setCity] = useState('')
  const [location, setLocation] = useState(null)
  const [locLoading, setLocLoading] = useState(false)
  const [photos, setPhotos] = useState([])
  const [photoPreviews, setPhotoPreviews] = useState([])

  const handleLocationChange = useCallback((loc, addr, ct) => {
    setLocation(loc)
    setAddress(addr)
    setCity(ct)
  }, [])

  function useMyLocation() {
    if (!navigator.geolocation) return
    setLocLoading(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords
        reverseGeocode(lat, lng, (loc, addr, ct) => {
          handleLocationChange(loc, addr, ct)
          setLocLoading(false)
        })
      },
      () => setLocLoading(false),
      { timeout: 8000 }
    )
  }

  function handleFiles(files) {
    const arr = Array.from(files).slice(0, 5 - photos.length)
    setPhotos(p => [...p, ...arr])
    setPhotoPreviews(pv => [...pv, ...arr.map(f => URL.createObjectURL(f))])
  }

  function removePhoto(i) {
    const p = [...photos]; p.splice(i, 1); setPhotos(p)
    const pv = [...photoPreviews]; URL.revokeObjectURL(pv[i]); pv.splice(i, 1); setPhotoPreviews(pv)
  }

  function canProceed() {
    if (step === 0) return !!category
    if (step === 1) return title.trim().length > 5 && description.trim().length > 10
    if (step === 2) return address.trim().length > 3
    return true
  }

  async function handleSubmit() {
    setSubmitting(true)
    setError('')
    try {
      const reportId = await createReport(
        { category, title, description, location, address, city, severity },
        photos, user.uid, user.displayName || user.email
      )
      analyzeIssue({ category, title, description, severity }).then(analysis => {
        saveAiAnalysis(reportId, analysis)
      })
      navigate(`/analysis/${reportId}`)
    } catch (err) {
      console.error(err)
      setError('Failed to submit. Check your connection and try again.')
      setSubmitting(false)
    }
  }

  const catObj = categories.find(c => c.id === category)

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
          <Link to="/dashboard" className="hover:text-gray-700">Dashboard</Link>
          <span>›</span>
          <span className="text-gray-900 font-medium">Report Issue</span>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-1">Report a Civic Issue</h1>
        <p className="text-gray-500 text-sm mb-8">AI will analyze and route it to the right department.</p>

        {/* Progress */}
        <div className="flex items-center gap-2 mb-10 overflow-x-auto pb-2">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center gap-2 flex-shrink-0">
              <button onClick={() => i < step && setStep(i)} className={`flex items-center gap-2 ${i <= step ? 'cursor-pointer' : 'cursor-default'}`}>
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  i < step ? 'bg-green-600 text-white' :
                  i === step ? 'bg-green-600 text-white ring-4 ring-green-100' :
                  'border-2 border-gray-200 text-gray-400'
                }`}>
                  {i < step ? <CheckCircle size={14} /> : i + 1}
                </div>
                <span className={`text-sm font-medium ${i <= step ? 'text-green-600' : 'text-gray-400'}`}>{s}</span>
              </button>
              {i < 4 && <div className={`w-8 h-px flex-shrink-0 ${i < step ? 'bg-green-400' : 'bg-gray-200'}`} />}
            </div>
          ))}
        </div>

        {/* Step 0: Category */}
        {step === 0 && (
          <div className="mb-10">
            <h2 className="font-bold text-gray-900 text-lg mb-1">What type of issue is it?</h2>
            <p className="text-sm text-gray-500 mb-5">Select the category that best describes the problem.</p>
            <div className="grid grid-cols-3 gap-3">
              {categories.map(({ id, icon: Icon, label }) => (
                <button key={id} onClick={() => setCategory(id)}
                  className={`flex flex-col items-center gap-3 p-5 rounded-xl border-2 transition-all ${
                    category === id ? 'border-green-600 bg-green-50 text-green-700' : 'border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                  }`}>
                  <Icon size={22} />
                  <span className="text-sm font-medium text-center">{label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 1: Details */}
        {step === 1 && (
          <div className="mb-10">
            <h2 className="font-bold text-gray-900 text-lg mb-5">Describe the Issue</h2>
            <div className="mb-5">
              <label className="text-sm font-semibold text-gray-700 block mb-2">Issue Title *</label>
              <input type="text" value={title} onChange={e => setTitle(e.target.value)}
                placeholder="e.g. Large pothole causing vehicle damage"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
            </div>
            <div className="mb-5">
              <label className="text-sm font-semibold text-gray-700 block mb-2">Detailed Description *</label>
              <textarea value={description} onChange={e => setDescription(e.target.value)}
                rows={5} maxLength={500}
                placeholder="Describe the issue in detail — size, duration, safety impact..."
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none" />
              <p className="text-xs text-gray-400 text-right mt-1">{description.length} / 500</p>
            </div>
            <div>
              <label className="text-sm font-semibold text-gray-700 block mb-3">Severity</label>
              <div className="flex gap-3">
                {severities.map(s => (
                  <button key={s} onClick={() => setSeverity(s)}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all border-2 ${
                      severity === s ? `${severityColors[s]} text-white` : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}>{s}</button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Location (Google Maps) */}
        {step === 2 && (
          <div className="mb-10">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-gray-900 text-lg">Location</h2>
              <button onClick={useMyLocation} disabled={locLoading}
                className="flex items-center gap-1.5 text-sm text-green-600 font-medium hover:text-green-700 disabled:opacity-60">
                {locLoading ? <Loader2 size={14} className="animate-spin" /> : <MapPin size={14} />}
                Use my location
              </button>
            </div>

            <div className="mb-4">
              <GoogleMapPicker location={location} onLocationChange={handleLocationChange} />
              {GMAPS_KEY && (
                <p className="text-xs text-gray-400 mt-2 text-center">Click on the map or drag the marker to set the exact location</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-semibold text-gray-700 block mb-2">Street Address *</label>
                <div className="relative">
                  <MapPin size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input type="text" value={address} onChange={e => setAddress(e.target.value)}
                    placeholder="Enter street address"
                    className="w-full pl-8 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
                </div>
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-700 block mb-2">City / District</label>
                <input type="text" value={city} onChange={e => setCity(e.target.value)}
                  placeholder="e.g. Bhopal"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Photos */}
        {step === 3 && (
          <div className="mb-10">
            <h2 className="font-bold text-gray-900 text-lg mb-5">Add Photos <span className="text-gray-400 font-normal">(optional)</span></h2>
            <div onDrop={e => { e.preventDefault(); handleFiles(e.dataTransfer.files) }}
              onDragOver={e => e.preventDefault()}
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-gray-200 rounded-xl p-10 text-center hover:border-green-400 transition-colors cursor-pointer">
              <Camera size={28} className="mx-auto text-gray-400 mb-3" />
              <p className="text-sm font-medium text-gray-700">Drag & drop photos here</p>
              <p className="text-xs text-gray-400 mt-1">or click to browse · Max 5 photos, 10MB each</p>
            </div>
            <input ref={fileInputRef} type="file" multiple accept="image/*" className="hidden"
              onChange={e => handleFiles(e.target.files)} />
            {photoPreviews.length > 0 && (
              <div className="flex gap-3 mt-4 flex-wrap">
                {photoPreviews.map((src, i) => (
                  <div key={i} className="relative">
                    <img src={src} alt="Preview" className="w-32 h-24 object-cover rounded-xl border border-gray-200" />
                    <button onClick={() => removePhoto(i)}
                      className="absolute -top-2 -right-2 w-5 h-5 bg-white border border-gray-300 rounded-full flex items-center justify-center shadow-sm hover:bg-gray-100">
                      <X size={10} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Step 4: Review */}
        {step === 4 && (
          <div className="mb-10">
            <h2 className="font-bold text-gray-900 text-lg mb-5">Review Your Report</h2>
            <div className="bg-gray-50 rounded-2xl p-6 space-y-4">
              {[
                ['Category', catObj?.label],
                ['Title', title],
                ['Severity', severity],
                ['Address', address],
                ['City', city || '—'],
                ['Description', description],
                ['Photos', `${photos.length} photo${photos.length !== 1 ? 's' : ''} attached`],
              ].map(([label, value]) => (
                <div key={label} className="flex gap-4">
                  <span className="text-sm text-gray-500 w-24 flex-shrink-0">{label}</span>
                  <span className="text-sm font-medium text-gray-900 flex-1">{value}</span>
                </div>
              ))}
            </div>
            {error && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">{error}</div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
          <button onClick={() => step > 0 && setStep(step - 1)} disabled={step === 0}
            className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors disabled:opacity-40">
            ← Back
          </button>
          {step < 4 ? (
            <button onClick={() => setStep(step + 1)} disabled={!canProceed()}
              className="bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white font-semibold px-6 py-2.5 rounded-xl text-sm transition-colors">
              Continue →
            </button>
          ) : (
            <button onClick={handleSubmit} disabled={submitting}
              className="bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-semibold px-6 py-2.5 rounded-xl text-sm transition-colors flex items-center gap-2">
              {submitting ? <><Loader2 size={14} className="animate-spin" /> Submitting…</> : 'Submit & Analyze ✦'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}