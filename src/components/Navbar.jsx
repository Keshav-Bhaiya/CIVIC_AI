import { useState, useRef, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Flag, LogOut, User, ChevronDown, Menu, X, LayoutDashboard, Map, BarChart2, Users, FileText } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const navLinks = [
  { label: 'Dashboard',   to: '/dashboard',              icon: LayoutDashboard },
  { label: 'Report Issue',to: '/report-issue',           icon: FileText },
  { label: 'Community',   to: '/community-verification', icon: Users },
  { label: 'Map',         to: '/map',                    icon: Map },
  { label: 'Analytics',   to: '/analytics',              icon: BarChart2 },
  { label: 'Profile',     to: '/profile',                icon: User },
]

export default function Navbar() {
  const location  = useLocation()
  const navigate  = useNavigate()
  const { user, logout } = useAuth()

  const [menuOpen,   setMenuOpen]   = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const menuRef   = useRef(null)
  const drawerRef = useRef(null)

  // Close avatar dropdown on outside click
  useEffect(() => {
    function handler(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Close mobile drawer on outside click
  useEffect(() => {
    function handler(e) {
      if (drawerOpen && drawerRef.current && !drawerRef.current.contains(e.target)) {
        setDrawerOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [drawerOpen])

  // Lock body scroll when drawer open
  useEffect(() => {
    document.body.style.overflow = drawerOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [drawerOpen])

  async function handleLogout() {
    setMenuOpen(false)
    setDrawerOpen(false)
    await logout()
    navigate('/login')
  }

  function handleNavClick() { setDrawerOpen(false) }

  const displayName = user?.displayName || user?.profile?.name || 'User'
  const photoURL    = user?.photoURL || null
  const initials    = displayName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)

  return (
    <>
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">

            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 flex-shrink-0">
              <div className="w-7 h-7 bg-green-600 rounded-full flex items-center justify-center">
                <div className="w-3 h-3 bg-white rounded-full opacity-90" />
              </div>
              <span className="font-bold text-gray-900 text-base">CivicAI</span>
            </Link>

            {/* Desktop nav links */}
            <div className="hidden md:flex items-center gap-6">
              {navLinks.map(({ label, to }) => {
                const active = location.pathname === to
                return (
                  <Link
                    key={to}
                    to={to}
                    className={`text-sm font-medium transition-colors ${
                      active ? 'text-green-600 font-semibold' : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    {label}
                  </Link>
                )
              })}
            </div>

            {/* Right: CTA + avatar (desktop) + hamburger (mobile) */}
            <div className="flex items-center gap-3">
              {/* Report Issue CTA — hidden on very small screens */}
              <button
                onClick={() => navigate('/report-issue')}
                className="hidden sm:flex bg-green-600 hover:bg-green-700 text-white text-sm font-semibold px-4 py-1.5 rounded-full transition-colors items-center gap-1.5"
              >
                <Flag size={14} />
                Report Issue
              </button>

              {/* Avatar dropdown — desktop only */}
              <div className="hidden md:block relative" ref={menuRef}>
                <button
                  onClick={() => setMenuOpen(p => !p)}
                  className="flex items-center gap-1.5 focus:outline-none"
                >
                  {photoURL ? (
                    <img src={photoURL} alt={displayName} className="w-8 h-8 rounded-full object-cover border-2 border-gray-200" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-green-600 flex items-center justify-center border-2 border-gray-200">
                      <span className="text-white text-xs font-bold">{initials}</span>
                    </div>
                  )}
                  <ChevronDown size={13} className={`text-gray-500 transition-transform ${menuOpen ? 'rotate-180' : ''}`} />
                </button>

                {menuOpen && (
                  <div className="absolute right-0 top-full mt-2 w-56 bg-white border border-gray-200 rounded-xl shadow-lg py-1 z-50">
                    <div className="px-4 py-3 border-b border-gray-100">
                      <p className="text-sm font-semibold text-gray-900 truncate">{displayName}</p>
                      <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                    </div>
                    <Link to="/profile" onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                      <User size={14} className="text-gray-400" /> My Profile
                    </Link>
                    <button onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors">
                      <LogOut size={14} /> Sign Out
                    </button>
                  </div>
                )}
              </div>

              {/* Hamburger — mobile only */}
              <button
                onClick={() => setDrawerOpen(true)}
                className="md:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
                aria-label="Open menu"
              >
                <Menu size={20} />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* ── Mobile Drawer ───────────────────────────────────────────────────── */}
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/40 z-40 md:hidden transition-opacity duration-300 ${
          drawerOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        aria-hidden="true"
      />

      {/* Drawer panel */}
      <div
        ref={drawerRef}
        className={`fixed top-0 right-0 h-full w-72 bg-white shadow-2xl z-50 md:hidden flex flex-col
          transition-transform duration-300 ease-in-out
          ${drawerOpen ? 'translate-x-0' : 'translate-x-full'}`}
      >
        {/* Drawer header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-green-600 rounded-full flex items-center justify-center">
              <div className="w-2.5 h-2.5 bg-white rounded-full" />
            </div>
            <span className="font-bold text-gray-900">CivicAI</span>
          </div>
          <button
            onClick={() => setDrawerOpen(false)}
            className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
            aria-label="Close menu"
          >
            <X size={18} />
          </button>
        </div>

        {/* User info */}
        <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-3">
          {photoURL ? (
            <img src={photoURL} alt={displayName} className="w-10 h-10 rounded-full object-cover border-2 border-gray-200" />
          ) : (
            <div className="w-10 h-10 rounded-full bg-green-600 flex items-center justify-center flex-shrink-0">
              <span className="text-white text-sm font-bold">{initials}</span>
            </div>
          )}
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-900 truncate">{displayName}</p>
            <p className="text-xs text-gray-500 truncate">{user?.email}</p>
          </div>
        </div>

        {/* Nav links */}
        <nav className="flex-1 px-3 py-4 overflow-y-auto">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-2 mb-3">Navigation</p>
          <div className="space-y-1">
            {navLinks.map(({ label, to, icon: Icon }) => {
              const active = location.pathname === to
              return (
                <Link
                  key={to}
                  to={to}
                  onClick={handleNavClick}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                    active
                      ? 'bg-green-50 text-green-700'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Icon size={17} className={active ? 'text-green-600' : 'text-gray-400'} />
                  {label}
                  {active && <div className="ml-auto w-1.5 h-1.5 bg-green-500 rounded-full" />}
                </Link>
              )
            })}
          </div>
        </nav>

        {/* Drawer footer */}
        <div className="px-4 pb-6 pt-3 border-t border-gray-100 space-y-2">
          <Link
            to="/report-issue"
            onClick={handleNavClick}
            className="flex items-center justify-center gap-2 w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-xl text-sm transition-colors"
          >
            <Flag size={15} /> Report New Issue
          </Link>
          <button
            onClick={handleLogout}
            className="flex items-center justify-center gap-2 w-full border border-gray-200 text-red-600 hover:bg-red-50 font-medium py-2.5 rounded-xl text-sm transition-colors"
          >
            <LogOut size={15} /> Sign Out
          </button>
        </div>
      </div>
    </>
  )
}