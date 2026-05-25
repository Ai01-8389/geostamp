# GeoStamp Authentication System v7

## Overview

This is the authentication system for GeoStamp, implementing a JWT + OAuth Hybrid architecture for seamless cross-device authentication.

## Features

- **Google OAuth 2.0** - Primary authentication method
- **Email/Password Login** - Backup authentication method
- **JWT Token System** - Access tokens (2h) + Refresh tokens (30d)
- **Desktop App Support** - Callback-based authentication flow
- **Creem.io Integration** - Subscription management via webhooks
- **Rate Limiting** - Protection against brute force attacks

## Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Web Browser   │     │  Desktop App    │     │   Mobile App    │
└────────┬────────┘     └────────┬────────┘     └────────┬────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                                 ▼
                    ┌────────────────────────┐
                    │     Express Server     │
                    │  - Auth Routes         │
                    │  - User Routes         │
                    │  - Desktop Routes      │
                    │  - Webhook Routes      │
                    └───────────┬────────────┘
                                │
            ┌───────────────────┼───────────────────┐
            │                   │                   │
            ▼                   ▼                   ▼
    ┌───────────────┐   ┌───────────────┐   ┌───────────────┐
    │  PostgreSQL   │   │    Redis      │   │   Creem.io    │
    │  - users      │   │ - tokens      │   │   - Webhooks  │
    │  - subscript  │   │ - sessions    │   │   - Payments  │
    └───────────────┘   └───────────────┘   └───────────────┘
```

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
# Edit .env with your configuration
```

### 3. Setup Database

```bash
# Run PostgreSQL schema
psql -d geostamp -f database/schema.sql
```

### 4. Start Server

```bash
npm start
# or for development:
npm run dev
```

## API Endpoints

### Authentication

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/register` | POST | Register new user |
| `/api/auth/login` | POST | Login with email/password |
| `/api/auth/google` | POST | Login with Google OAuth |
| `/api/auth/refresh` | POST | Refresh access token |
| `/api/auth/logout` | POST | Logout user |

### User

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/user/me` | GET | Get current user profile |
| `/api/user/subscription` | GET | Get subscription status |

### Desktop

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/desktop/verify` | GET | Verify token for desktop app |
| `/api/desktop/callback` | GET | Handle desktop callback |

### Webhooks

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/webhooks/creem` | POST | Creem.io webhook receiver |

## Desktop App Integration

### Authentication Flow

1. Desktop app opens login URL in system browser:
   ```
   https://geostamp.app/login?callback=http://localhost:53492/callback
   ```

2. User completes login in browser

3. Browser sends token to callback URL:
   ```
   GET http://localhost:53492/callback?token={jwt_token}
   ```

4. Desktop app receives and stores token

5. Desktop app verifies token:
   ```
   GET /api/desktop/verify
   Authorization: Bearer {token}
   ```

### Example Desktop Code (Electron)

```javascript
const { shell } = require('electron');
const http = require('http');

function login() {
    const port = 53492;
    const loginUrl = `https://geostamp.app/login?callback=http://localhost:${port}/callback`;
    
    const server = http.createServer((req, res) => {
        const url = new URL(req.url, `http://localhost:${port}`);
        const token = url.searchParams.get('token');
        
        if (token) {
            storeToken(token);
            res.end('Success! You can close this window.');
            server.close();
        }
    });
    
    server.listen(port);
    shell.openExternal(loginUrl);
}
```

## Testing

```bash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage
```

## Security Features

- **Rate Limiting**: 5 login attempts per minute
- **Password Hashing**: bcrypt with 10 rounds
- **JWT Signing**: RS256 (asymmetric) recommended
- **Refresh Token Rotation**: New token on each refresh
- **Webhook Verification**: HMAC-SHA256 signature validation

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection string | Yes |
| `REDIS_URL` | Redis connection string | Yes |
| `JWT_ACCESS_SECRET` | Secret for access tokens | Yes |
| `JWT_REFRESH_SECRET` | Secret for refresh tokens | Yes |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID | Yes |
| `CREEM_API_KEY` | Creem.io API key | Yes |
| `CREEM_WEBHOOK_SECRET` | Creem.io webhook secret | Yes |

## License

ISC
