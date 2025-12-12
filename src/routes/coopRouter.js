const express = require('express');

const router = express.Router();

const coopController = require('../controllers/coopController');

router.get('/', coopController.index);
router.get('/match', coopController.matchUser);
router.post('/match', coopController.match);

router.get('/profile', coopController.viewProfile);
router.get('/profile/:slug', coopController.viewProfile);
router.get('/profile/:slug/incoming', coopController.viewIncomingRequests);
router.post('/profile/:slug/incoming', coopController.manageIncomingRequest);
router.get('/profile/:slug/outgoing', coopController.viewOutgoingRequests);
router.post('/profile/:slug/outgoing', coopController.manageOutgoingRequest);
router.get('/registration', coopController.registrationForm);
router.post('/registration', coopController.register);
router.get('/login', coopController.loginForm);
router.post('/login', coopController.login);
router.get('/logout', coopController.logout);

module.exports = router;