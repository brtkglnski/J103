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
        if (!user) {
            const err = new Error('User not found');
            err.status = 404;
            throw err;
        }

        let { username, age, description, password } = req.body;
        const errors = [];

        const regexNumber = /[0-9]/;
        const regexUpper = /[A-Z]/;
        const regexChar = /[^a-zA-Z0-9]/;
        const regexWhitespace = /^\S+$/;
        const regexHtml = /<[^>]*>/;
        const regexUsername = /^[a-zA-Z0-9._]+$/;
        const regexUsernameStartEnd = /^[a-zA-Z0-9].*[a-zA-Z0-9]$/;

        if (username) {
            username = username.trim();

            if (username.length < 3 || username.length > 16)
                errors.push("Username must be between 3 and 16 characters");

            if (!regexUsername.test(username))
                errors.push("Username can contain only letters, numbers, dots and underscores");

            if (!regexUsernameStartEnd.test(username))
                errors.push("Username must start and end with a letter or number");

            if (username !== user.username) {
                const taken = await usersModel.isUsernameTaken(username);
                if (taken) errors.push("Username is already taken");
            }
        }

        if (age !== undefined && age !== '') {
            age = Number(age);

            if (!Number.isInteger(age))
                errors.push("Age must be a number");
            else if (age < 13)
                errors.push("You must be at least 13 years old");
            else if (age > 120)
                errors.push("Input a valid age");
        }

        if (description !== undefined) {
            if (description.length > 500)
                errors.push("Description cannot exceed 500 characters");

            if (regexHtml.test(description))
                errors.push("Description cannot contain HTML");
        }

        if (password && password.trim() !== '') {
            if (password.length < 8)
                errors.push("Password must be at least 8 characters long");
            if (password.length > 64)
                errors.push("Password is too long");
            if (!regexNumber.test(password))
                errors.push("Password must contain a number");
            if (!regexUpper.test(password))
                errors.push("Password must contain an uppercase letter");
            if (!regexChar.test(password))
                errors.push("Password must contain a special character");
            if (!regexWhitespace.test(password))
                errors.push("Password cannot contain spaces");
        }

        if (req.file && !req.file.mimetype.startsWith('image/')) {
            errors.push("Uploaded file must be an image");
        }

        if (errors.length > 0) {
            return res.status(400).render('pages/updateprofile', {
                req,
                errors,
                values: {
                    username: username ?? user.username,
                    age: age ?? user.age,
                    description: description ?? user.description
                }
            });
        }

        const updates = {};
        if (username && username !== user.username) updates.username = username;
        if (age !== undefined && age !== user.age) updates.age = age;
        if (description !== undefined && description !== user.description) updates.description = description;
        if (password && password.trim() !== '') updates.password = password;

        if (req.file) {
            if (user.profileImage && user.profileImage !== 'default.svg') {
                const oldPath = path.join(__dirname, '../../public/uploads', user.profileImage);
                fs.unlink(oldPath, err => {
                    if (err) console.warn('Avatar delete failed:', err.message);
                });
            }
            updates.profileImage = req.file.filename;
        }

        await usersModel.updateUser(userId, updates);
        const updatedUser = await usersModel.getUserById(userId);

        req.session.profileImage = updates.profileImage ?? user.profileImage;
        req.session.userSlug = updatedUser.userSlug;
        res.redirect(`/profile/${req.session.userSlug}`);
    } catch (err) {
        err.status = err.status || 500;
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
            res.redirect('/login');
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
