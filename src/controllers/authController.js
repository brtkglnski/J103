const usersModel = require('../models/usersModel');
const userService = require('../services/userService');

/* =========================================================
   AUTHENTICATION
   ========================================================= */


async function registrationForm(req, res, next) {
    try {
        if (req.session.userId) return res.redirect('/');
        res.render('pages/registration', { req, errors: [], values: {} });
    } catch (err) {
        next(err);
    }
}

async function register(req, res, next) {
    try {
        const { username, password, description, age } = req.body;

        const profileImage = req.file ? req.file.filename : 'default.svg';
        const errors = [];
        const regexNumber = /[0-9]/;
        const regexUpper = /[A-Z]/;
        const regexChar = /[^a-zA-Z0-9]/;

        const taken = await usersModel.isUsernameTaken(username);
        if (taken) errors.push("Username is already taken");
        if (!username || username.trim().length < 3 || username.trim().length > 16) 
            errors.push("Username has to be between 3 and 16 characters");
        if (!password || !regexNumber.test(password)) errors.push("Password must contain a number");
        if (!password || !regexUpper.test(password)) errors.push("Password must contain an uppercase letter");
        if (!password || !regexChar.test(password)) errors.push("Password must contain a special character");
        if (!age || age < 13) errors.push("You must be at least 13 years old to register");
        if (age > 120) errors.push("Input a valid age");

        if (errors.length > 0) {
            return res.render('pages/registration', {
                req,
                errors,
                values: { username, password, age, description }
            });
        }

        await usersModel.createUser(username, password, description, age, profileImage);
        const user = await usersModel.getUserByUsername(username);

        if (!user) {
            const err = new Error('User creation failed');
            err.status = 500;
            throw err;
        }

        req.session.userId = user._id;
        req.session.userSlug = user.userSlug;
        req.session.profileImage = user.profileImage;
        res.redirect(`/profile/${user.userSlug}`);
    } catch (err) {
        next(err);
    }
}

async function loginForm(req, res, next) {
    try {
        if (req.session.userId) return res.redirect('/');
        res.render('pages/login', { req, errors: [], values: {} });
    } catch (err) {
        next(err);
    }
}

async function login(req, res, next) {
    try {
        const { username, password } = req.body;
        const errors = [];

        if (!username || username.trim().length === 0) errors.push("Podaj nazwę użytkownika");
        if (!password || password.trim().length === 0) errors.push("Podaj hasło");

        if (errors.length > 0) {
            return res.render('pages/login', { req, errors, values: { username, password } });
        }

        const user = await usersModel.getUserByUsername(username);
        if (!user) {
            errors.push("Niepoprawna nazwa użytkownika lub hasło");
            return res.render('pages/login', { req, errors, values: { username, password } });
        }

        const encryptedPassword = await userService.encrypt(password);
        if (user.encryptedPassword !== encryptedPassword) {
            errors.push("Niepoprawna nazwa użytkownika lub hasło");
            return res.render('pages/login', { req, errors, values: { username, password } });
        }

        req.session.userId = user._id;
        req.session.userSlug = user.userSlug;
        req.session.profileImage = user.profileImage;
        res.redirect('/');
    } catch (err) {
        next(err);
    }
}


async function logout(req, res, next) {
    try {
        req.session.destroy(err => {
            if (err) {
                const error = new Error('Logout failed');
                error.status = 500;
                return next(error);
            }
            res.clearCookie('connect.sid');
            res.redirect('/');
        });
    } catch (err) {
        next(err);
    }
}

module.exports = {
    registrationForm,
    register,
    loginForm,
    login,
    logout
};
