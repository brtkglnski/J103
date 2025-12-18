/**
 * Global Error Handling Middleware
 * 
 * Usage: place this AFTER all your routes in server.js/app.js
 * Example:
 * app.use(errorHandler);
 */

function errorHandler(err, req, res, next) {
    const statusCode = err.status || 500;

    if (statusCode === 401) {
        req.session.intendedUrl = req.originalUrl;
        return res.redirect('/login');
    }

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