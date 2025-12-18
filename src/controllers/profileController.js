const fs = require('fs');
const path = require('path');
const usersModel = require('../models/usersModel');

/* =========================================================
   USER PROFILE
   ========================================================= */

async function viewProfile(req, res, next) {
    try {
        let slug = req.params.slug;
        if (!slug) {
            if (req.session.userId) {
                const user = await usersModel.getUserById(req.session.userId);
                slug = user.userSlug;
                return res.redirect(`/profile/${slug}`);
            }
            return res.redirect('/login');
        }

        const user = await usersModel.getUserBySlug(slug);

        if (!user) {
            const err = new Error('User not found');
            err.status = 404;
            throw err;
        }

        const partners = await Promise.all(
            (user.partners || []).map(id => usersModel.getUserById(id))
        );

        const isPartner = partners.some(
            p => p._id.toString() === req.session.userId
        );

        const hasOutgoingRequest = user.incomingRequests?.some(
            id => id.toString() === req.session.userId
        );

        res.render('pages/profile', { req, user, partners, isPartner, hasOutgoingRequest });
    } catch (err) {
        next(err);
    }
}

/* =========================================================
   UPDATE PROFILE
   ========================================================= */

async function updateProfileForm(req, res, next) {
    try {
        if (!req.session.userId) return res.redirect('/');
        if (req.session.userSlug !== req.params.slug) return res.redirect('/');

        const user = await usersModel.getUserById(req.session.userId);
        if (!user) {
            const err = new Error('User not found');
            err.status = 404;
            throw err;
        }

        res.render('pages/updateprofile', {
            req,
            errors: [],
            values: {
                username: user.username,
                age: user.age,
                description: user.description
            }
        });
    } catch (err) {
        next(err);
    }
}

async function updateProfile(req, res, next) {
    try {
        const userId = req.session.userId;
        if (!userId) return res.redirect('/login');

        const user = await usersModel.getUserById(userId);
        if (!user) return res.status(404).send('User not found');

        const { username, age, description } = req.body;
        const errors = [];

        if (username && (username.length < 3 || username.length > 16)) {
            errors.push("Username must be between 3 and 16 characters");
        }

        if (age && age < 13) {
            errors.push("You must be at least 13 years old");
        }

        if (username && username !== user.username) {
            const taken = await usersModel.isUsernameTaken(username);
            if (taken) errors.push("Username is already taken");
        }

        if (errors.length > 0) {
            return res.render('pages/updateprofile', {
                req,
                errors,
                values: {
                    username: username ?? user.username,
                    age: age ?? user.age,
                    description: description ?? user.description
                }
            });
        }

        if (username && username !== user.username) {
            user.username = username;
        }

        if (age && age !== user.age) {
            user.age = age;
        }

        if (description && description !== user.description) {
            user.description = description;
        }

        if (req.file) {
            if (user.profileImage && user.profileImage !== 'default.svg') {
                const oldPath = path.join(
                    __dirname,
                    '../../public/uploads',
                    user.profileImage
                );

                fs.unlink(oldPath, err => {
                    if (err) console.warn('Avatar delete failed:', err.message);
                });
            }
            user.profileImage = req.file.filename;
        }

        await usersModel.updateUser(userId, user);
        req.session.userSlug = user.userSlug;
        req.session.profileImage = user.profileImage;

        res.redirect(`/profile/${user.userSlug}`);
    } catch (err) {
        next(err);
    }
}

/* =========================================================
   ACCOUNT DELETION
   ========================================================= */

async function deleteProfile(req, res, next) {
    try {
        await usersModel.deleteUser(req.session.userId);

        req.session.destroy(err => {
            if (err) {
                console.error(err);
                return res.status(500).json({ error: "Session destroy failed" });
            }

            res.clearCookie("connect.sid");
            res.redirect('/login');
            return res.sendStatus(200);
        });
    } catch (err) {
        next(err);
    }
}

module.exports = {
    viewProfile,
    updateProfileForm,
    updateProfile,
    deleteProfile
};
