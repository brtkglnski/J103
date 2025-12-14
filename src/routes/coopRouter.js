const express = require('express');

const router = express.Router();

const coopController = require('../controllers/coopController');
const uploadAvatar = require('../middleware/uploadAvatar');



router.get('/', coopController.index);
router.get('/match', coopController.matchUser);
router.post('/match', coopController.match);

router.get('/profile', coopController.viewProfile);
router.post('/profile/edit',uploadAvatar.single('avatar'), coopController.updateProfile);
router.get('/profile/:slug', coopController.viewProfile);
router.get('/profile/:slug/incoming', coopController.viewIncomingRequests);
router.post('/profile/:slug/incoming', coopController.manageIncomingRequest);
router.get('/profile/:slug/outgoing', coopController.viewOutgoingRequests);
router.post('/profile/:slug/outgoing', coopController.manageOutgoingRequest);
router.get('/profile/:slug/match/:targetSlug', coopController.match);
router.get('/profile/:slug/remove-match/:targetSlug', coopController.unmatch);
router.get('/registration', coopController.registrationForm);
router.post('/registration',  uploadAvatar.single('profileImage'), coopController.register);
router.get('/login', coopController.loginForm);
router.post('/login', coopController.login);
router.get('/logout', coopController.logout);

module.exports = router;