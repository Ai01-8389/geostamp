const errorHandler = (err, req, res, next) => {
    console.error('Error:', err.message);
    console.error('Stack:', err.stack);
    
    if (err.name === 'ValidationError') {
        return res.status(400).json({
            error: 'Validation error',
            details: err.details
        });
    }
    
    if (err.code === '23505') {
        return res.status(409).json({
            error: 'Resource already exists'
        });
    }
    
    if (err.message.includes('not found')) {
        return res.status(404).json({
            error: err.message
        });
    }
    
    if (err.message.includes('Invalid credentials') || err.message.includes('Invalid token')) {
        return res.status(401).json({
            error: err.message
        });
    }
    
    if (err.message.includes('already registered') || err.message.includes('already exists')) {
        return res.status(409).json({
            error: err.message
        });
    }
    
    res.status(500).json({
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
};

const asyncHandler = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};

module.exports = {
    errorHandler,
    asyncHandler
};
