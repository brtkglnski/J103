const usersModel = require('../models/usersModel');

/* =========================================================
   REQUESTS
   ========================================================= */

async function viewIncomingRequests(req, res) {
    const sessionSlug = req.session.userSlug;
    if (!sessionSlug || sessionSlug !== req.params.slug) return res.redirect('/');
    const user = await usersModel.getUserBySlug(req.params.slug);

    const incomingRequests = await Promise.all(
        (user.incomingRequests || []).map(async userId => {
            const u = await usersModel.getUserById(userId);
            return { ...u, direction: 'incoming' };
        })
    );

    res.render('pages/requests', { req, user, requestsType: "incoming", requests: incomingRequests });
}

async function manageIncomingRequest(req, res) {
    const userId = req.session.userId;
    const action = req.body.action;
    const targetId = req.body.targetId;

    if (action === 'accept') {
        await usersModel.addMatch(userId, targetId);
    } else if (action === 'reject') {
        await usersModel.removeMatch(userId, targetId);
    }

    const incoming = await usersModel.getIncomingRequests(userId);
    res.render('pages/requests', { req, requestsType: "incoming", requests: incoming.map(u => ({ ...u, direction: 'incoming' })) });
}

async function viewOutgoingRequests(req, res) {
    const sessionSlug = req.session.userSlug;
    if (!sessionSlug || sessionSlug !== req.params.slug) return res.redirect('/');
    const user = await usersModel.getUserBySlug(req.params.slug);

    const outgoingRequests = await Promise.all(
        (user.outgoingRequests || []).map(async userId => {
            const u = await usersModel.getUserById(userId);
            return { ...u, direction: 'outgoing' };
        })
    );

    res.render('pages/requests', { req, user, requestsType: "outgoing", requests: outgoingRequests });
}

async function manageOutgoingRequest(req, res) {
    const userId = req.session.userId;
    const action = req.body.action;
    const targetId = req.body.targetId;

    if (action === 'cancel') {
        await usersModel.removeMatch(userId, targetId);
    }
    
    const outgoing = await usersModel.getOutgoingRequests(userId);
    res.render('pages/requests', { req, requestsType: "outgoing", requests: outgoing.map(u => ({ ...u, direction: 'outgoing' })) });
}


module.exports = {
    viewIncomingRequests,
    manageIncomingRequest,
    viewOutgoingRequests,
    manageOutgoingRequest
};
