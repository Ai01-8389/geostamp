# GeoStamp Authentication System - Solution Comparison Document

## Version: 1.0
## Date: 2026-05-17
## Status: Pending Review

---

## Table of Contents

1. [Problem Analysis](#1-problem-analysis)
2. [Solution Overview](#2-solution-overview)
3. [Detailed Comparison](#3-detailed-comparison)
4. [Recommended Architecture](#4-recommended-architecture)
5. [Security Considerations](#5-security-considerations)
6. [Implementation Roadmap](#6-implementation-roadmap)

---

## 1. Problem Analysis

### 1.1 Core Requirements

| Requirement | Description | Priority |
|-------------|-------------|----------|
| Cross-device Authentication | Users can authenticate seamlessly across different devices, browsers, and after computer restarts | P0 |
| Desktop App Authentication | Desktop application can authenticate using web-based OAuth flow | P0 |
| Subscription Management | Automatic permission control for expired/canceled subscriptions | P0 |
| Security | All authentication data must be encrypted and tamper-proof | P0 |

### 1.2 Current System Limitations

```
Current State:
- Subscription verification via Creem.io checkout callback
- No persistent user identity
- No cross-device session support
- Desktop app has no authentication mechanism
```

---

## 2. Solution Overview

### Solution A: JWT + OAuth Hybrid (Recommended)

```
Architecture:
┌─────────────────────────────────────────────────────────────┐
│                     Frontend (Web)                          │
│  ┌─────────┐  ┌─────────────┐  ┌────────────────────────┐  │
│  │ Google  │  │ Email/Pass  │  │ Desktop Callback Flow  │  │
│  │ OAuth   │  │ Login       │  │ (?callback=localhost)  │  │
│  └────┬────┘  └──────┬──────┘  └───────────┬────────────┘  │
└───────┼──────────────┼─────────────────────┼───────────────┘
        │              │                     │
        ▼              ▼                     ▼
┌─────────────────────────────────────────────────────────────┐
│                    Backend API Server                       │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │
│  │ Auth Service│  │ JWT Service │  │ Subscription Service│ │
│  │             │  │             │  │                     │ │
│  │ - Google    │  │ - Access    │  │ - Creem Webhook    │ │
│  │ - Email     │  │ - Refresh   │  │ - Status Update    │ │
│  │ - Verify    │  │ - Validate  │  │ - Permission Check │ │
│  └─────────────┘  └─────────────┘  └─────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
        │                    │                    │
        ▼                    ▼                    ▼
┌─────────────┐      ┌─────────────┐      ┌─────────────────┐
│  PostgreSQL │      │    Redis    │      │   Creem.io API  │
│  - users    │      │ - sessions  │      │   - Webhooks    │
│  - subscrip │      │ - refresh   │      │   - Customer    │
│    tions    │      │   tokens    │      │     data        │
└─────────────┘      └─────────────┘      └─────────────────┘
```

### Solution B: Session-based + OAuth

```
Architecture:
┌─────────────────────────────────────────────────────────────┐
│                     Frontend (Web)                          │
│  ┌─────────┐  ┌─────────────┐  ┌────────────────────────┐  │
│  │ Google  │  │ Email/Pass  │  │ Desktop (Polling)      │  │
│  │ OAuth   │  │ Login       │  │                        │  │
│  └────┬────┘  └──────┬──────┘  └───────────┬────────────┘  │
└───────┼──────────────┼─────────────────────┼───────────────┘
        │              │                     │
        ▼              ▼                     ▼
┌─────────────────────────────────────────────────────────────┐
│                    Backend API Server                       │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │
│  │ Auth Service│  │ Session     │  │ Subscription Service│ │
│  │             │  │ Manager     │  │                     │ │
│  └─────────────┘  └─────────────┘  └─────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
        │                    │                    │
        ▼                    ▼                    ▼
┌─────────────┐      ┌─────────────┐      ┌─────────────────┐
│  PostgreSQL │      │    Redis    │      │   Creem.io API  │
│  - users    │      │ - sessions  │      │                 │
│  - subscrip │      │             │      │                 │
│    tions    │      │             │      │                 │
└─────────────┘      └─────────────┘      └─────────────────┘
```

### Solution C: Third-party Auth Service (Auth0/Firebase)

```
Architecture:
┌─────────────────────────────────────────────────────────────┐
│                     Frontend (Web)                          │
│  ┌────────────────────────────────────────────────────────┐│
│  │              Auth0/Firebase Auth SDK                   ││
│  └────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────────────────────────────────┐
│                 Auth0 / Firebase Auth                       │
│  - User Management                                          │
│  - OAuth Providers                                          │
│  - Session Management                                       │
└─────────────────────────────────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────────────────────────────────┐
│                    Backend API Server                       │
│  - Verify Auth0/Firebase tokens                             │
│  - Subscription Management                                  │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. Detailed Comparison

### 3.1 Technical Implementation Comparison

| Aspect | Solution A (JWT+OAuth) | Solution B (Session) | Solution C (Auth0) |
|--------|------------------------|----------------------|---------------------|
| **Implementation Complexity** | Medium | Low | Low |
| **Cross-device Support** | Excellent | Good | Excellent |
| **Desktop App Support** | Excellent (callback flow) | Poor (polling needed) | Good (SDK available) |
| **Token Revocation** | Refresh token rotation | Immediate | Configurable |
| **Stateless API** | Yes | No | Yes |
| **Scalability** | High | Medium | High (managed) |

### 3.2 Security Comparison

| Security Aspect | Solution A | Solution B | Solution C |
|-----------------|------------|------------|------------|
| **Token Encryption** | RS256 (asymmetric) | N/A (server-side) | RS256/HS256 |
| **Token Tampering** | Prevented by signature | N/A | Prevented |
| **Refresh Token Storage** | Redis + httpOnly cookie | N/A | Managed |
| **CSRF Protection** | Token-based (immune) | Requires CSRF token | Token-based |
| **XSS Protection** | httpOnly cookies | httpOnly cookies | httpOnly cookies |
| **Rate Limiting** | Custom implementation | Custom | Built-in options |

### 3.3 User Experience Comparison

| UX Aspect | Solution A | Solution B | Solution C |
|-----------|------------|------------|------------|
| **Login Speed** | Fast | Fast | Fast |
| **Session Persistence** | 30 days (refresh token) | Until cookie expires | Configurable |
| **Desktop App Flow** | Seamless callback | Clunky polling | SDK integration |
| **Offline Support** | Limited | No | Limited |
| **Mobile Experience** | Excellent | Good | Excellent |

### 3.4 Cost Analysis

| Cost Factor | Solution A | Solution B | Solution C |
|-------------|------------|------------|------------|
| **Development Time** | 2-3 weeks | 1-2 weeks | 1 week |
| **Infrastructure** | Redis required | Redis required | Managed (free tier available) |
| **Monthly Cost (1K users)** | ~$20 (Redis Cloud) | ~$20 | ~$0-50 (Auth0 free tier: 7K users) |
| **Monthly Cost (10K users)** | ~$50 | ~$50 | ~$240 (Auth0 Developer) |
| **Maintenance** | Medium | Medium | Low |

### 3.5 Pros and Cons Summary

#### Solution A: JWT + OAuth Hybrid (Recommended)

**Pros:**
- Stateless architecture, easy to scale
- Excellent desktop app support via callback flow
- Industry-standard approach
- Full control over authentication logic
- No vendor lock-in
- Cost-effective at scale

**Cons:**
- More complex implementation
- Requires Redis for refresh tokens
- Token revocation requires additional logic

#### Solution B: Session-based + OAuth

**Pros:**
- Simpler implementation
- Immediate session revocation
- Familiar to most developers

**Cons:**
- Not ideal for desktop app authentication
- Requires sticky sessions or shared session store
- CSRF protection needed
- Less scalable

#### Solution C: Third-party Auth Service

**Pros:**
- Fastest implementation
- Managed security
- Built-in social logins
- Enterprise features available

**Cons:**
- Vendor lock-in
- Cost increases with user base
- Less control over authentication flow
- Desktop callback flow may require custom implementation

---

## 4. Recommended Architecture

### 4.1 Recommendation: Solution A (JWT + OAuth Hybrid)

**Rationale:**
1. Best fit for desktop app callback authentication
2. Stateless design supports horizontal scaling
3. Full control over subscription integration
4. Cost-effective for growing user base
5. Industry-standard security practices

### 4.2 Detailed Architecture Design

```
┌────────────────────────────────────────────────────────────────────────┐
│                              CLIENT LAYER                               │
├────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────────────┐ │
│  │   Web Browser   │  │  Desktop App    │  │   Mobile App (Future)  │ │
│  │                 │  │                 │  │                         │ │
│  │ - OAuth Flow    │  │ - System Browser│  │ - OAuth Flow            │ │
│  │ - Email Login   │  │ - Callback URL  │  │ - Email Login           │ │
│  │ - Token Storage │  │ - Token Receive │  │ - Token Storage         │ │
│  └────────┬────────┘  └────────┬────────┘  └────────────┬────────────┘ │
│           │                    │                        │              │
└───────────┼────────────────────┼────────────────────────┼──────────────┘
            │                    │                        │
            ▼                    ▼                        ▼
┌────────────────────────────────────────────────────────────────────────┐
│                              API LAYER                                  │
├────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                      API Gateway / Load Balancer                 │   │
│  │                    (HTTPS, Rate Limiting, CORS)                  │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                    │                                    │
│  ┌─────────────────────────────────┼───────────────────────────────┐   │
│  │                                 │                               │   │
│  │  ┌──────────────┐  ┌───────────┴───────────┐  ┌──────────────┐ │   │
│  │  │ Auth Routes  │  │    Protected Routes    │  │ Webhook      │ │   │
│  │  │              │  │                        │  │ Routes       │ │   │
│  │  │ POST /login  │  │ GET  /api/user/me      │  │ POST /api/   │ │   │
│  │  │ POST /refresh│  │ POST /api/process      │  │ webhooks/    │ │   │
│  │  │ POST /logout │  │ GET  /api/desktop/     │  │ creem        │ │   │
│  │  │ GET  /oauth/ │  │      verify            │  │              │ │   │
│  │  │      google  │  │                        │  │              │ │   │
│  │  └──────┬───────┘  └───────────┬────────────┘  └──────┬───────┘ │   │
│  │         │                      │                      │         │   │
│  │         ▼                      ▼                      ▼         │   │
│  │  ┌──────────────────────────────────────────────────────────┐   │   │
│  │  │                    Middleware Stack                       │   │   │
│  │  │                                                           │   │   │
│  │  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐   │   │   │
│  │  │  │ Rate Limiter│  │ Auth Guard  │  │ Subscription    │   │   │   │
│  │  │  │             │  │ (JWT Verify)│  │ Guard           │   │   │   │
│  │  │  └─────────────┘  └─────────────┘  └─────────────────┘   │   │   │
│  │  └──────────────────────────────────────────────────────────┘   │   │
│  │                                                                 │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
└────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                            SERVICE LAYER                                │
├────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────────────┐ │
│  │  AuthService    │  │  JWTService     │  │  SubscriptionService    │ │
│  │                 │  │                 │  │                         │ │
│  │ - googleOAuth() │  │ - generate()    │  │ - handleWebhook()       │ │
│  │ - emailLogin()  │  │ - verify()      │  │ - checkStatus()         │ │
│  │ - register()    │  │ - refresh()     │  │ - updateSubscription()  │ │
│  │ - verifyEmail() │  │ - revoke()      │  │ - getPermissions()      │ │
│  └────────┬────────┘  └────────┬────────┘  └────────────┬────────────┘ │
│           │                    │                        │              │
│  ┌────────┴────────────────────┴────────────────────────┴────────────┐ │
│  │                         UserService                                │ │
│  │                                                                   │ │
│  │  - findById()    - findByEmail()    - findByGoogleId()           │ │
│  │  - create()      - update()         - delete()                   │ │
│  └───────────────────────────────────────────────────────────────────┘ │
│                                                                         │
└────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                            DATA LAYER                                   │
├────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌─────────────────────┐  ┌─────────────────────┐  ┌────────────────┐ │
│  │     PostgreSQL      │  │        Redis        │  │   Creem.io API │ │
│  │                     │  │                     │  │                │ │
│  │  users              │  │  refresh_tokens     │  │  - Webhooks    │ │
│  │  subscriptions      │  │  rate_limits        │  │  - Customers   │ │
│  │  email_verifications│  │  sessions           │  │  - Products    │ │
│  └─────────────────────┘  └─────────────────────┘  └────────────────┘ │
│                                                                         │
└────────────────────────────────────────────────────────────────────────┘
```

### 4.3 Data Models

```sql
-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255),
    google_id VARCHAR(255) UNIQUE,
    display_name VARCHAR(100),
    avatar_url TEXT,
    email_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Subscriptions table
CREATE TABLE subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    creem_customer_id VARCHAR(255),
    creem_subscription_id VARCHAR(255),
    plan VARCHAR(20) DEFAULT 'free' CHECK (plan IN ('free', 'pro')),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'canceled', 'past_due', 'unpaid')),
    current_period_start TIMESTAMP,
    current_period_end TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id)
);

-- Email verification tokens
CREATE TABLE email_verifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_google_id ON users(google_id);
CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_creem_customer_id ON subscriptions(creem_customer_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
```

### 4.4 JWT Token Structure

```javascript
// Access Token Payload
{
  "sub": "user-uuid",
  "email": "user@example.com",
  "plan": "pro",
  "subscription_status": "active",
  "iat": 1715942400,
  "exp": 1715950000,  // 2 hours from iat
  "iss": "geostamp.app",
  "aud": "geostamp.app"
}

// Refresh Token (stored in Redis)
{
  "sub": "user-uuid",
  "token_version": 1,
  "iat": 1715942400,
  "exp": 1718534400  // 30 days from iat
}
```

---

## 5. Security Considerations

### 5.1 Authentication Security

| Threat | Mitigation |
|--------|------------|
| **Brute Force Attack** | Rate limiting (5 attempts/minute), account lockout after 10 failures |
| **Credential Stuffing** | Rate limiting, password breach detection API |
| **Session Hijacking** | Secure, httpOnly cookies; token binding to IP (optional) |
| **XSS Token Theft** | httpOnly cookies for refresh token; access token in memory |
| **CSRF** | Token-based authentication (immune to CSRF) |
| **Token Replay** | Short access token lifetime; refresh token rotation |

### 5.2 Token Security

```
Access Token:
- Algorithm: RS256 (asymmetric)
- Lifetime: 2 hours
- Storage: Memory (JavaScript variable)
- Transmission: Authorization header

Refresh Token:
- Algorithm: Random 256-bit string
- Lifetime: 30 days
- Storage: Redis + httpOnly cookie
- Transmission: Cookie (automatic)
- Rotation: On every use
```

### 5.3 Webhook Security

```javascript
// Creem.io webhook signature verification
const verifyCreemWebhook = (payload, signature, secret) => {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(JSON.stringify(payload))
    .digest('hex');
  
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
};
```

### 5.4 Rate Limiting Configuration

```javascript
const rateLimitConfig = {
  login: {
    windowMs: 60 * 1000,  // 1 minute
    max: 5,               // 5 attempts per minute
    blockDuration: 15 * 60 * 1000  // 15 minute block
  },
  refresh: {
    windowMs: 60 * 1000,
    max: 20
  },
  api: {
    windowMs: 60 * 1000,
    max: 100
  }
};
```

---

## 6. Implementation Roadmap

### Phase 1: Core Authentication (Week 1)

- [ ] Set up PostgreSQL database schema
- [ ] Set up Redis for token storage
- [ ] Implement user registration (email/password)
- [ ] Implement email/password login
- [ ] Implement JWT token generation and verification
- [ ] Implement refresh token flow

### Phase 2: OAuth Integration (Week 1-2)

- [ ] Set up Google Cloud Console project
- [ ] Implement Google OAuth 2.0 flow
- [ ] Handle OAuth callback
- [ ] Link Google account to existing user

### Phase 3: Desktop App Support (Week 2)

- [ ] Implement callback URL handling
- [ ] Create desktop login page
- [ ] Implement token delivery to localhost
- [ ] Create `/api/desktop/verify` endpoint

### Phase 4: Subscription Integration (Week 2-3)

- [ ] Implement Creem.io webhook handler
- [ ] Create subscription status update logic
- [ ] Implement permission middleware
- [ ] Handle subscription expiration/cancellation

### Phase 5: Security Hardening (Week 3)

- [ ] Implement rate limiting
- [ ] Add CSRF protection (if needed)
- [ ] Security audit
- [ ] Penetration testing

### Phase 6: Testing & Documentation (Week 3)

- [ ] Unit tests
- [ ] Integration tests
- [ ] API documentation
- [ ] User guide for desktop app developers

---

## 7. Developer Integration Guide

### 7.1 Desktop App Integration

```javascript
// Desktop app authentication flow

// 1. Open login page in system browser
const callbackPort = 53492;  // Random available port
const loginUrl = `https://geostamp.app/login?callback=http://localhost:${callbackPort}/callback`;

// 2. Start local HTTP server to receive callback
const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://localhost:${callbackPort}`);
  const token = url.searchParams.get('token');
  
  if (token) {
    // Store token securely
    storeToken(token);
    res.end('Authentication successful! You can close this window.');
    server.close();
  }
});

server.listen(callbackPort);

// 3. Open browser
openBrowser(loginUrl);

// 4. Verify token with API
const verifyToken = async (token) => {
  const response = await fetch('https://api.geostamp.app/api/desktop/verify', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return response.json();
};
```

### 7.2 API Endpoints Summary

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/auth/login` | POST | No | Email/password login |
| `/api/auth/google` | POST | No | Google OAuth login |
| `/api/auth/register` | POST | No | New user registration |
| `/api/auth/refresh` | POST | No | Refresh access token |
| `/api/auth/logout` | POST | Yes | Invalidate session |
| `/api/user/me` | GET | Yes | Get current user info |
| `/api/desktop/verify` | GET | Yes | Verify token for desktop app |
| `/api/webhooks/creem` | POST | No | Creem.io webhook receiver |

---

## 8. Approval Required

Please review this document and confirm:

1. **Solution Selection**: Do you approve Solution A (JWT + OAuth Hybrid)?

2. **Database Choice**: PostgreSQL + Redis, or alternative preferences?

3. **OAuth Providers**: Google OAuth as primary, others to add later?

4. **Token Lifetime**: Access token 2 hours, Refresh token 30 days - acceptable?

5. **Desktop Callback Port Range**: Should we restrict to specific ports?

6. **Rate Limiting Thresholds**: Are the proposed limits appropriate?

---

**Document Status**: DRAFT - Awaiting Approval
**Next Step**: Begin implementation upon approval
