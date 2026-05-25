const jwtService = require('../services/jwtService');
const userService = require('../services/userService');
const subscriptionService = require('../services/subscriptionService');

const authenticate = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'No token provided' });
        }
        
        const token = authHeader.substring(7);
        const decoded = jwtService.verifyAccessToken(token);
        
        const user = await userService.findById(decoded.sub);
        if (!user) {
            return res.status(401).json({ error: 'User not found' });
        }
        
        req.user = {
            id: user.id,
            email: user.email,
            displayName: user.display_name,
            avatarUrl: user.avatar_url,
            emailVerified: user.email_verified
        };
        
        req.tokenPayload = decoded;
        
        next();
    } catch (error) {
        if (error.message === 'Token expired') {
            return res.status(401).json({ error: 'Token expired', code: 'TOKEN_EXPIRED' });
        }
        return res.status(401).json({ error: 'Invalid token' });
    }
};

const requireSubscription = (requiredPlan = 'pro') => {
    return async (req, res, next) => {
        try {
            const subscription = await subscriptionService.findByUserId(req.user.id);
            const permissions = subscriptionService.getPermissions(subscription);
            
            if (requiredPlan === 'pro' && !subscriptionService.isPro(subscription)) {
                return res.status(403).json({
                    error: 'Subscription required',
                    code: 'SUBSCRIPTION_REQUIRED',
                    message: 'This feature requires a Pro subscription',
                    currentPlan: permissions.plan,
                    subscriptionStatus: permissions.status
                });
            }
            
            req.subscription = subscription;
            req.permissions = permissions;
            
            next();
        } catch (error) {
            return res.status(500).json({ error: 'Failed to verify subscription' });
        }
    };
};

const optionalAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        
        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.substring(7);
            const decoded = jwtService.verifyAccessToken(token);
            
            const user = await userService.findById(decoded.sub);
            if (user) {
                req.user = {
                    id: user.id,
                    email: user.email,
                    displayName: user.display_name,
                    avatarUrl: user.avatar_url,
                    emailVerified: user.email_verified
                };
                req.tokenPayload = decoded;
            }
        }
        
        next();
    } catch (error) {
        next();
    }
};

module.exports = {
    authenticate,
    requireSubscription,
    optionalAuth
};
