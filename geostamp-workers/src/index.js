export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;
    
    // CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };
    
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }
    
    try {
      // Routes
      if (path === '/api/auth/request-code' && request.method === 'POST') {
        return await handleRequestCode(request, env, corsHeaders);
      }
      
      if (path === '/api/auth/verify-code' && request.method === 'POST') {
        return await handleVerifyCode(request, env, corsHeaders);
      }
      
      if (path === '/api/auth/refresh' && request.method === 'POST') {
        return await handleRefreshToken(request, env, corsHeaders);
      }
      
      if (path === '/api/auth/logout' && request.method === 'POST') {
        return await handleLogout(request, env, corsHeaders);
      }
      
      if (path === '/api/user/me' && request.method === 'GET') {
        return await handleGetUser(request, env, corsHeaders);
      }
      
      if (path === '/api/user/upgrade' && request.method === 'POST') {
        return await handleUpgradeUser(request, env, corsHeaders);
      }
      
      if (path === '/api/desktop/verify' && request.method === 'GET') {
        return await handleVerifySubscription(request, env, corsHeaders);
      }
      
      if (path === '/api/create-checkout' && request.method === 'POST') {
        return await handleCreateCheckout(request, env, corsHeaders);
      }
      
      if (path === '/api/webhooks/creem' && request.method === 'POST') {
        return await handleCreemWebhook(request, env, corsHeaders);
      }
      
      // Daily limit check
      if (path === '/api/usage/check' && request.method === 'GET') {
        return await handleCheckDailyLimit(request, env, corsHeaders);
      }
      
      if (path === '/api/usage/increment' && request.method === 'POST') {
        return await handleIncrementDailyCount(request, env, corsHeaders);
      }
      
      // Health check
      if (path === '/api/health') {
        return new Response(JSON.stringify({ 
          status: 'ok', 
          timestamp: new Date().toISOString(),
          debug: {
            hasCreemKey: !!env.CREEM_API_KEY,
            creemKeyPrefix: env.CREEM_API_KEY ? env.CREEM_API_KEY.substring(0, 8) + '...' : 'NOT SET',
            hasJwtSecret: !!env.JWT_SECRET,
            hasKv: !!env.GEOSTAMP_KV,
            hasResendKey: !!env.RESEND_API_KEY,
            resendKeyPrefix: env.RESEND_API_KEY ? env.RESEND_API_KEY.substring(0, 8) + '...' : 'NOT SET'
          }
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      
      return new Response(JSON.stringify({ error: 'Not Found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
      
    } catch (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
  }
};

// Generate 6-digit code
function generateCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Generate UUID
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0;
    return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
  });
}

// Simple JWT-like token (for demo, use proper JWT in production)
function createToken(payload, secret) {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body = btoa(JSON.stringify({ ...payload, iat: Date.now(), exp: Date.now() + 7200000 }));
  const signature = btoa(`${header}.${body}.${secret}`);
  return `${header}.${body}.${signature}`;
}

// Verify token
function verifyToken(token, secret) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = JSON.parse(atob(parts[1]));
    if (payload.exp < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

// Rate limiting
async function checkRateLimit(env, key, limit, windowSeconds) {
  const current = await env.GEOSTAMP_KV.get(key);
  const count = current ? parseInt(current) : 0;
  
  if (count >= limit) {
    const ttl = await env.GEOSTAMP_KV.getWithMetadata(key);
    return { allowed: false, retryAfter: ttl.metadata?.expiresAt || windowSeconds };
  }
  
  await env.GEOSTAMP_KV.put(key, (count + 1).toString(), { 
    expirationTtl: windowSeconds,
    metadata: { expiresAt: windowSeconds }
  });
  
  return { allowed: true };
}

// Handle request verification code
async function handleRequestCode(request, env, corsHeaders) {
  const body = await request.json();
  const email = body.email?.toLowerCase().trim();
  const turnstileToken = body.turnstile_token;

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return new Response(JSON.stringify({
      success: false,
      error: { code: 'INVALID_EMAIL', message: 'Please enter a valid email address' }
    }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }

  // Verify Turnstile token
  if (!turnstileToken) {
    return new Response(JSON.stringify({
      success: false,
      error: { code: 'TURNSTILE_REQUIRED', message: 'Security check required' }
    }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }

  const turnstileResp = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      secret: env.TURNSTILE_SECRET_KEY,
      response: turnstileToken
    })
  });
  const turnstileData = await turnstileResp.json();

  if (!turnstileData.success) {
    console.error('Turnstile verification failed:', turnstileData);
    return new Response(JSON.stringify({
      success: false,
      error: { code: 'TURNSTILE_FAILED', message: 'Security check failed. Please try again.' }
    }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }

  // Rate limit check
  const rateCheck = await checkRateLimit(env, `rate:${email}`, 10, 60);
  if (!rateCheck.allowed) {
    return new Response(JSON.stringify({
      success: false,
      error: { code: 'RATE_LIMITED', message: 'Too many requests', retryAfter: rateCheck.retryAfter }
    }), { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
  
  const code = generateCode();
  const codeKey = `code:${email}`;
  
  // Store code (5 minutes TTL)
  await env.GEOSTAMP_KV.put(codeKey, JSON.stringify({
    code,
    attempts: 0,
    createdAt: Date.now()
  }), { expirationTtl: 300 });
  
  // Send email via Resend
  let emailSent = false;
  let emailErrorDetail = null;
  
  try {
    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${env.RESEND_API_KEY}`
      },
      body: JSON.stringify({
        from: 'GeoStamp <verify@notify.geostamp.top>',
        to: [email],
        subject: 'Your GeoStamp Verification Code',
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
            <div style="text-align: center; margin-bottom: 40px;">
              <h1 style="color: #007AFF; font-size: 32px; margin: 0;">GeoStamp</h1>
              <p style="color: #666; font-size: 16px; margin-top: 8px;">Geotag your photos with precision</p>
            </div>
            
            <div style="background: #f5f5f7; border-radius: 16px; padding: 40px; text-align: center;">
              <p style="color: #1d1d1f; font-size: 18px; margin: 0 0 24px 0;">Your verification code is:</p>
              <div style="background: white; border-radius: 12px; padding: 24px; margin: 24px 0; border: 2px solid #007AFF;">
                <span style="font-size: 48px; font-weight: 700; color: #007AFF; letter-spacing: 12px; font-variant-numeric: tabular-nums;">${code}</span>
              </div>
              <p style="color: #86868b; font-size: 14px; margin: 24px 0 0 0;">This code will expire in 5 minutes</p>
              <p style="color: #86868b; font-size: 14px; margin: 8px 0 0 0;">If you didn't request this code, please ignore this email</p>
            </div>
            
            <div style="text-align: center; margin-top: 40px; color: #86868b; font-size: 14px;">
              <p>© 2026 GeoStamp. All rights reserved.</p>
            </div>
          </div>
        `
      })
    });
    
    const responseBody = await emailResponse.text();
    console.log('Resend response status:', emailResponse.status);
    console.log('Resend response body:', responseBody);
    
    if (emailResponse.ok) {
      emailSent = true;
      console.log(`Verification email sent to ${email}`);
    } else {
      emailErrorDetail = `Resend HTTP ${emailResponse.status}: ${responseBody}`;
      console.error('Resend API error:', emailErrorDetail);
    }
  } catch (emailError) {
    emailErrorDetail = emailError.message;
    console.error('Failed to send email:', emailError);
  }
  
  return new Response(JSON.stringify({
    success: true,
    message: 'Verification code sent',
    expiresIn: 300,
    retryAfter: 60
  }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
}

// Handle verify code
async function handleVerifyCode(request, env, corsHeaders) {
  const body = await request.json();
  const email = body.email?.toLowerCase().trim();
  const code = body.code;
  const deviceId = body.device_id;
  
  if (!email || !code) {
    return new Response(JSON.stringify({
      success: false,
      error: { code: 'INVALID_REQUEST', message: 'Email and code are required' }
    }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
  
  const codeKey = `code:${email}`;
  const stored = await env.GEOSTAMP_KV.get(codeKey, { type: 'json' });
  
  if (!stored) {
    return new Response(JSON.stringify({
      success: false,
      error: { code: 'CODE_EXPIRED', message: 'Verification code has expired' }
    }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
  
  if (stored.attempts >= 3) {
    await env.GEOSTAMP_KV.delete(codeKey);
    return new Response(JSON.stringify({
      success: false,
      error: { code: 'TOO_MANY_ATTEMPTS', message: 'Too many failed attempts' }
    }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
  
  if (stored.code !== code) {
    stored.attempts++;
    await env.GEOSTAMP_KV.put(codeKey, JSON.stringify(stored), { expirationTtl: 300 });
    return new Response(JSON.stringify({
      success: false,
      error: { 
        code: 'INVALID_CODE', 
        message: 'Invalid verification code',
        attemptsRemaining: 3 - stored.attempts
      }
    }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
  
  // Code is valid, delete it
  await env.GEOSTAMP_KV.delete(codeKey);
  
  // Check if user exists
  const userKey = `user:${email}`;
  let user = await env.GEOSTAMP_KV.get(userKey, { type: 'json' });
  const isNewUser = !user;
  
  if (!user) {
    user = {
      id: generateUUID(),
      email,
      plan: 'free',
      subscriptionStatus: 'active',
      createdAt: Date.now()
    };
    await env.GEOSTAMP_KV.put(userKey, JSON.stringify(user));
  }
  
  // Create tokens
  const accessToken = createToken({ userId: user.id, email: user.email, plan: user.plan }, env.JWT_SECRET);
  const refreshToken = generateUUID();
  
  // Store refresh token
  await env.GEOSTAMP_KV.put(`refresh:${user.id}`, refreshToken, { expirationTtl: 2592000 }); // 30 days
  
  // Store session
  if (deviceId) {
    await env.GEOSTAMP_KV.put(`session:${user.id}:${deviceId}`, JSON.stringify({
      createdAt: Date.now(),
      deviceId
    }), { expirationTtl: 2592000 });
  }
  
  return new Response(JSON.stringify({
    success: true,
    access_token: accessToken,
    refresh_token: refreshToken,
    expires_in: 7200,
    user: {
      id: user.id,
      email: user.email,
      plan: user.plan,
      subscriptionStatus: user.subscriptionStatus
    },
    is_new_user: isNewUser
  }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
}

// Handle refresh token
async function handleRefreshToken(request, env, corsHeaders) {
  const body = await request.json();
  const refreshToken = body.refresh_token;
  
  if (!refreshToken) {
    return new Response(JSON.stringify({
      success: false,
      error: { code: 'INVALID_REQUEST', message: 'Refresh token required' }
    }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
  
  // Find user by refresh token
  const list = await env.GEOSTAMP_KV.list({ prefix: 'refresh:' });
  let userId = null;
  
  for (const key of list.keys) {
    const stored = await env.GEOSTAMP_KV.get(key.name);
    if (stored === refreshToken) {
      userId = key.name.replace('refresh:', '');
      break;
    }
  }
  
  if (!userId) {
    return new Response(JSON.stringify({
      success: false,
      error: { code: 'INVALID_TOKEN', message: 'Invalid refresh token' }
    }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
  
  const user = await env.GEOSTAMP_KV.get(`user:${userId}`, { type: 'json' });
  if (!user) {
    return new Response(JSON.stringify({
      success: false,
      error: { code: 'USER_NOT_FOUND', message: 'User not found' }
    }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
  
  // Create new tokens
  const newAccessToken = createToken({ userId: user.id, email: user.email, plan: user.plan }, env.JWT_SECRET);
  const newRefreshToken = generateUUID();
  
  await env.GEOSTAMP_KV.put(`refresh:${user.id}`, newRefreshToken, { expirationTtl: 2592000 });
  
  return new Response(JSON.stringify({
    success: true,
    access_token: newAccessToken,
    refresh_token: newRefreshToken,
    expires_in: 7200
  }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
}

// Handle logout
async function handleLogout(request, env, corsHeaders) {
  const authHeader = request.headers.get('Authorization');
  
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    const payload = verifyToken(token, env.JWT_SECRET);
    
    if (payload?.userId) {
      await env.GEOSTAMP_KV.delete(`refresh:${payload.userId}`);
    }
  }
  
  return new Response(JSON.stringify({ success: true }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

// Handle get user
async function handleGetUser(request, env, corsHeaders) {
  const authHeader = request.headers.get('Authorization');
  
  if (!authHeader?.startsWith('Bearer ')) {
    return new Response(JSON.stringify({
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'Authorization required' }
    }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
  
  const token = authHeader.substring(7);
  const payload = verifyToken(token, env.JWT_SECRET);
  
  if (!payload) {
    return new Response(JSON.stringify({
      success: false,
      error: { code: 'INVALID_TOKEN', message: 'Invalid or expired token' }
    }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
  
  const user = await env.GEOSTAMP_KV.get(`user:${payload.email}`, { type: 'json' });
  
  if (!user) {
    return new Response(JSON.stringify({
      success: false,
      error: { code: 'USER_NOT_FOUND', message: 'User not found' }
    }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
  
  return new Response(JSON.stringify({
    id: user.id,
    email: user.email,
    plan: user.plan,
    subscriptionStatus: user.subscriptionStatus
  }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
}

// Handle upgrade user (payment callback fallback)
async function handleUpgradeUser(request, env, corsHeaders) {
  const authHeader = request.headers.get('Authorization');
  
  if (!authHeader?.startsWith('Bearer ')) {
    return new Response(JSON.stringify({
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'Authorization required' }
    }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
  
  const token = authHeader.substring(7);
  const payload = verifyToken(token, env.JWT_SECRET);
  
  if (!payload) {
    return new Response(JSON.stringify({
      success: false,
      error: { code: 'INVALID_TOKEN', message: 'Invalid or expired token' }
    }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
  
  const userKey = `user:${payload.email}`;
  let user = await env.GEOSTAMP_KV.get(userKey, { type: 'json' });
  
  if (!user) {
    return new Response(JSON.stringify({
      success: false,
      error: { code: 'USER_NOT_FOUND', message: 'User not found' }
    }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
  
  // Upgrade the user
  user.plan = 'pro';
  user.subscriptionStatus = 'active';
  await env.GEOSTAMP_KV.put(userKey, JSON.stringify(user));
  
  console.log(`User upgraded via payment callback: ${payload.email}`);
  
  return new Response(JSON.stringify({
    success: true,
    user: {
      id: user.id,
      email: user.email,
      plan: user.plan,
      subscriptionStatus: user.subscriptionStatus
    }
  }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
}

// Handle verify subscription
async function handleVerifySubscription(request, env, corsHeaders) {
  const authHeader = request.headers.get('Authorization');
  
  if (!authHeader?.startsWith('Bearer ')) {
    return new Response(JSON.stringify({
      valid: false,
      error: 'UNAUTHORIZED',
      message: 'Authorization required'
    }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
  
  const token = authHeader.substring(7);
  const payload = verifyToken(token, env.JWT_SECRET);
  
  if (!payload) {
    return new Response(JSON.stringify({
      valid: false,
      error: 'INVALID_TOKEN',
      message: 'Invalid or expired token'
    }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
  
  const user = await env.GEOSTAMP_KV.get(`user:${payload.email}`, { type: 'json' });
  
  if (!user) {
    return new Response(JSON.stringify({
      valid: false,
      error: 'USER_NOT_FOUND'
    }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
  
  const isPro = user.plan === 'pro' && user.subscriptionStatus === 'active';
  
  return new Response(JSON.stringify({
    valid: true,
    user: {
      id: user.id,
      email: user.email
    },
    subscription: {
      plan: user.plan,
      status: user.subscriptionStatus,
      maxBatchSize: isPro ? 30 : 1,
      features: isPro ? ['batch_processing', 'priority_queue', 'hd_output'] : ['single_processing']
    }
  }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
}

// Handle create checkout (Creem)
async function handleCreateCheckout(request, env, corsHeaders) {
  const body = await request.json();
  
  // Create Creem checkout (Production)
  const response = await fetch('https://api.creem.io/v1/checkouts', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': env.CREEM_API_KEY
    },
    body: JSON.stringify({
        product_id: env.CREEM_PRODUCT_ID,
        success_url: 'https://Ai01-8389.github.io/geostamp/?payment=success',
        ...(body.email ? { customer: { email: body.email } } : {}),
        metadata: {
          email: body.email || ''
        }
    })
  });
  
  const responseText = await response.text();
  console.log('Creem API response status:', response.status);
  console.log('Creem API response body:', responseText);
  
  let data;
  try {
    data = JSON.parse(responseText);
  } catch {
    data = { message: responseText };
  }
  
  if (!response.ok) {
    return new Response(JSON.stringify({
      success: false,
      error: { 
        code: 'CHECKOUT_FAILED', 
        message: data.message || 'Failed to create checkout',
        creem_error: data
      }
    }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
  
  return new Response(JSON.stringify({
    success: true,
    checkout_url: data.checkout_url || data.url
  }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
}

// Handle Creem webhook
async function handleCreemWebhook(request, env, corsHeaders) {
  const body = await request.json();
  
  // Verify webhook signature (simplified)
  // In production, verify the signature properly
  
  const event = body.event;
  const data = body.data;
  
  if (event === 'subscription.active' || event === 'subscription.created' || event === 'checkout.completed') {
    const email = data.customer_email || data.metadata?.email;
    
    if (email) {
      const userKey = `user:${email}`;
      const user = await env.GEOSTAMP_KV.get(userKey, { type: 'json' });
      
      if (user) {
        user.plan = 'pro';
        user.subscriptionStatus = 'active';
        user.creemCustomerId = data.customer_id;
        user.creemSubscriptionId = data.subscription_id;
        
        await env.GEOSTAMP_KV.put(userKey, JSON.stringify(user));
      }
    }
  }
  
  if (event === 'subscription.canceled' || event === 'subscription.expired') {
    const email = data.customer_email || data.metadata?.email;
    
    if (email) {
      const userKey = `user:${email}`;
      const user = await env.GEOSTAMP_KV.get(userKey, { type: 'json' });
      
      if (user) {
        user.subscriptionStatus = 'canceled';
        await env.GEOSTAMP_KV.put(userKey, JSON.stringify(user));
      }
    }
  }
  
  return new Response(JSON.stringify({ received: true }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

// Extract user from JWT
async function getUserFromToken(authHeader, env) {
  if (!authHeader?.startsWith('Bearer ')) return null;
  const token = authHeader.substring(7);
  const payload = verifyToken(token, env.JWT_SECRET);
  if (!payload) return null;
  const user = await env.GEOSTAMP_KV.get(`user:${payload.email}`, { type: 'json' });
  return user;
}

// Check daily usage limit
async function handleCheckDailyLimit(request, env, corsHeaders) {
  const user = await getUserFromToken(request.headers.get('Authorization'), env);
  if (!user) {
    return new Response(JSON.stringify({
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'Sign in required' }
    }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }

  const isPro = user.plan === 'pro' && user.subscriptionStatus === 'active';
  const dailyLimit = isPro ? 999999 : 3;
  const today = new Date().toISOString().slice(0, 10);
  const key = `daily:${today}:${user.id}`;
  const current = await env.GEOSTAMP_KV.get(key);
  const count = current ? parseInt(current) : 0;

  return new Response(JSON.stringify({
    success: true,
    plan: user.plan,
    dailyLimit,
    usedToday: count,
    remaining: Math.max(0, dailyLimit - count),
    isPro
  }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
}

// Increment daily usage count
async function handleIncrementDailyCount(request, env, corsHeaders) {
  const user = await getUserFromToken(request.headers.get('Authorization'), env);
  if (!user) {
    return new Response(JSON.stringify({
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'Sign in required' }
    }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }

  const today = new Date().toISOString().slice(0, 10);
  const key = `daily:${today}:${user.id}`;
  const current = await env.GEOSTAMP_KV.get(key);
  const count = current ? parseInt(current) : 0;
  
  await env.GEOSTAMP_KV.put(key, (count + 1).toString(), {
    expirationTtl: 86400
  });

  return new Response(JSON.stringify({
    success: true,
    usedToday: count + 1
  }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
}
