// src/middleware/errorHandler.js

/**
 * Global Error Handling Middleware
 * 
 * Usage: place this AFTER all your routes in server.js/app.js
 * Example:
 * app.use(errorHandler);
 */

function errorHandler(err, req, res, next) {
    const statusCode = err.status || 500;

    console.error(`[${new Date().toISOString()}] Error:`, err);

    if (res.headersSent) {
        return next(err);
    }

    res.status(statusCode).render('pages/error', {
        req,
        statusCode,
        message: err.message || 'Something went wrong!',
    });
}

module.exports = errorHandler;
