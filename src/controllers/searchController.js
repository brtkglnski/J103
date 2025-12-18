const usersModel = require('../models/usersModel');

/* =========================================================
   SEARCH
   ========================================================= */

async function searchProfiles(req, res) {
    const currentUserId = req.session.userId;
    if (!currentUserId) return res.redirect('/login');
    const user = await usersModel.getUserById(currentUserId);
    const users = await usersModel.searchUsers(req.query, currentUserId);
    res.render('pages/search', { req, user, users });
}

module.exports = {
    searchProfiles
};
