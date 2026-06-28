import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Mail, Lock, User, Eye, EyeOff, Shield, Cpu, Users } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

export default function Signup() {
  const [showPassword, setShowPassword] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [agreed, setAgreed] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const { signUpWithEmail, signInWithGoogle } = useAuth()
  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    if (!agreed) {
      setError('Please agree to the Terms of Service and Privacy Policy.')
      return
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    setError('')
    setLoading(true)
    try {
      await signUpWithEmail(email, password, name)
      navigate('/dashboard', { replace: true })
    } catch (err) {
      setError(getErrorMessage(err.code))
    } finally {
      setLoading(false)
    }
  }

  async function handleGoogle() {
    setError('')
    setLoading(true)
    try {
      await signInWithGoogle()
      navigate('/dashboard', { replace: true })
    } catch (err) {
      setError(getErrorMessage(err.code))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Panel */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <img
          src="https://images.pexels.com/photos/1486222/pexels-photo-1486222.jpeg?auto=compress&cs=tinysrgb&w=800&h=1200&dpr=1"
          alt="City"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900/90 via-gray-900/70 to-transparent" />
        <div className="relative z-10 p-10 flex flex-col h-full">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-7 h-7 bg-green-500 rounded-full flex items-center justify-center">
              <div className="w-2.5 h-2.5 bg-white rounded-full" />
            </div>
            <span className="font-bold text-white">CivicAI</span>
          </Link>
          <div className="mt-auto mb-8">
            <h2 className="text-4xl font-bold text-white leading-tight mb-2">Make your city</h2>
            <h2 className="text-4xl font-bold text-green-400 leading-tight mb-6">a better place.</h2>
            <p className="text-gray-300 text-sm leading-relaxed max-w-sm">
              Be part of the movement. Report issues, verify reports, and help your community thrive with AI-powered civic engagement.
            </p>
            <div className="grid grid-cols-3 gap-3 mt-8">
              {[
                { value: '340+', label: 'Cities' },
                { value: '2.1M', label: 'Citizens' },
                { value: '94%', label: 'Satisfaction' },
              ].map(({ value, label }) => (
                <div key={label} className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/10">
                  <p className="text-white font-bold text-lg">{value}</p>
                  <p className="text-gray-300 text-xs">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="flex gap-4 mb-8">
            <Link to="/login" className="pb-2 text-sm font-medium text-gray-400 border-b-2 border-transparent hover:text-gray-700 transition-colors">
              Sign In
            </Link>
            <Link to="/signup" className="pb-2 text-sm font-semibold text-gray-900 border-b-2 border-green-600">
              Create Account
            </Link>
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-1">Join CivicAI</h1>
          <p className="text-gray-500 text-sm mb-7">Start making your community better today.</p>

          {error && (
            <div className="mb-5 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">
              {error}
            </div>
          )}

          <button
            onClick={handleGoogle}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 border border-gray-200 rounded-xl py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors mb-5 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </button>

          <div className="flex items-center gap-3 mb-5">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-xs text-gray-400">or continue with email</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1.5">Full Name</label>
              <div className="relative">
                <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Alex Johnson"
                  required
                  className="w-full pl-9 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1.5">Email address</label>
              <div className="relative">
                <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="w-full pl-9 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1.5">Password</label>
              <div className="relative">
                <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Min 8 characters"
                  required
                  className="w-full pl-9 pr-10 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <Eye size={15} /> : <EyeOff size={15} />}
                </button>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <input
                type="checkbox"
                id="terms"
                checked={agreed}
                onChange={e => setAgreed(e.target.checked)}
                className="w-4 h-4 mt-0.5 text-green-600 border-gray-300 rounded accent-green-600"
              />
              <label htmlFor="terms" className="text-sm text-gray-600">
                I agree to the{' '}
                <a href="#" className="text-green-600 hover:underline">Terms of Service</a>
                {' '}and{' '}
                <a href="#" className="text-green-600 hover:underline">Privacy Policy</a>
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating account…' : 'Create Account →'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-5">
            Already have an account?{' '}
            <Link to="/login" className="text-green-600 font-semibold hover:underline">Sign in</Link>
          </p>

          <div className="flex flex-col gap-2 mt-8 border-t border-gray-100 pt-6">
            {[
              { icon: <Shield size={13} className="text-green-600" />, text: 'Secure Authentication' },
              { icon: <Cpu size={13} className="text-blue-500" />, text: 'Powered by Google AI' },
              { icon: <Users size={13} className="text-gray-500" />, text: 'Community Verified Platform' },
            ].map(({ icon, text }) => (
              <div key={text} className="flex items-center gap-2 text-xs text-gray-500">
                {icon} {text}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function getErrorMessage(code) {
  switch (code) {
    case 'auth/email-already-in-use':
      return 'An account with this email already exists.'
    case 'auth/invalid-email':
      return 'Please enter a valid email address.'
    case 'auth/weak-password':
      return 'Password must be at least 8 characters.'
    case 'auth/popup-closed-by-user':
      return 'Google sign-in was cancelled.'
    default:
      return 'Something went wrong. Please try again.'
  }
}