const usersModel = require('../models/usersModel');

/* =========================================================
   INDEX
   ========================================================= */

async function index(req, res, next) {
    try {
        res.render('pages/index', { req });
    } catch (err) {
        err.message = err.message || 'Failed to load homepage';
        err.status = err.status || 500;
        next(err); 
    }
}

module.exports = {
    index
};