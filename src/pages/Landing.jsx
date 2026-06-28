import { useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Camera, CheckCircle, Users, TrendingUp, Zap, AlertTriangle,
  BarChart2, Activity, ArrowRight, MapPin, Shield, Star,
  ChevronDown, Mail, Phone, Twitter, Github,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'

function scrollTo(id) {
  const el = document.getElementById(id)
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

function LandingNavbar() {
  const { user } = useAuth()
  return (
    <nav className="bg-white border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
        <button onClick={() => window.scrollTo({ top:0, behavior:'smooth' })} className="flex items-center gap-2">
          <div className="w-7 h-7 bg-green-600 rounded-full flex items-center justify-center">
            <div className="w-2.5 h-2.5 bg-white rounded-full"/>
          </div>
          <span className="font-bold text-gray-900">CivicAI</span>
        </button>
        <div className="hidden md:flex items-center gap-8">
          {[['features','Features'],['how-it-works','How It Works'],['cities','Impact'],['testimonials','Community'],['faq','FAQ'],['contact','Contact']].map(([id,label]) => (
            <button key={id} onClick={() => scrollTo(id)} className="text-sm text-gray-600 hover:text-gray-900 transition-colors">{label}</button>
          ))}
        </div>
        <div className="flex items-center gap-3">
          {user ? (
            <Link to="/dashboard" className="bg-green-600 hover:bg-green-700 text-white text-sm font-semibold px-4 py-1.5 rounded-full transition-colors">
              Dashboard →
            </Link>
          ) : (
            <>
              <Link to="/login" className="text-sm font-medium text-gray-700 hover:text-gray-900">Log in</Link>
              <Link to="/signup" className="bg-green-600 hover:bg-green-700 text-white text-sm font-semibold px-4 py-1.5 rounded-full transition-colors">
                Get Started
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}

const howItWorks = [
  { num:'01', icon:<Camera size={26}/>,       title:'Report Issue',          desc:'Snap a photo, describe the problem. GPS pinpoints the location automatically.' },
  { num:'02', icon:<Zap size={26}/>,          title:'AI Analysis',           desc:'Gemini AI classifies severity, identifies the right department, and routes instantly.' },
  { num:'03', icon:<Users size={26}/>,        title:'Community Verification', desc:'Neighbours vote and confirm. Quality reports rise to the top.' },
  { num:'04', icon:<CheckCircle size={26}/>,  title:'Resolution Tracking',   desc:'Officials act. You get notified. Every step transparent and accountable.' },
]

const testimonials = [
  { text:'"CivicAI transformed how we handle citizen reports. Resolution time dropped 60% in Q1."', name:'Sarah Chen', role:'City Council Member', metric:'60%', metricLabel:'faster resolution', img:'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=50&h=50&dpr=1' },
  { text:'"Finally a tool that actually listens. Our neighborhood has never been more connected."', name:'Marcus Williams', role:'Community Organizer', metric:'3.2K', metricLabel:'issues resolved', img:'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=50&h=50&dpr=1' },
  { text:'"The AI analysis is remarkably accurate. Like having a smart assistant for every report."', name:'Priya Nair', role:'Urban Planner', metric:'94%', metricLabel:'AI accuracy', img:'https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=50&h=50&dpr=1' },
]

const cityImpacts = [
  { img:'https://images.pexels.com/photos/1687093/pexels-photo-1687093.jpeg?auto=compress&cs=tinysrgb&w=300&h=200&dpr=1', title:'Cleaner Streets', metric:'28%', desc:'28% reduction in unresolved street-level incidents within 6 months.' },
  { img:'https://images.pexels.com/photos/1486974/pexels-photo-1486974.jpeg?auto=compress&cs=tinysrgb&w=300&h=200&dpr=1', title:'Safer Communities', metric:'3x',  desc:'Public safety issues resolved 3x faster with AI routing.' },
  { img:'https://images.pexels.com/photos/1078884/pexels-photo-1078884.jpeg?auto=compress&cs=tinysrgb&w=300&h=200&dpr=1', title:'Faster Resolution', metric:'36h', desc:'Average issue closed in 36 hours — down from 11 days.' },
  { img:'https://images.pexels.com/photos/3184418/pexels-photo-3184418.jpeg?auto=compress&cs=tinysrgb&w=300&h=200&dpr=1', title:'Citizen Engagement', metric:'5x',  desc:'Active participation rates 5x higher than legacy platforms.' },
]

const faqItems = [
  { q:'Is CivicAI free to use?', a:'Yes! CivicAI is completely free for citizens. Report issues, verify reports, and track resolutions at no cost.' },
  { q:'How does AI analyze my report?', a:'Our Gemini-powered AI reads your description to classify the issue type, assess severity, and route it to the right city department automatically.' },
  { q:'How long does it take to resolve an issue?', a:'Average resolution time is 36 hours for high-severity issues. Low-severity issues typically resolve within 5–7 business days.' },
  { q:'Can I report anonymously?', a:'You need a free account to report, but your details are never shared publicly — only visible to city officials managing the report.' },
  { q:'What happens after I report?', a:'Your report goes through AI analysis, community verification, is routed to the relevant department, and you receive status updates at each step.' },
  { q:'Which cities are supported?', a:'CivicAI works anywhere. Report issues from any city — our platform does not restrict by geography.' },
]

export default function Landing() {
  const { user } = useAuth()
  return (
    <div className="min-h-screen bg-white">
      <LandingNavbar />

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 pt-16 pb-20">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <div className="flex items-center gap-2 mb-5">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"/>
              <span className="text-sm text-gray-600">Powered by Gemini AI · 320+ Communities</span>
            </div>
            <h1 className="text-5xl md:text-6xl font-extrabold text-gray-900 leading-tight mb-2">Report. Verify.</h1>
            <h1 className="text-5xl md:text-6xl font-extrabold text-green-600 leading-tight mb-6">Resolve.</h1>
            <p className="text-gray-500 text-lg leading-relaxed mb-8 max-w-md">
              AI-powered civic issue reporting that empowers citizens and holds governments accountable.
            </p>
            <div className="flex items-center gap-4 flex-wrap">
              <Link to={user?'/report-issue':'/signup'} className="bg-green-600 hover:bg-green-700 text-white font-semibold px-6 py-3 rounded-full transition-colors flex items-center gap-2">
                Report an Issue <ArrowRight size={16}/>
              </Link>
              <button onClick={() => scrollTo('how-it-works')} className="flex items-center gap-2 text-gray-700 font-medium border border-gray-300 px-5 py-3 rounded-full hover:bg-gray-50 transition-colors">
                How It Works
              </button>
            </div>
            <div className="grid grid-cols-3 gap-6 mt-10 pt-8 border-t border-gray-100">
              {[['12.5K+','Issues Reported'],['89%','Resolution Rate'],['1.6K+','Active Citizens']].map(([v,l]) => (
                <div key={l}><p className="text-xl font-bold text-gray-900">{v}</p><p className="text-xs text-gray-500 mt-0.5">{l}</p></div>
              ))}
            </div>
          </div>
          <div className="relative hidden md:block">
            <div className="rounded-2xl overflow-hidden shadow-2xl">
              <img src="https://images.pexels.com/photos/1486222/pexels-photo-1486222.jpeg?auto=compress&cs=tinysrgb&w=600&h=400&dpr=1" alt="City" className="w-full h-80 object-cover"/>
            </div>
            <div className="absolute top-4 left-4 bg-white rounded-xl shadow-lg p-3 max-w-48">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center"><Zap size={10} className="text-white"/></div>
                <span className="text-xs font-semibold">AI Detected</span>
                <span className="text-xs text-red-500 font-medium">High</span>
              </div>
              <p className="text-xs text-gray-500">Pothole on Main St</p>
            </div>
            <div className="absolute bottom-4 right-4 bg-white rounded-xl shadow-lg p-3">
              <p className="text-xs text-gray-500 mb-1">Community Score</p>
              <p className="text-2xl font-bold text-gray-900">94<span className="text-sm font-normal text-gray-500">/100</span></p>
              <p className="text-xs text-green-600">+7 this month</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="bg-gray-50 py-20 scroll-mt-16">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <p className="text-xs font-semibold tracking-widest text-green-600 uppercase mb-2">Features</p>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900">Everything You Need</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon:<Shield size={22} className="text-green-600"/>,      bg:'bg-green-50',  title:'AI Issue Detection',    desc:'Gemini-powered AI classifies severity and routes issues to the right department automatically.' },
              { icon:<BarChart2 size={22} className="text-blue-600"/>,    bg:'bg-blue-50',   title:'Smart Prioritization',  desc:'Issues are ranked by impact, frequency, and affected population.' },
              { icon:<Activity size={22} className="text-orange-600"/>,   bg:'bg-orange-50', title:'Real-time Tracking',     desc:'Live status updates from report to resolution. Full transparency.' },
              { icon:<MapPin size={22} className="text-red-600"/>,        bg:'bg-red-50',    title:'Geo-location Mapping',   desc:'Interactive OpenStreetMap with severity-colored pins and filters.' },
              { icon:<Users size={22} className="text-purple-600"/>,      bg:'bg-purple-50', title:'Community Verification', desc:'Neighbours confirm reports. Quality issues surface faster.' },
              { icon:<TrendingUp size={22} className="text-teal-600"/>,   bg:'bg-teal-50',   title:'Analytics & Insights',   desc:'Dashboards, charts, and AI insights on community health trends.' },
            ].map(({ icon, bg, title, desc }) => (
              <div key={title} className="bg-white rounded-2xl p-6 border border-gray-100">
                <div className={`w-10 h-10 ${bg} rounded-xl flex items-center justify-center mb-4`}>{icon}</div>
                <h3 className="font-semibold text-gray-900 mb-2">{title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 scroll-mt-16">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <p className="text-xs font-semibold tracking-widest text-green-600 uppercase mb-2">Simple Process</p>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900">How CivicAI Works</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {howItWorks.map(({ num, icon, title, desc }) => (
              <div key={num} className="text-center">
                <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 text-green-600 border border-gray-100 shadow-sm">{icon}</div>
                <p className="text-xs text-gray-400 mb-1">{num}</p>
                <h3 className="font-semibold text-gray-900 mb-2 text-sm">{title}</h3>
                <p className="text-xs text-gray-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Cities Transformed */}
      <section id="cities" className="bg-gray-50 py-20 scroll-mt-16">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <p className="text-xs font-semibold tracking-widest text-green-600 uppercase mb-2">Real Impact</p>
            <h2 className="text-3xl font-bold text-gray-900">Cities Transformed</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
            {cityImpacts.map(({ img, title, metric, desc }) => (
              <div key={title} className="bg-white rounded-xl overflow-hidden border border-gray-100">
                <img src={img} alt={title} className="w-full h-36 object-cover"/>
                <div className="p-4">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-semibold text-gray-900 text-sm">{title}</h3>
                    <span className="text-green-600 font-bold">{metric}</span>
                  </div>
                  <p className="text-xs text-gray-500 leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-20 scroll-mt-16">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <p className="text-xs font-semibold tracking-widest text-green-600 uppercase mb-2">Community</p>
            <h2 className="text-3xl font-bold text-gray-900">Trusted by Citizens & Cities</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map(({ text, name, role, metric, metricLabel, img }) => (
              <div key={name} className="bg-white border border-gray-100 rounded-2xl p-6">
                <div className="flex gap-0.5 mb-3">{[1,2,3,4,5].map(i=><Star key={i} size={13} className="fill-yellow-400 text-yellow-400"/>)}</div>
                <p className="text-sm text-gray-700 leading-relaxed mb-5 italic">{text}</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <img src={img} alt={name} className="w-9 h-9 rounded-full object-cover"/>
                    <div><p className="font-semibold text-sm text-gray-900">{name}</p><p className="text-xs text-gray-500">{role}</p></div>
                  </div>
                  <div className="text-right"><p className="text-lg font-bold text-green-600">{metric}</p><p className="text-xs text-gray-400">{metricLabel}</p></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="bg-gray-50 py-20 scroll-mt-16">
        <div className="max-w-2xl mx-auto px-6">
          <div className="text-center mb-12">
            <p className="text-xs font-semibold tracking-widest text-green-600 uppercase mb-2">FAQ</p>
            <h2 className="text-3xl font-bold text-gray-900">Frequently Asked Questions</h2>
          </div>
          <div className="space-y-3">
            {faqItems.map(({ q, a }) => (
              <details key={q} className="bg-white border border-gray-200 rounded-xl group">
                <summary className="flex items-center justify-between px-5 py-4 cursor-pointer list-none font-medium text-gray-900 text-sm">
                  {q}<ChevronDown size={15} className="text-gray-400 group-open:rotate-180 transition-transform flex-shrink-0"/>
                </summary>
                <p className="px-5 pb-4 text-sm text-gray-500 leading-relaxed">{a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Contact */}
      <section id="contact" className="py-20 scroll-mt-16">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <p className="text-xs font-semibold tracking-widest text-green-600 uppercase mb-2">Contact</p>
            <h2 className="text-3xl font-bold text-gray-900">Get In Touch</h2>
          </div>
          <div className="grid sm:grid-cols-3 gap-5 max-w-2xl mx-auto">
            <a href="mailto:hello@civicai.app" className="bg-white border border-gray-100 rounded-2xl p-6 text-center hover:shadow-md transition-shadow">
              <div className="w-11 h-11 bg-green-50 rounded-xl flex items-center justify-center mx-auto mb-3"><Mail size={20} className="text-green-600"/></div>
              <h3 className="font-semibold text-gray-900 mb-1 text-sm">Email</h3>
              <p className="text-xs text-gray-500">hello@civicai.app</p>
            </a>
            <a href="#" className="bg-white border border-gray-100 rounded-2xl p-6 text-center hover:shadow-md transition-shadow">
              <div className="w-11 h-11 bg-blue-50 rounded-xl flex items-center justify-center mx-auto mb-3"><Twitter size={20} className="text-blue-500"/></div>
              <h3 className="font-semibold text-gray-900 mb-1 text-sm">Twitter</h3>
              <p className="text-xs text-gray-500">@CivicAIApp</p>
            </a>
            <a href="https://github.com/Keshav-Bhaiya/CIVIC_AI" target="_blank" rel="noreferrer" className="bg-white border border-gray-100 rounded-2xl p-6 text-center hover:shadow-md transition-shadow">
              <div className="w-11 h-11 bg-gray-50 rounded-xl flex items-center justify-center mx-auto mb-3"><Github size={20} className="text-gray-700"/></div>
              <h3 className="font-semibold text-gray-900 mb-1 text-sm">GitHub</h3>
              <p className="text-xs text-gray-500">Open Source</p>
            </a>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-6xl mx-auto px-6 mb-16">
        <div className="bg-green-600 rounded-3xl px-8 py-12 flex flex-col md:flex-row items-center justify-between gap-8">
          <div>
            <h2 className="text-3xl font-bold text-white mb-2">Ready to Make a Difference?</h2>
            <p className="text-green-100 text-sm max-w-md">Join citizens making their cities cleaner, safer, and more responsive.</p>
          </div>
          <Link to="/signup" className="flex-shrink-0 bg-white text-green-700 font-bold px-8 py-4 rounded-full hover:bg-gray-50 transition-colors text-sm">
            Start Reporting — Free
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-8 max-w-6xl mx-auto px-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-green-600 rounded-full flex items-center justify-center"><div className="w-2 h-2 bg-white rounded-full"/></div>
            <span className="font-bold text-gray-900 text-sm">CivicAI</span>
            <span className="text-gray-400 text-xs ml-2">© 2026 Making communities smarter.</span>
          </div>
          <div className="flex items-center gap-6">
            {[['features','Features'],['how-it-works','How It Works'],['faq','FAQ'],['contact','Contact']].map(([id,label]) => (
              <button key={id} onClick={() => scrollTo(id)} className="text-xs text-gray-500 hover:text-gray-700">{label}</button>
            ))}
            <a href="https://github.com/Keshav-Bhaiya/CIVIC_AI" target="_blank" rel="noreferrer" className="text-xs text-gray-500 hover:text-gray-700">GitHub</a>
          </div>
        </div>
      </footer>
    </div>
  )
}