const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { setRefreshToken, getRefreshToken, deleteRefreshToken } = require('../database/redis');

const ACCESS_TOKEN_EXPIRY = process.env.JWT_ACCESS_EXPIRY || '2h';
const REFRESH_TOKEN_EXPIRY = process.env.JWT_REFRESH_EXPIRY || '30d';
const JWT_ISSUER = process.env.JWT_ISSUER || 'geostamp.app';
const JWT_AUDIENCE = process.env.JWT_AUDIENCE || 'geostamp.app';

const generateAccessToken = (user, subscription) => {
    const payload = {
        sub: user.id,
        email: user.email,
        plan: subscription?.plan || 'free',
        subscription_status: subscription?.status || 'active'
    };

    return jwt.sign(payload, process.env.JWT_ACCESS_SECRET, {
        expiresIn: ACCESS_TOKEN_EXPIRY,
        issuer: JWT_ISSUER,
        audience: JWT_AUDIENCE,
        jwtid: uuidv4()
    });
};

const generateRefreshToken = async (userId) => {
    const token = uuidv4() + '.' + Date.now().toString(36);
    await setRefreshToken(userId, token, 30);
    return token;
};

const generateTokens = async (user, subscription) => {
    const accessToken = generateAccessToken(user, subscription);
    const refreshToken = await generateRefreshToken(user.id);
    return { accessToken, refreshToken };
};

const verifyAccessToken = (token) => {
    try {
        return jwt.verify(token, process.env.JWT_ACCESS_SECRET, {
            issuer: JWT_ISSUER,
            audience: JWT_AUDIENCE
        });
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            throw new Error('Token expired');
        }
        if (error.name === 'JsonWebTokenError') {
            throw new Error('Invalid token');
        }
        throw error;
    }
};

const verifyRefreshToken = async (userId, token) => {
    const storedToken = await getRefreshToken(userId);
    if (!storedToken || storedToken !== token) {
        throw new Error('Invalid refresh token');
    }
    return true;
};

const refreshTokens = async (userId, oldRefreshToken) => {
    await verifyRefreshToken(userId, oldRefreshToken);
    const newRefreshToken = await generateRefreshToken(userId);
    return newRefreshToken;
};

const revokeRefreshToken = async (userId) => {
    await deleteRefreshToken(userId);
};

const decodeToken = (token) => {
    return jwt.decode(token);
};

module.exports = {
    generateAccessToken,
    generateRefreshToken,
    generateTokens,
    verifyAccessToken,
    verifyRefreshToken,
    refreshTokens,
    revokeRefreshToken,
    decodeToken
};
