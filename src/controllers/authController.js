const usersModel = require('../models/usersModel');
const userService = require('../services/userService');

/* =========================================================
   AUTHENTICATION
   ========================================================= */


async function registrationForm(req, res) {
    if (req.session.userId) {
        return res.redirect('/');
    }
    res.render('pages/registration', { req, errors: [], values: {} });
}

async function register(req, res) {
    try {
        const { username, password, description, age } = req.body;

        const profileImage = req.file
            ? req.file.filename
            : 'default.svg';

        const errors = [];
        const regexNumber = /[0-9]/;
        const regexUpper = /[A-Z]/;
        const regexChar = /[^a-zA-Z0-9]/;

        const taken = await usersModel.isUsernameTaken(username);
        if (taken) errors.push("Username is already taken");
        if (!username || username.trim().length < 3 || username.trim().length > 16) errors.push("Username has to be between 3 and 16 characters");
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

        await usersModel.createUser(
            username,
            password,
            description,
            age,
            profileImage
        );

        const user = await usersModel.getUserByUsername(username);
        if (user) {
            req.session.userId = user._id;
            req.session.userSlug = user.userSlug;
            req.session.profileImage = user.profileImage;
            return res.redirect(`/profile/${user.userSlug}`);
        }

        res.redirect('/');
    } catch (err) {
        console.error(err);
        res.status(500).send('Server error');
    }
    res.redirect('/');
}

async function loginForm(req, res) {
    if (req.session.userId) {
        return res.redirect('/');
    }
    res.render('pages/login', { req, errors: [], values: {} });
}

async function login(req, res) {
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
}

async function logout(req, res) {
    req.session.destroy();
    res.redirect('/');
}

module.exports = {
    registrationForm,
    register,
    loginForm,
    login,
    logout
};
