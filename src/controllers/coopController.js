const fs = require('fs');
const path = require('path');

const usersModel = require('../models/usersModel');
const userService = require('../services/userService');

/* =========================================================
   INDEX / STRONA GŁÓWNA
   ========================================================= */

async function index(req, res) {
    const users = await usersModel.getAllUsers();
    res.render('pages/index', { req, users });
}


/* =========================================================
   PROFIL UŻYTKOWNIKA
   ========================================================= */

async function viewProfile(req, res) {
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

    const partners = await Promise.all(
        (user.partners || []).map(id => usersModel.getUserById(id))
    );

    res.render('pages/profile', { req, user, partners });
}

/* =========================================================
   UPDATE PROFILE (EDIT + AVATAR UPLOAD)
   ========================================================= */

async function updateProfile(req, res) {
    try {
        const userId = req.session.userId;
        if (!userId) return res.redirect('/login');

        const user = await usersModel.getUserById(userId);
        if (!user) return res.status(404).send('User not found');

        const { username, age, description } = req.body;

        if (username) user.username = username;
        if (age) user.age = age;
        if (description) user.description = description;

        if (req.file) {
            if (user.profileImage && user.profileImage !== 'default.png') {
                const oldPath = path.join(
                    __dirname,
                    '../public/uploads',
                    user.profileImage
                );

                fs.unlink(oldPath, err => {
                    if (err) console.warn('Avatar delete failed:', err.message);
                });
            }

            user.profileImage = req.file.filename;
        }

        await usersModel.updateUser(userId, user);

        res.redirect(`/profile/${user.userSlug}`);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server error');
    }
}

/* =========================================================
   MATCHOWANIE PROFILI
   ========================================================= */

async function matchUser(req, res) {
    const currentUserId = req.session.userId;
    const users = await usersModel.getAllAvailableUsers(currentUserId);
    res.render('pages/match', { req, users });
}

async function match(req, res) {
    const matchedId = req.body.matchedUserId;
    const userId = req.session.userId;

    await usersModel.addMatch(userId, matchedId);

    res.redirect(req.get('Referer'));
}

async function unmatch(req, res) {
    const matchedId = req.body.matchedUserId;
    const userId = req.session.userId;
    await usersModel.removeMatch(userId, matchedId);
    res.redirect(req.get('Referer'));

}
/* =========================================================
   WYŚWIETLANIE ZAPROSZEŃ
   ========================================================= */

   //  przychodzące 

async function viewIncomingRequests(req, res) {
    const slug = req.params.slug;
    const user = await usersModel.getUserBySlug(slug);
    const incomingRequests = await Promise.all(
        (user.incomingRequests || []).map(async (userId) => {
            const u = await usersModel.getUserById(userId);
            return { ...u, direction: 'incoming' }; 
        })
    );
    res.render('pages/requests', { req, user, requests: incomingRequests });
}

async function manageIncomingRequest(req, res) {
    const userId = req.session.userId;
    const action = req.body.action; 
    const targetId = req.body.targetId;

    if (action === 'accept') {
        await usersModel.addMatch(userId, targetId);
    } else if (action === 'reject') {
        await usersModel.removeMatch(userId, targetId);
    }

    const incoming = await usersModel.getIncomingRequests(userId);
    res.render('pages/requests', { req, requests: incoming.map(u => ({ ...u, direction: 'incoming' })) });
}


    // wychodzące 


async function viewOutgoingRequests(req, res) {
    const slug = req.params.slug;
    const user = await usersModel.getUserBySlug(slug);
    const outgoingRequests = await Promise.all(
        (user.outgoingRequests || []).map(async (userId) => {
            const u = await usersModel.getUserById(userId);
            return { ...u, direction: 'outgoing' }; 
        })
    );
    res.render('pages/requests', { req, user, requests: outgoingRequests });
}

async function manageOutgoingRequest(req, res) {
    const userId = req.session.userId;
    const action = req.body.action; 
    const targetId = req.body.targetId;

    if (action === 'cancel') {
        await usersModel.removeMatch(userId, targetId);
    }

    const outgoing = await usersModel.getOutgoingRequests(userId);
    res.render('pages/requests', { req, requests: outgoing.map(u => ({ ...u, direction: 'outgoing' })) });
}


/* =========================================================
   REJESTRACJA
   ========================================================= */

   async function registrationForm(req, res) {
    if (req.session.userId) {
        return res.redirect('/');
    }
    res.render('pages/registration', { req });
}

async function register(req, res) {
    const { username, password, description, age } = req.body;

    const profileImage = req.file
        ? req.file.filename
        : 'default.png';

    const errors = [];
    const regexNumber = /[0-9]/;
    const regexUpper = /[A-Z]/;
    const regexChar = /[^a-zA-Z0-9]/;

    if (!username || username.trim().length < 3) errors.push("Nazwa użytkownika musi mieć co najmniej 3 znaki");
    if (!password || !regexNumber.test(password)) errors.push("Hasło musi zawierać cyfry");
    if (!password || !regexUpper.test(password)) errors.push("Hasło musi zawierać wielką literę");
    if (!password || !regexChar.test(password)) errors.push("Hasło musi zawierać znak specjalny");
    if (!age || age < 13) errors.push("Musisz mieć co najmniej 13 lat");

    if (errors.length > 0) {
        return res.render('pages/registration', {
            errors,
            username,
            description,
            age,
            req
        });
    }

    await usersModel.createUser(
        username,
        password,
        description,
        age,
        profileImage  
    );

    res.redirect('/');
}



/* =========================================================
   LOGOWANIE
   ========================================================= */

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


/* =========================================================
   WYLOGOWANIE
   ========================================================= */

async function logout(req, res) {
    req.session.destroy();
    res.redirect('/');
}


/* =========================================================
   EXPORT
   ========================================================= */

module.exports = {
    index,
    matchUser,
    viewProfile,
    updateProfile,
    viewIncomingRequests,
    manageIncomingRequest,
    viewOutgoingRequests,
    manageOutgoingRequest,
    registrationForm,
    register,
    loginForm,
    login,
    logout,
    match,
    unmatch
};
