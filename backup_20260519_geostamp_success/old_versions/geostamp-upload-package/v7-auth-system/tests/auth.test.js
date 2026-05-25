const request = require('supertest');
const app = require('../src/server');

describe('Authentication API', () => {
    describe('POST /api/auth/register', () => {
        it('should register a new user with valid data', async () => {
            const response = await request(app)
                .post('/api/auth/register')
                .send({
                    email: 'test@example.com',
                    password: 'password123',
                    displayName: 'Test User'
                });
            
            expect(response.status).toBe(201);
            expect(response.body).toHaveProperty('accessToken');
            expect(response.body).toHaveProperty('refreshToken');
            expect(response.body.user).toHaveProperty('id');
            expect(response.body.user.email).toBe('test@example.com');
        });
        
        it('should reject registration with invalid email', async () => {
            const response = await request(app)
                .post('/api/auth/register')
                .send({
                    email: 'invalid-email',
                    password: 'password123'
                });
            
            expect(response.status).toBe(400);
        });
        
        it('should reject registration with short password', async () => {
            const response = await request(app)
                .post('/api/auth/register')
                .send({
                    email: 'test2@example.com',
                    password: 'short'
                });
            
            expect(response.status).toBe(400);
        });
    });
    
    describe('POST /api/auth/login', () => {
        it('should login with valid credentials', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'test@example.com',
                    password: 'password123'
                });
            
            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('accessToken');
            expect(response.body).toHaveProperty('refreshToken');
        });
        
        it('should reject login with invalid credentials', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'test@example.com',
                    password: 'wrongpassword'
                });
            
            expect(response.status).toBe(401);
        });
    });
    
    describe('POST /api/auth/refresh', () => {
        it('should refresh token with valid refresh token', async () => {
            const loginResponse = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'test@example.com',
                    password: 'password123'
                });
            
            const response = await request(app)
                .post('/api/auth/refresh')
                .send({
                    userId: loginResponse.body.user.id,
                    refreshToken: loginResponse.body.refreshToken
                });
            
            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('accessToken');
            expect(response.body).toHaveProperty('refreshToken');
        });
    });
    
    describe('POST /api/auth/logout', () => {
        it('should logout successfully', async () => {
            const loginResponse = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'test@example.com',
                    password: 'password123'
                });
            
            const response = await request(app)
                .post('/api/auth/logout')
                .set('Authorization', `Bearer ${loginResponse.body.accessToken}`);
            
            expect(response.status).toBe(200);
        });
    });
});

describe('User API', () => {
    describe('GET /api/user/me', () => {
        it('should return user profile with valid token', async () => {
            const loginResponse = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'test@example.com',
                    password: 'password123'
                });
            
            const response = await request(app)
                .get('/api/user/me')
                .set('Authorization', `Bearer ${loginResponse.body.accessToken}`);
            
            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('id');
            expect(response.body).toHaveProperty('email');
            expect(response.body).toHaveProperty('subscription');
        });
        
        it('should reject request without token', async () => {
            const response = await request(app)
                .get('/api/user/me');
            
            expect(response.status).toBe(401);
        });
    });
});

describe('Desktop API', () => {
    describe('GET /api/desktop/verify', () => {
        it('should verify valid token', async () => {
            const loginResponse = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'test@example.com',
                    password: 'password123'
                });
            
            const response = await request(app)
                .get('/api/desktop/verify')
                .set('Authorization', `Bearer ${loginResponse.body.accessToken}`);
            
            expect(response.status).toBe(200);
            expect(response.body.valid).toBe(true);
            expect(response.body).toHaveProperty('user');
            expect(response.body).toHaveProperty('subscription');
        });
    });
});

describe('Health Check', () => {
    it('should return ok status', async () => {
        const response = await request(app)
            .get('/health');
        
        expect(response.status).toBe(200);
        expect(response.body.status).toBe('ok');
    });
});
