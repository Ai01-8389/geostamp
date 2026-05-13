import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, Link } from 'react-router-dom'

export default function Login() {
  const { t } = useTranslation()
  const [isSignUp, setIsSignUp] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    const isSub = localStorage.getItem('isSubscriber') === 'true'
    if (isSub) {
      navigate('/dashboard')
    }
  }, [navigate])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      if (!email || !password) {
        throw new Error(t('errors.emailRequired'))
      }

      if (password.length < 6) {
        throw new Error(t('errors.passwordShort'))
      }

      const response = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, type: isSignUp ? 'signup' : 'login' })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || t('errors.authError'))
      }

      localStorage.setItem('authToken', data.token)
      localStorage.setItem('isSubscriber', 'true')
      localStorage.setItem('userEmail', email)
      
      navigate('/dashboard')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <svg className="w-10 h-10" viewBox="0 0 32 32" fill="none">
              <rect width="32" height="32" rx="6" fill="#000"/>
              <path d="M8 12h16M8 16h12M8 20h14" stroke="#fff" strokeWidth="2" strokeLinecap="round"/>
              <circle cx="22" cy="22" r="4" fill="#fff"/>
            </svg>
          </Link>
          <h1 className="text-2xl font-semibold text-text-gray mb-2">
            {isSignUp ? t('login.signUp') : t('login.signIn')}
          </h1>
          <p className="text-gray-500">
            {isSignUp ? t('login.signUpSub') : t('login.signInSub')}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-text-gray mb-1.5">
              {t('login.email')}
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:border-brand-black transition-colors"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-gray mb-1.5">
              {t('login.password')}
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:border-brand-black transition-colors"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-brand-black text-white py-3 rounded-lg font-medium hover:bg-gray-800 transition-colors disabled:opacity-50"
          >
            {loading ? t('login.pleaseWait') : (isSignUp ? t('login.submitSignUp') : t('login.submitSignIn'))}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500">
            {isSignUp ? t('login.alreadyHave') : t('login.noAccount')}{' '}
            <button
              onClick={() => {
                setIsSignUp(!isSignUp)
                setError('')
              }}
              className="font-medium text-brand-black hover:underline"
            >
              {isSignUp ? t('login.submitSignIn') : t('login.submitSignUp')}
            </button>
          </p>
        </div>

        <div className="mt-8 pt-8 border-t border-gray-100">
          <Link 
            to="/pricing"
            className="block text-center text-sm text-gray-500 hover:text-text-gray transition-colors"
          >
            {t('nav.pricing')} →
          </Link>
        </div>
      </div>
    </div>
  )
}