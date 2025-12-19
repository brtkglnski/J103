function requireAuth(req, res, next) {
    if (!req.session.userId) {
        req.session.intendedUrl = req.originalUrl;
        const err = new Error('Unauthorized');
        err.status = 401;
        return next(err);
    }
    next();
}

function requireOwnership(req, res, next) {
    if (req.session.userSlug !== req.params.slug) {
        const err = new Error('Forbidden');
        err.status = 403;
        return next(err);
    }
    next();
}

function redirectIfAuthenticated(req, res, next) {
    if (req.session.userId) {
        return res.redirect('/');
    }
    next();
}

module.exports = { requireAuth, requireOwnership, redirectIfAuthenticated };