const express = require('express');
const router = express.Router();
const uploadAvatar = require('../middleware/uploadAvatar');

const indexController = require('../controllers/indexController');
const authController = require('../controllers/authController');
const profileController = require('../controllers/profileController');
const searchController = require('../controllers/searchController');
const matchController = require('../controllers/matchController');
const requestsController = require('../controllers/requestsController');

// index

router.get('/', indexController.index);

// authentication

router.get('/registration', authController.registrationForm);
router.post('/registration', uploadAvatar.single('profileImage'), authController.register);

router.get('/login', authController.loginForm);
router.post('/login', authController.login);

router.get('/logout', authController.logout);

// profile

router.get('/profile', profileController.viewProfile); // default redirect to own profile
router.get('/profile/:slug', profileController.viewProfile);

router.get('/profile/:slug/edit', profileController.updateProfileForm);
router.post('/profile/:slug/edit', uploadAvatar.single('profileImage'), profileController.updateProfile);

router.post('/profile/:slug/delete', profileController.deleteProfile);

// search

router.get('/search', searchController.searchProfiles);

// matching

router.get('/match', matchController.matchUser);
router.post('/match', matchController.match);

router.get('/profile/:slug/match/:targetSlug', matchController.match);
router.get('/profile/:slug/remove-match/:targetSlug', matchController.unmatch);

// requests

router.get('/profile/:slug/incoming', requestsController.viewIncomingRequests); 
router.post('/profile/:slug/incoming', requestsController.manageIncomingRequest);

router.get('/profile/:slug/outgoing', requestsController.viewOutgoingRequests);
router.post('/profile/:slug/outgoing', requestsController.manageOutgoingRequest);

module.exports = router;
