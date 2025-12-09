const express = require('express');

const router = express.Router();

const coopController = require('../controllers/coopController');

router.get('/', coopController.index);
router.get('/match', coopController.matchUser);
router.get('/profile', coopController.viewProfile);
router.get('/profile/:slug', coopController.viewProfile);
router.get('/registration', coopController.registrationForm);
router.post('/registration', coopController.register);
router.get('/login', coopController.loginForm);
router.post('/login', coopController.login);
router.get('/logout', coopController.logout);

module.exports = router;