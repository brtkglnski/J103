const usersModel = require('../models/usersModel');

/* =========================================================
   MATCHING
   ========================================================= */

async function matchUser(req, res) {
    const currentUserId = req.session.userId;
    if (!currentUserId) return res.redirect('/login');
    const users = await usersModel.getAllMatchableUsers(currentUserId);
    res.render('pages/match', { req, users });
}

async function match(req, res) {
    const userId = req.session.userId;
    let matchedUserId = null;

    if (req.body?.matchedUserId) {
        matchedUserId = req.body.matchedUserId;
    } else if (req.params?.slug) {
        const matchedUser = await usersModel.getUserBySlug(req.params.slug);
        if (!matchedUser) return res.status(404).send('User not found');
        matchedUserId = matchedUser._id;
    }
    if (!matchedUserId) {
        return res.status(400).send('No matched user specified');
    }
    await usersModel.addMatch(userId, matchedUserId);
    res.redirect(req.get('Referer'));
}

async function unmatch(req, res) {
    const userId = req.session.userId;
    if (!userId) return res.redirect('/login');

    let matchedUserId = null;

    if (req.body?.matchedUserId) {
        matchedUserId = req.body.matchedUserId;
    } else if (req.body?.userId) {
        matchedUserId = req.body.userId;
    } else if (req.params?.slug) {
        const matchedUser = await usersModel.getUserBySlug(req.params.slug);
        if (!matchedUser) return res.status(404).send('User not found');
        matchedUserId = matchedUser._id;
    }
    if (!matchedUserId) {
        return res.status(400).send('No matched user specified');
    }
    await usersModel.removeMatch(userId, matchedUserId);
    res.redirect(req.get('Referer'));
}

module.exports = {
    matchUser,
    match,
    unmatch
};
