const { OAuth2Client } = require('google-auth-library');
const userService = require('./userService');
const subscriptionService = require('./subscriptionService');
const jwtService = require('./jwtService');
const { query } = require('../database');

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const registerWithEmail = async (email, password, displayName) => {
    const existingUser = await userService.findByEmail(email);
    if (existingUser) {
        throw new Error('Email already registered');
    }
    
    const user = await userService.create({
        email,
        password,
        displayName
    });
    
    const subscription = await subscriptionService.findByUserId(user.id);
    const tokens = await jwtService.generateTokens(user, subscription);
    
    return {
        user: {
            id: user.id,
            email: user.email,
            displayName: user.display_name,
            avatarUrl: user.avatar_url,
            emailVerified: user.email_verified
        },
        ...tokens
    };
};

const loginWithEmail = async (email, password) => {
    const user = await userService.findByEmail(email);
    if (!user) {
        throw new Error('Invalid credentials');
    }
    
    if (!user.password_hash) {
        throw new Error('Please sign in with Google');
    }
    
    const isValid = await userService.verifyPassword(user, password);
    if (!isValid) {
        throw new Error('Invalid credentials');
    }
    
    const subscription = await subscriptionService.findByUserId(user.id);
    const tokens = await jwtService.generateTokens(user, subscription);
    
    return {
        user: {
            id: user.id,
            email: user.email,
            displayName: user.display_name,
            avatarUrl: user.avatar_url,
            emailVerified: user.email_verified
        },
        ...tokens
    };
};

const loginWithGoogle = async (idToken) => {
    const ticket = await googleClient.verifyIdToken({
        idToken,
        audience: process.env.GOOGLE_CLIENT_ID
    });
    
    const payload = ticket.getPayload();
    const { sub: googleId, email, name, picture } = payload;
    
    let user = await userService.findByGoogleId(googleId);
    
    if (!user) {
        user = await userService.findByEmail(email);
        if (user) {
            user = await userService.linkGoogleAccount(user.id, googleId, picture);
        } else {
            user = await userService.create({
                email,
                googleId,
                displayName: name,
                avatarUrl: picture
            });
        }
    }
    
    const subscription = await subscriptionService.findByUserId(user.id);
    const tokens = await jwtService.generateTokens(user, subscription);
    
    return {
        user: {
            id: user.id,
            email: user.email,
            displayName: user.display_name,
            avatarUrl: user.avatar_url,
            emailVerified: user.email_verified
        },
        ...tokens
    };
};

const refreshAccessToken = async (userId, refreshToken) => {
    const user = await userService.findById(userId);
    if (!user) {
        throw new Error('User not found');
    }
    
    const newRefreshToken = await jwtService.refreshTokens(userId, refreshToken);
    const subscription = await subscriptionService.findByUserId(userId);
    const accessToken = jwtService.generateAccessToken(user, subscription);
    
    return {
        accessToken,
        refreshToken: newRefreshToken
    };
};

const logout = async (userId) => {
    await jwtService.revokeRefreshToken(userId);
};

const getFullUserProfile = async (userId) => {
    const user = await userService.findById(userId);
    if (!user) {
        throw new Error('User not found');
    }
    
    const subscription = await subscriptionService.findByUserId(userId);
    const permissions = subscriptionService.getPermissions(subscription);
    
    return {
        id: user.id,
        email: user.email,
        displayName: user.display_name,
        avatarUrl: user.avatar_url,
        emailVerified: user.email_verified,
        createdAt: user.created_at,
        subscription: {
            plan: subscription?.plan || 'free',
            status: subscription?.status || 'active',
            currentPeriodEnd: subscription?.current_period_end || null
        },
        permissions
    };
};

module.exports = {
    registerWithEmail,
    loginWithEmail,
    loginWithGoogle,
    refreshAccessToken,
    logout,
    getFullUserProfile
};
