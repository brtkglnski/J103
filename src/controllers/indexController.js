const usersModel = require('../models/usersModel');

/* =========================================================
   INDEX
   ========================================================= */

async function index(req, res) {
    const users = await usersModel.getAllUsers();
    res.render('pages/index', { req, users });
}

module.exports = {
    index
};
