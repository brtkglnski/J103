const usersModel = require('../models/usersModel');

/* =========================================================
   SEARCH
   ========================================================= */

async function searchProfiles(req, res, next) {
    try {
        const currentUserId = req.session.userId;
        if (!currentUserId) return res.redirect('/login');

        const user = await usersModel.getUserById(currentUserId);
        const users = await usersModel.searchUsers(req.query, currentUserId);

        res.render('pages/search', { req, user, users });
    } catch (err) {
        next(err);
    }
}

module.exports = {
    searchProfiles
};
