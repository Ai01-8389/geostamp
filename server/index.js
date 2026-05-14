import express from 'express'
import cors from 'cors'
import Stripe from 'stripe'
import dotenv from 'dotenv'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3001

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder')

app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true
}))

app.use(express.json())

const subscribers = new Map()

app.post('/api/auth', (req, res) => {
  const { email, password, type } = req.body

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' })
  }

  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' })
  }

  if (type === 'signup') {
    if (subscribers.has(email)) {
      return res.status(400).json({ error: 'An account with this email already exists' })
    }
    subscribers.set(email, { password, subscribed: true, createdAt: new Date().toISOString() })
  } else {
    if (!subscribers.has(email)) {
      return res.status(401).json({ error: 'Invalid email or password' })
    }
    const user = subscribers.get(email)
    if (user.password !== password) {
      return res.status(401).json({ error: 'Invalid email or password' })
    }
  }

  const token = Buffer.from(`${email}:${Date.now()}`).toString('base64')
  
  res.json({ token, email })
})

app.post('/api/create-checkout-session', async (req, res) => {
  try {
    const { price } = req.body
    
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: {
            name: 'ExifAnnotate Pro',
            description: price === 'annual' 
              ? '$6.99/month (billed annually)' 
              : '$7.99/month',
          },
          unit_amount: price === 'annual' ? 699 : 799,
          recurring: {
            interval: price === 'annual' ? 'year' : 'month',
          },
        },
        quantity: 1,
      }],
      mode: 'subscription',
      success_url: 'http://localhost:5173/success?session_id={CHECKOUT_SESSION_ID}',
      cancel_url: 'http://localhost:5173/pricing',
    })

    res.json({ url: session.url })
  } catch (error) {
    console.error('Stripe error:', error)
    res.status(500).json({ error: 'Failed to create checkout session' })
  }
})

app.post('/api/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature']
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

  if (!webhookSecret) {
    console.log('Webhook secret not configured, skipping verification')
    return res.json({ received: true })
  }

  try {
    const event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret)

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object
        console.log('Checkout completed:', session.id)
        break
      }
      case 'customer.subscription.deleted': {
        const subscription = event.data.object
        console.log('Subscription deleted:', subscription.id)
        break
      }
      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    res.json({ received: true })
  } catch (error) {
    console.error('Webhook error:', error.message)
    res.status(400).json({ error: 'Webhook signature verification failed' })
  }
})

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' })
})

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})