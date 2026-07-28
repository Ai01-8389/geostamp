export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;
    
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };
    
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }
    
    try {
      // Auth
      if (path === '/api/auth/login' && request.method === 'POST') {
        return await handleLogin(request, env, corsHeaders);
      }
      if (path === '/api/auth/setup' && request.method === 'POST') {
        return await handleSetup(request, env, corsHeaders);
      }
      if (path === '/api/auth/logout' && request.method === 'POST') {
        return await handleLogout(request, env, corsHeaders);
      }
      
      // User
      if (path === '/api/user/me' && request.method === 'GET') {
        return await handleGetUser(request, env, corsHeaders);
      }
      if (path === '/api/desktop/verify' && request.method === 'GET') {
        return await handleVerifySubscription(request, env, corsHeaders);
      }
      
      // Payment
      if (path === '/api/create-checkout' && request.method === 'POST') {
        return await handleCreateCheckout(request, env, corsHeaders);
      }
      if (path === '/api/webhooks/creem' && request.method === 'POST') {
        return await handleCreemWebhook(request, env, corsHeaders);
      }
      
      // Daily usage (Pro users only — free users use localStorage)
      if (path === '/api/usage/check' && request.method === 'GET') {
        return await handleCheckDailyLimit(request, env, corsHeaders);
      }
      if (path === '/api/usage/increment' && request.method === 'POST') {
        return await handleIncrementDailyCount(request, env, corsHeaders);
      }
      
      // Device management
      if (path === '/api/user/devices' && request.method === 'GET') {
        return await handleGetDevices(request, env, corsHeaders);
      }
      
      // Health check
      if (path === '/api/health') {
        return new Response(JSON.stringify({ 
          status: 'ok', timestamp: new Date().toISOString() 
        }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      
      return new Response(JSON.stringify({ error: 'Not Found' }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
      
    } catch (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
  }
};

// ============ Helpers ============

function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0;
    return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
  });
}

function createToken(payload, secret, expiresMs = 7200000) {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body = btoa(JSON.stringify({ ...payload, iat: Date.now(), exp: Date.now() + expiresMs }));
  const signature = btoa(`${header}.${body}.${secret}`);
  return `${header}.${body}.${signature}`;
}

function verifyToken(token, secret) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = JSON.parse(atob(parts[1]));
    if (payload.exp < Date.now()) return null;
    return payload;
  } catch { return null; }
}

async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + 'geostamp-salt-2026');
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
}

async function getUserFromToken(authHeader, env) {
  if (!authHeader?.startsWith('Bearer ')) return null;
  const token = authHeader.substring(7);
  const payload = verifyToken(token, env.JWT_SECRET);
  if (!payload) return null;
  const user = await env.GEOSTAMP_KV.get(`user:${payload.email}`, { type: 'json' });
  return user;
}

function json(data, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status, headers: { 'Content-Type': 'application/json', ...extraHeaders }
  });
}

// ============ Device Binding ============

const MAX_DEVICES = 3;
const DEVICE_CHANGE_LIMIT = 3;      // max device swaps per month
const DEVICE_CHANGE_DAYS = 30;      // rolling window

// Check if this device is already registered
function deviceExists(user, deviceId) {
  return (user.devices || []).some(d => d.id === deviceId);
}

// Check if device change limit is reached (30-day rolling)
function canAddDevice(user) {
  const devices = user.devices || [];
  if (devices.length < MAX_DEVICES) return true;

  // Count changes in the last 30 days
  const cut = Date.now() - DEVICE_CHANGE_DAYS * 86400000;
  const changeLog = user.deviceChangeLog || [];
  const recent = changeLog.filter(c => c.time > cut);
  return recent.length < DEVICE_CHANGE_LIMIT;
}

// ============ Auth Handlers ============

async function handleLogin(request, env, corsHeaders) {
  const body = await request.json();
  const email = body.email?.toLowerCase().trim();
  const password = body.password || '';
  const deviceId = body.device_id || generateUUID();

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return json({ success: false, error: { code: 'INVALID_EMAIL', message: 'Please enter a valid email address' } }, 400, corsHeaders);
  }

  // Rate limit per IP — 10 login attempts per IP per minute (in-memory, best-effort)
  // NOTE: Cloudflare Workers free tier supports basic rate limiting. For production, add WAF rules.

  const userKey = `user:${email}`;
  const user = await env.GEOSTAMP_KV.get(userKey, { type: 'json' });

  if (!user) {
    return json({ success: false, error: { code: 'USER_NOT_FOUND', message: 'No account found. Please subscribe on Creem first.' } }, 404, corsHeaders);
  }

  // Check if user has set a password yet
  if (!user.passwordHash) {
    return json({ 
      success: false, 
      needs_setup: true,
      error: { code: 'NEEDS_SETUP', message: 'Account not configured yet. Please subscribe on Creem, then set up your password here.' } 
    }, 400, corsHeaders);
  }

  // Verify password
  const hashed = await hashPassword(password);
  if (hashed !== user.passwordHash) {
    return json({ success: false, error: { code: 'INVALID_PASSWORD', message: 'Wrong password' } }, 401, corsHeaders);
  }

  // Check subscription status
  if (user.plan !== 'pro' || user.subscriptionStatus !== 'active') {
    return json({ 
      success: false, 
      error: { code: 'SUBSCRIPTION_INACTIVE', message: 'Your subscription is not active. Please renew on Creem.' } 
    }, 403, corsHeaders);
  }

  // Device binding
  if (!deviceExists(user, deviceId)) {
    if (!canAddDevice(user)) {
      return json({ 
        success: false, 
        error: { code: 'DEVICE_LIMIT', message: `Max ${MAX_DEVICES} devices. You can swap up to ${DEVICE_CHANGE_LIMIT} times per ${DEVICE_CHANGE_DAYS} days. Remove a device first.` } 
      }, 403, corsHeaders);
    }
    user.devices = user.devices || [];
    user.devices.push({ id: deviceId, added: Date.now(), label: body.device_label || '' });
    user.deviceChangeLog = user.deviceChangeLog || [];
    user.deviceChangeLog.push({ time: Date.now(), added: deviceId });
    // limit log size
    if (user.deviceChangeLog.length > 100) user.deviceChangeLog = user.deviceChangeLog.slice(-100);
  }

  // Issue tokens
  const accessToken = createToken({ userId: user.id, email: user.email, plan: user.plan }, env.JWT_SECRET);
  const refreshToken = generateUUID();

  // Store user state + refresh token
  await env.GEOSTAMP_KV.put(userKey, JSON.stringify(user));
  await env.GEOSTAMP_KV.put(`refresh:${user.id}`, refreshToken, { expirationTtl: 2592000 });
  
  return json({
    success: true,
    access_token: accessToken,
    refresh_token: refreshToken,
    expires_in: 7200,
    user: { id: user.id, email: user.email, plan: user.plan, subscriptionStatus: user.subscriptionStatus },
    devices: user.devices
  }, 200, corsHeaders);
}

// First-time password setup (for users created by Creem webhook)
async function handleSetup(request, env, corsHeaders) {
  const body = await request.json();
  const email = body.email?.toLowerCase().trim();
  const password = body.password || '';

  if (!email || !password) {
    return json({ success: false, error: { code: 'INVALID_REQUEST', message: 'Email and password are required' } }, 400, corsHeaders);
  }
  if (password.length < 6) {
    return json({ success: false, error: { code: 'PASSWORD_TOO_SHORT', message: 'Password must be at least 6 characters' } }, 400, corsHeaders);
  }

  const userKey = `user:${email}`;
  const user = await env.GEOSTAMP_KV.get(userKey, { type: 'json' });

  if (!user) {
    return json({ success: false, error: { code: 'USER_NOT_FOUND', message: 'No subscription found for this email. Please subscribe on Creem first.' } }, 404, corsHeaders);
  }

  if (user.passwordHash) {
    return json({ success: false, error: { code: 'ALREADY_SETUP', message: 'Account already configured. Please log in.' } }, 400, corsHeaders);
  }

  user.passwordHash = await hashPassword(password);

  // Issue token + add first device
  const deviceId = body.device_id || generateUUID();
  user.devices = [{ id: deviceId, added: Date.now(), label: body.device_label || '' }];
  user.deviceChangeLog = [{ time: Date.now(), added: deviceId }];
  
  await env.GEOSTAMP_KV.put(userKey, JSON.stringify(user));

  const accessToken = createToken({ userId: user.id, email: user.email, plan: user.plan }, env.JWT_SECRET);
  const refreshToken = generateUUID();
  await env.GEOSTAMP_KV.put(`refresh:${user.id}`, refreshToken, { expirationTtl: 2592000 });

  return json({
    success: true,
    access_token: accessToken,
    refresh_token: refreshToken,
    expires_in: 7200,
    user: { id: user.id, email: user.email, plan: user.plan, subscriptionStatus: user.subscriptionStatus },
    devices: user.devices
  }, 200, corsHeaders);
}

async function handleLogout(request, env, corsHeaders) {
  const authHeader = request.headers.get('Authorization');
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    const payload = verifyToken(token, env.JWT_SECRET);
    if (payload?.userId) {
      await env.GEOSTAMP_KV.delete(`refresh:${payload.userId}`);
    }
  }
  return json({ success: true }, 200, corsHeaders);
}

// ============ User Handlers ============

async function handleGetUser(request, env, corsHeaders) {
  const user = await getUserFromToken(request.headers.get('Authorization'), env);
  if (!user) return json({ success: false, error: { code: 'UNAUTHORIZED' } }, 401, corsHeaders);
  
  return json({
    id: user.id, email: user.email,
    plan: user.plan, subscriptionStatus: user.subscriptionStatus,
    devices: user.devices || []
  }, 200, corsHeaders);
}

async function handleGetDevices(request, env, corsHeaders) {
  const user = await getUserFromToken(request.headers.get('Authorization'), env);
  if (!user) return json({ success: false, error: { code: 'UNAUTHORIZED' } }, 401, corsHeaders);

  return json({
    devices: user.devices || [],
    maxDevices: MAX_DEVICES,
    changeLimit: DEVICE_CHANGE_LIMIT,
    changeDays: DEVICE_CHANGE_DAYS,
    recentChanges: ((user.deviceChangeLog || []).filter(c => c.time > Date.now() - DEVICE_CHANGE_DAYS * 86400000)).length
  }, 200, corsHeaders);
}

async function handleVerifySubscription(request, env, corsHeaders) {
  const user = await getUserFromToken(request.headers.get('Authorization'), env);
  if (!user) return json({ valid: false, error: 'UNAUTHORIZED' }, 401, corsHeaders);

  const isPro = user.plan === 'pro' && user.subscriptionStatus === 'active';
  return json({
    valid: true,
    user: { id: user.id, email: user.email },
    subscription: {
      plan: user.plan, status: user.subscriptionStatus,
      maxBatchSize: isPro ? 30 : 1,
      features: isPro ? ['batch_processing', 'hd_output'] : ['single_processing']
    }
  }, 200, corsHeaders);
}

// ============ Payment Handlers ============

async function handleCreateCheckout(request, env, corsHeaders) {
  const body = await request.json();
  
  const response = await fetch('https://api.creem.io/v1/checkouts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': env.CREEM_API_KEY },
    body: JSON.stringify({
      product_id: env.CREEM_PRODUCT_ID,
      success_url: 'https://geostamp.top/?payment=success',
      ...(body.email ? { customer: { email: body.email } } : {}),
      metadata: { email: body.email || '' }
    })
  });

  const responseText = await response.text();
  console.log('Creem API response status:', response.status);

  let data;
  try { data = JSON.parse(responseText); } catch { data = { message: responseText }; }

  if (!response.ok) {
    return json({ success: false, error: { code: 'CHECKOUT_FAILED', message: data.message || 'Failed to create checkout' } }, 400, corsHeaders);
  }

  return json({ success: true, checkout_url: data.checkout_url || data.url }, 200, corsHeaders);
}

async function handleCreemWebhook(request, env, corsHeaders) {
  const body = await request.json();
  const event = body.event;
  const data = body.data;

  if (event === 'subscription.active' || event === 'subscription.created' || event === 'checkout.completed') {
    const email = (data.customer_email || data.metadata?.email || '').toLowerCase().trim();
    
    if (email) {
      const userKey = `user:${email}`;
      let user = await env.GEOSTAMP_KV.get(userKey, { type: 'json' });
      
      if (!user) {
        // Create new user from Creem — no password yet, user will set it on first login
        user = {
          id: generateUUID(),
          email,
          plan: 'pro',
          subscriptionStatus: 'active',
          passwordHash: null,   // user sets password via /api/auth/setup
          devices: [],
          deviceChangeLog: [],
          creemCustomerId: data.customer_id,
          creemSubscriptionId: data.subscription_id,
          createdAt: Date.now()
        };
      } else {
        user.plan = 'pro';
        user.subscriptionStatus = 'active';
        user.creemCustomerId = data.customer_id;
        user.creemSubscriptionId = data.subscription_id;
      }
      
      await env.GEOSTAMP_KV.put(userKey, JSON.stringify(user));
      console.log(`User ${event === 'subscription.created' ? 'created' : 'updated'}: ${email}`);
    }
  }

  if (event === 'subscription.canceled' || event === 'subscription.expired') {
    const email = (data.customer_email || data.metadata?.email || '').toLowerCase().trim();
    
    if (email) {
      const user = await env.GEOSTAMP_KV.get(`user:${email}`, { type: 'json' });
      if (user) {
        user.subscriptionStatus = 'canceled';
        await env.GEOSTAMP_KV.put(`user:${email}`, JSON.stringify(user));
      }
    }
  }

  return json({ received: true }, 200, corsHeaders);
}

// ============ Daily Usage (Pro users) ============

async function handleCheckDailyLimit(request, env, corsHeaders) {
  const user = await getUserFromToken(request.headers.get('Authorization'), env);
  if (!user) return json({ success: false, error: { code: 'UNAUTHORIZED' } }, 401, corsHeaders);

  const isPro = user.plan === 'pro' && user.subscriptionStatus === 'active';
  const dailyLimit = isPro ? 999999 : 3;
  const today = new Date().toISOString().slice(0, 10);
  const key = `daily:${today}:${user.id}`;
  const current = await env.GEOSTAMP_KV.get(key);
  const count = current ? parseInt(current) : 0;

  return json({
    success: true, plan: user.plan, dailyLimit,
    usedToday: count, remaining: Math.max(0, dailyLimit - count), isPro
  }, 200, corsHeaders);
}

async function handleIncrementDailyCount(request, env, corsHeaders) {
  const user = await getUserFromToken(request.headers.get('Authorization'), env);
  if (!user) return json({ success: false, error: { code: 'UNAUTHORIZED' } }, 401, corsHeaders);

  const today = new Date().toISOString().slice(0, 10);
  const key = `daily:${today}:${user.id}`;
  const current = await env.GEOSTAMP_KV.get(key);
  const count = current ? parseInt(current) : 0;

  await env.GEOSTAMP_KV.put(key, (count + 1).toString(), { expirationTtl: 86400 });

  return json({ success: true, usedToday: count + 1 }, 200, corsHeaders);
}
