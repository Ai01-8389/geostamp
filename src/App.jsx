import { useTranslation } from 'react-i18next'
import { Routes, Route, Link, useLocation } from 'react-router-dom'
import Home from './pages/Home'
import Pricing from './pages/Pricing'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'

const languages = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'zh', name: '繁體中文', flag: '🇹🇼' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'ru', name: 'Русский', flag: '🇷🇺' },
  { code: 'ar', name: 'العربية', flag: '🇸🇦' }
]

function LanguageSelector() {
  const { i18n } = useTranslation()
  const [isOpen, setIsOpen] = React.useState(false)
  
  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
      >
        <span>{languages.find(l => l.code === i18n.language)?.flag}</span>
        <span className="text-sm font-medium">{i18n.language.toUpperCase()}</span>
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      
      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-100 py-1 z-50">
          {languages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => {
                i18n.changeLanguage(lang.code)
                setIsOpen(false)
              }}
              className={`w-full flex items-center gap-3 px-4 py-2 text-left hover:bg-gray-50 transition-colors ${
                i18n.language === lang.code ? 'bg-gray-50' : ''
              }`}
            >
              <span>{lang.flag}</span>
              <span className="text-sm">{lang.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function Navigation() {
  const { t } = useTranslation()
  const location = useLocation()
  const isSubscriber = localStorage.getItem('isSubscriber') === 'true'
  
  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-sm border-b border-gray-100 ${
      location.pathname === '/login' ? 'hidden' : ''
    }`}>
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <svg className="w-8 h-8" viewBox="0 0 32 32" fill="none">
            <rect width="32" height="32" rx="6" fill="#000"/>
            <path d="M8 12h16M8 16h12M8 20h14" stroke="#fff" strokeWidth="2" strokeLinecap="round"/>
            <circle cx="22" cy="22" r="4" fill="#fff"/>
          </svg>
          <span className="font-semibold text-text-gray">GeoStamp</span>
        </Link>
        
        <div className="flex items-center gap-8">
          <Link 
            to="/" 
            className={`text-sm font-medium transition-colors ${location.pathname === '/' ? 'text-brand-black' : 'text-text-gray hover:text-brand-black'}`}
          >
            {t('nav.home')}
          </Link>
          <Link 
            to="/pricing" 
            className={`text-sm font-medium transition-colors ${location.pathname === '/pricing' ? 'text-brand-black' : 'text-text-gray hover:text-brand-black'}`}
          >
            {t('nav.pricing')}
          </Link>
          {isSubscriber && (
            <Link 
              to="/dashboard" 
              className={`text-sm font-medium transition-colors ${location.pathname === '/dashboard' ? 'text-brand-black' : 'text-text-gray hover:text-brand-black'}`}
            >
              {t('nav.dashboard')}
            </Link>
          )}
          <Link 
            to="/login"
            className="text-sm font-medium text-text-gray hover:text-brand-black transition-colors"
          >
            {t('nav.login')}
          </Link>
          <Link 
            to="/pricing"
            className="bg-brand-black text-white px-4 py-2 text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors"
          >
            {t('nav.getStarted')}
          </Link>
          <LanguageSelector />
        </div>
      </div>
    </nav>
  )
}

function App() {
  const { i18n } = useTranslation()
  
  return (
    <div className={`min-h-screen bg-white ${i18n.language === 'ar' ? 'text-right' : ''}`}>
      <Navigation />
      <main className="pt-16">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard" element={<Dashboard />} />
        </Routes>
      </main>
    </div>
  )
}

export default App