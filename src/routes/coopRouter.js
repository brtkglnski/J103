const express = require('express');
const router = express.Router();
const uploadAvatar = require('../middleware/uploadAvatar');

const authMiddleware = require('../middleware/authMiddleware');

const indexController = require('../controllers/indexController');
const authController = require('../controllers/authController');
const profileController = require('../controllers/profileController');
const searchController = require('../controllers/searchController');
const matchController = require('../controllers/matchController');
const requestsController = require('../controllers/requestsController');

// index

router.get('/', indexController.index);

// authentication

router.get('/registration', authMiddleware.redirectIfAuthenticated, authController.registrationForm);
router.post('/registration', uploadAvatar.single('profileImage'), authController.register);

router.get('/login', authMiddleware.redirectIfAuthenticated, authController.loginForm);
router.post('/login', authController.login);

router.get('/logout', authController.logout);

// profile

router.get('/profile', authMiddleware.requireAuth, profileController.viewProfile); // default redirect to own profile
router.get('/profile/:slug', profileController.viewProfile);

router.get('/profile/:slug/edit',authMiddleware.requireAuth, authMiddleware.requireOwnership, profileController.updateProfileForm);
router.post('/profile/:slug/edit',authMiddleware.requireAuth, authMiddleware.requireOwnership, uploadAvatar.single('profileImage'), profileController.updateProfile);

router.post('/profile/:slug/delete',authMiddleware.requireAuth, authMiddleware.requireOwnership, profileController.deleteProfile);

// search

router.get('/search', authMiddleware.requireAuth,searchController.searchProfiles);

// matching

router.get('/match', authMiddleware.requireAuth, matchController.matchUser);
router.post('/match', authMiddleware.requireAuth, matchController.match);

router.get('/profile/:slug/match/:targetSlug', authMiddleware.requireAuth, matchController.match);
router.get('/profile/:slug/remove-match/:targetSlug', authMiddleware.requireAuth, matchController.unmatch);

// requests

router.get('/profile/:slug/incoming', authMiddleware.requireAuth, authMiddleware.requireOwnership, requestsController.viewIncomingRequests); 
router.post('/profile/:slug/incoming', authMiddleware.requireAuth,authMiddleware.requireOwnership, requestsController.manageIncomingRequest);

router.get('/profile/:slug/outgoing', authMiddleware.requireAuth, authMiddleware.requireOwnership, requestsController.viewOutgoingRequests);
router.post('/profile/:slug/outgoing', authMiddleware.requireAuth,authMiddleware.requireOwnership, requestsController.manageOutgoingRequest);

module.exports = router;
