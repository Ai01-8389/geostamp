const express = require('express');
const authService = require('../services/authService');
const { authenticate } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');

const router = express.Router();

router.get('/me', authenticate, asyncHandler(async (req, res) => {
    const userProfile = await authService.getFullUserProfile(req.user.id);
    
    res.json(userProfile);
}));

router.get('/subscription', authenticate, asyncHandler(async (req, res) => {
    const userProfile = await authService.getFullUserProfile(req.user.id);
    
    res.json({
        subscription: userProfile.subscription,
        permissions: userProfile.permissions
    });
}));

module.exports = router;
