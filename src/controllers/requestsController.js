const usersModel = require('../models/usersModel');

/* =========================================================
   REQUESTS
   ========================================================= */

async function viewIncomingRequests(req, res, next) {
    try {
        const sessionSlug = req.session.userSlug;
        if (!sessionSlug) {
            const err = new Error('Unauthorized');
            err.status = 401;
            throw err;
        }
        if (sessionSlug !== req.params.slug) {
            const err = new Error('Forbidden access to this profile');
            err.status = 403;
            throw err;
        }

        const user = await usersModel.getUserBySlug(req.params.slug);

        const incomingRequests = await Promise.all(
            (user.incomingRequests || []).map(async userId => {
                const u = await usersModel.getUserById(userId);
                return { ...u, direction: 'incoming' };
            })
        );

        res.render('pages/requests', { req, user, requestsType: "incoming", requests: incomingRequests });
    } catch (err) {
        next(err);
    }
}

async function manageIncomingRequest(req, res, next) {
    try {
        const userId = req.session.userId;
        const action = req.body.action;
        const targetId = req.body.targetId;

        if (!userId) {
            const err = new Error('Unauthorized');
            err.status = 401;
            throw err;
        }
        if (!targetId) {
            const err = new Error('No target user specified');
            err.status = 400;
            throw err;
        }

        if (action === 'accept') {
            await usersModel.addMatch(userId, targetId);
        } else if (action === 'reject') {
            await usersModel.removeMatch(userId, targetId);
        } else {
            const err = new Error('Invalid action');
            err.status = 400;
            throw err;
        }

        const incoming = await usersModel.getIncomingRequests(userId);
        res.render('pages/requests', { 
            req, 
            requestsType: "incoming", 
            requests: incoming.map(u => ({ ...u, direction: 'incoming' })) 
        });
    } catch (err) {
        next(err);
    }
}

async function viewOutgoingRequests(req, res, next) {
    try {
        const sessionSlug = req.session.userSlug;
        if (!sessionSlug) {
            const err = new Error('Unauthorized');
            err.status = 401;
            throw err;
        }
        if (sessionSlug !== req.params.slug) {
            const err = new Error('Forbidden access to this profile');
            err.status = 403;
            throw err;
        }

        const user = await usersModel.getUserBySlug(req.params.slug);

        const outgoingRequests = await Promise.all(
            (user.outgoingRequests || []).map(async userId => {
                const u = await usersModel.getUserById(userId);
                return { ...u, direction: 'outgoing' };
            })
        );

        res.render('pages/requests', { req, user, requestsType: "outgoing", requests: outgoingRequests });
    } catch (err) {
        next(err);
    }
}

async function manageOutgoingRequest(req, res, next) {
    try {
        const userId = req.session.userId;
        const action = req.body.action;
        const targetId = req.body.targetId;

        if (!userId) {
            const err = new Error('Unauthorized');
            err.status = 401;
            throw err;
        }
        if (!targetId) {
            const err = new Error('No target user specified');
            err.status = 400;
            throw err;
        }

        if (action === 'cancel') {
            await usersModel.removeMatch(userId, targetId);
        } else {
            const err = new Error('Invalid action');
            err.status = 400;
            throw err;
        }

        const outgoing = await usersModel.getOutgoingRequests(userId);
        res.render('pages/requests', { 
            req, 
            requestsType: "outgoing", 
            requests: outgoing.map(u => ({ ...u, direction: 'outgoing' })) 
        });
    } catch (err) {
        next(err);
    }
}

module.exports = {
    viewIncomingRequests,
    manageIncomingRequest,
    viewOutgoingRequests,
    manageOutgoingRequest
};