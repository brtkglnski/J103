const usersModel = require('../models/usersModel');

/* =========================================================
   SEARCH
   ========================================================= */

async function searchProfiles(req, res, next) {
    try {
        const currentUserId = req.session.userId;
        if (!currentUserId) {
            const err = new Error('Unauthorized: You must be logged in to search');
            err.status = 401;
            throw err;
        }

        const user = await usersModel.getUserById(currentUserId);
        if (!user) {
            const err = new Error('Current user not found');
            err.status = 404;
            throw err;
        }

        const users = await usersModel.searchUsers(req.query, currentUserId);
        res.render('pages/search', { req, user, users });
    } catch (err) {
        next(err);
    }
}

module.exports = {
    searchProfiles
};