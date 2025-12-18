const usersModel = require('../models/usersModel');

/* =========================================================
   MATCHING
   ========================================================= */

async function matchUser(req, res, next) {
  try {
    const currentUserId = req.session.userId;
    if (!currentUserId) {
      const err = new Error('Unauthorized: Please log in to view matches');
      err.status = 401;
      return next(err);
    }

    const users = await usersModel.getAllMatchableUsers(currentUserId);
    res.render('pages/match', { req, users });
  } catch (err) {
    err.status = err.status || 500;
    next(err);
  }
}

async function match(req, res, next) {
  try {
    const userId = req.session.userId;
    if (!userId) {
      const err = new Error('Unauthorized: Please log in to perform this action');
      err.status = 401;
      return next(err);
    }

    let matchedUserId = null;

    if (req.body?.matchedUserId) {
      matchedUserId = req.body.matchedUserId;
    } else if (req.params?.slug) {
      const matchedUser = await usersModel.getUserBySlug(req.params.slug);
      if (!matchedUser) {
        const err = new Error('User not found');
        err.status = 404;
        return next(err);
      }
      matchedUserId = matchedUser._id;
    }

    if (!matchedUserId) {
      const err = new Error('No matched user specified');
      err.status = 400;
      return next(err);
    }

    await usersModel.addMatch(userId, matchedUserId);
    res.redirect(req.get('Referer'));
  } catch (err) {
    err.status = err.status || 500;
    next(err);
  }
}

async function unmatch(req, res, next) {
  try {
    const userId = req.session.userId;
    if (!userId) {
      const err = new Error('Unauthorized: Please log in to perform this action');
      err.status = 401;
      return next(err);
    }

    let matchedUserId = null;

    if (req.body?.matchedUserId) {
      matchedUserId = req.body.matchedUserId;
    } else if (req.body?.userId) {
      matchedUserId = req.body.userId;
    } else if (req.params?.slug) {
      const matchedUser = await usersModel.getUserBySlug(req.params.slug);
      if (!matchedUser) {
        const err = new Error('User not found');
        err.status = 404;
        return next(err);
      }
      matchedUserId = matchedUser._id;
    }

    if (!matchedUserId) {
      const err = new Error('No matched user specified');
      err.status = 400;
      return next(err);
    }

    await usersModel.removeMatch(userId, matchedUserId);
    res.redirect(req.get('Referer'));
  } catch (err) {
    err.status = err.status || 500;
    next(err);
  }
}

module.exports = {
  matchUser,
  match,
  unmatch
};
