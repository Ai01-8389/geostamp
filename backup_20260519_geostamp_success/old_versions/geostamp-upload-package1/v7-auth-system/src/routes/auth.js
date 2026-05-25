const express = require('express');
const { body, validationResult } = require('express-validator');
const authService = require('../services/authService');
const { authenticate } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');

const router = express.Router();

const registerValidation = [
    body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
    body('displayName').optional().trim().isLength({ max: 100 })
];

const loginValidation = [
    body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
    body('password').notEmpty().withMessage('Password required')
];

router.post('/register', registerValidation, asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    
    const { email, password, displayName } = req.body;
    const result = await authService.registerWithEmail(email, password, displayName);
    
    res.status(201).json({
        message: 'Registration successful',
        ...result
    });
}));

router.post('/login', loginValidation, asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    
    const { email, password } = req.body;
    const result = await authService.loginWithEmail(email, password);
    
    res.json({
        message: 'Login successful',
        ...result
    });
}));

router.post('/google', asyncHandler(async (req, res) => {
    const { idToken } = req.body;
    
    if (!idToken) {
        return res.status(400).json({ error: 'Google ID token required' });
    }
    
    const result = await authService.loginWithGoogle(idToken);
    
    res.json({
        message: 'Google login successful',
        ...result
    });
}));

router.post('/refresh', asyncHandler(async (req, res) => {
    const { refreshToken, userId } = req.body;
    
    if (!refreshToken || !userId) {
        return res.status(400).json({ error: 'Refresh token and user ID required' });
    }
    
    const tokens = await authService.refreshAccessToken(userId, refreshToken);
    
    res.json({
        message: 'Token refreshed',
        ...tokens
    });
}));

router.post('/logout', authenticate, asyncHandler(async (req, res) => {
    await authService.logout(req.user.id);
    
    res.json({ message: 'Logged out successfully' });
}));

module.exports = router;
