<<<<<<< HEAD
import { useState } from 'react'
import { useTranslation } from 'react-i18next'

export default function Pricing() {
  const { t } = useTranslation()
  const [isAnnual, setIsAnnual] = useState(false)
  const [loading, setLoading] = useState(false)

  const price = isAnnual ? t('pricing.annualPrice') : t('pricing.monthlyPrice')

  const handleSubscribe = async () => {
    setLoading(true)
    
    try {
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ price: isAnnual ? 'annual' : 'monthly' })
      })
      
      const data = await response.json()
      
      if (data.url) {
        window.location.href = data.url
      } else {
        console.error('No checkout URL received')
      }
    } catch (error) {
      console.error('Checkout failed:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-white">
      <section className="max-w-4xl mx-auto px-6 py-20">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-semibold text-text-gray mb-4">
            {t('pricing.heading')}
          </h1>
          <p className="text-xl text-gray-500 max-w-xl mx-auto">
            {t('pricing.subheading')}
          </p>
        </div>

        <div className="bg-gray-50 rounded-2xl p-8 md:p-12 max-w-lg mx-auto mb-16">
          <div className="text-center mb-8">
            <div className="flex items-baseline justify-center gap-2 mb-2">
              <span className="text-5xl font-semibold text-text-gray">{price}</span>
              <span className="text-gray-500">/month</span>
            </div>
            {isAnnual && (
              <p className="text-sm text-green-600 font-medium">{t('pricing.saveMessage')}</p>
            )}
          </div>

          <div className="flex items-center justify-center gap-4 mb-8">
            <button
              onClick={() => setIsAnnual(false)}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${!isAnnual ? 'bg-brand-black text-white' : 'text-gray-500 hover:text-text-gray'}`}
            >
              {t('pricing.monthly')}
            </button>
            <button
              onClick={() => setIsAnnual(true)}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${isAnnual ? 'bg-brand-black text-white' : 'text-gray-500 hover:text-text-gray'}`}
            >
              {t('pricing.annual')}
            </button>
          </div>

          <ul className="space-y-4 mb-8">
            <li className="flex items-start gap-3">
              <svg className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-gray-600">{t('pricing.features.single')}</span>
            </li>
            <li className="flex items-start gap-3">
              <svg className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-gray-600">{t('pricing.features.batch')}</span>
            </li>
            <li className="flex items-start gap-3">
              <svg className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-gray-600">{t('pricing.features.prefix')}</span>
            </li>
            <li className="flex items-start gap-3">
              <svg className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-gray-600">{t('pricing.features.client')}</span>
            </li>
            <li className="flex items-start gap-3">
              <svg className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-gray-600">{t('pricing.features.cancel')}</span>
            </li>
          </ul>

          <button
            onClick={handleSubscribe}
            disabled={loading}
            className="w-full bg-brand-black text-white py-4 rounded-lg font-medium hover:bg-gray-800 transition-colors disabled:opacity-50"
          >
            {loading ? t('pricing.redirecting') : t('pricing.subscribeButton')}
          </button>

          <p className="text-center text-sm text-gray-400 mt-4">
            {t('pricing.secured')}
          </p>
        </div>

        <div className="max-w-xl mx-auto">
          <h3 className="text-lg font-semibold text-text-gray text-center mb-6">
            {t('faq.heading')}
          </h3>
          
          <div className="space-y-6">
            <div>
              <h4 className="font-medium text-text-gray mb-2">{t('faq.q1.question')}</h4>
              <p className="text-gray-500 text-sm leading-relaxed">{t('faq.q1.answer')}</p>
            </div>
            
            <div>
              <h4 className="font-medium text-text-gray mb-2">{t('faq.q2.question')}</h4>
              <p className="text-gray-500 text-sm leading-relaxed">{t('faq.q2.answer')}</p>
            </div>
            
            <div>
              <h4 className="font-medium text-text-gray mb-2">{t('faq.q3.question')}</h4>
              <p className="text-gray-500 text-sm leading-relaxed">{t('faq.q3.answer')}</p>
            </div>
          </div>
        </div>

        <div className="text-center mt-12">
          <a href="/" className="text-sm text-gray-500 hover:text-text-gray transition-colors">
            ← {t('nav.home')}
          </a>
        </div>
      </section>
    </div>
  )
=======
import { useState } from 'react'
import { useTranslation } from 'react-i18next'

export default function Pricing() {
  const { t } = useTranslation()
  const [isAnnual, setIsAnnual] = useState(false)
  const [loading, setLoading] = useState(false)

  const price = isAnnual ? t('pricing.annualPrice') : t('pricing.monthlyPrice')

  const handleSubscribe = async () => {
    setLoading(true)
    
    try {
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ price: isAnnual ? 'annual' : 'monthly' })
      })
      
      const data = await response.json()
      
      if (data.url) {
        window.location.href = data.url
      } else {
        console.error('No checkout URL received')
      }
    } catch (error) {
      console.error('Checkout failed:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-white">
      <section className="max-w-4xl mx-auto px-6 py-20">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-semibold text-text-gray mb-4">
            {t('pricing.heading')}
          </h1>
          <p className="text-xl text-gray-500 max-w-xl mx-auto">
            {t('pricing.subheading')}
          </p>
        </div>

        <div className="bg-gray-50 rounded-2xl p-8 md:p-12 max-w-lg mx-auto mb-16">
          <div className="text-center mb-8">
            <div className="flex items-baseline justify-center gap-2 mb-2">
              <span className="text-5xl font-semibold text-text-gray">{price}</span>
              <span className="text-gray-500">/month</span>
            </div>
            {isAnnual && (
              <p className="text-sm text-green-600 font-medium">{t('pricing.saveMessage')}</p>
            )}
          </div>

          <div className="flex items-center justify-center gap-4 mb-8">
            <button
              onClick={() => setIsAnnual(false)}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${!isAnnual ? 'bg-brand-black text-white' : 'text-gray-500 hover:text-text-gray'}`}
            >
              {t('pricing.monthly')}
            </button>
            <button
              onClick={() => setIsAnnual(true)}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${isAnnual ? 'bg-brand-black text-white' : 'text-gray-500 hover:text-text-gray'}`}
            >
              {t('pricing.annual')}
            </button>
          </div>

          <ul className="space-y-4 mb-8">
            <li className="flex items-start gap-3">
              <svg className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-gray-600">{t('pricing.features.single')}</span>
            </li>
            <li className="flex items-start gap-3">
              <svg className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-gray-600">{t('pricing.features.batch')}</span>
            </li>
            <li className="flex items-start gap-3">
              <svg className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-gray-600">{t('pricing.features.prefix')}</span>
            </li>
            <li className="flex items-start gap-3">
              <svg className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-gray-600">{t('pricing.features.client')}</span>
            </li>
            <li className="flex items-start gap-3">
              <svg className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-gray-600">{t('pricing.features.cancel')}</span>
            </li>
          </ul>

          <button
            onClick={handleSubscribe}
            disabled={loading}
            className="w-full bg-brand-black text-white py-4 rounded-lg font-medium hover:bg-gray-800 transition-colors disabled:opacity-50"
          >
            {loading ? t('pricing.redirecting') : t('pricing.subscribeButton')}
          </button>

          <p className="text-center text-sm text-gray-400 mt-4">
            {t('pricing.secured')}
          </p>
        </div>

        <div className="max-w-xl mx-auto">
          <h3 className="text-lg font-semibold text-text-gray text-center mb-6">
            {t('faq.heading')}
          </h3>
          
          <div className="space-y-6">
            <div>
              <h4 className="font-medium text-text-gray mb-2">{t('faq.q1.question')}</h4>
              <p className="text-gray-500 text-sm leading-relaxed">{t('faq.q1.answer')}</p>
            </div>
            
            <div>
              <h4 className="font-medium text-text-gray mb-2">{t('faq.q2.question')}</h4>
              <p className="text-gray-500 text-sm leading-relaxed">{t('faq.q2.answer')}</p>
            </div>
            
            <div>
              <h4 className="font-medium text-text-gray mb-2">{t('faq.q3.question')}</h4>
              <p className="text-gray-500 text-sm leading-relaxed">{t('faq.q3.answer')}</p>
            </div>
          </div>
        </div>

        <div className="text-center mt-12">
          <a href="/" className="text-sm text-gray-500 hover:text-text-gray transition-colors">
            ← {t('nav.home')}
          </a>
        </div>
      </section>
    </div>
  )
>>>>>>> e4eba883a04c08465efdd112d57d260134d78910
}