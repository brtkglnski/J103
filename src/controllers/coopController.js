const usersModel = require('../models/usersModel');
const userService = require('../services/userService');

async function index(req,res){
    const users = await usersModel.getAllUsers();
    res.render('pages/index', {req, users});
}

async function viewProfile(req,res){
    let slug = req.params.slug;
    if (!slug) {
        if (req.session.userId) {
            let user = await usersModel.getUserById(req.session.userId);
            slug = await user.userSlug;
            return res.redirect(`/profile/${slug}`);
        }
        else {
            return res.redirect('/login');
        }
    }
    let user = await usersModel.getUserBySlug(slug);
    res.render('pages/profile', {user});
}

async function matchUser(req,res){
    const users = await usersModel.getAllUsers();
    res.render('pages/match', {users});
}

async function registrationForm(req,res){
    res.render('pages/registration');
}

async function register(req,res){
    const { username, password, description, age} = req.body;
    const errors = [];
    const regexNumber = /[0-9]/;
    const regexUpper = /[A-Z]/;
    const regexChar = /[^a-zA-Z0-9]/;

    const passwordNumber = regexNumber.test(password);
    const passwordUppercase = regexUpper.test(password);
    const passwordCorrect = regexChar.test(password);

    if (!username || username.trim().length < 3) errors.push("Nazwa uzytkownika musi mieć conajmniej 3 znaki");
    if (!password || !passwordNumber) errors.push("Hasło musi zawierać cyfry");
    if (!password || !passwordUppercase) errors.push("Hasło musi zawierać wielką literę");
    if (!password || !passwordCorrect) errors.push("Hasło musi zawierać znak specjalny");
    if (!age || age<13) errors.push("Musisz mieć co najmniej 13 lat");

    if (errors.length > 0) {
        return res.render('pages/registration', {errors, username, description, age});
    }
    else {
        await usersModel.createUser(username, password, description, age);
    }

    res.redirect('/');
}

async function loginForm(req,res){
    res.render('pages/login', {errors: [], values: {}});
}
async function login(req,res){
    const { username, password } = req.body;
    const errors = [];
    if (!username || username.trim().length === 0) errors.push("Podaj nazwę użytkownika");
    if (!password || password.trim().length === 0) errors.push("Podaj hasło");
    if (errors.length > 0) {
        return  res.render('pages/login', {errors, values: {username, password}});
    }
    const user = await usersModel.getUserByUsername(username);
    if (!user) {
        errors.push("Niepoprawna nazwa użytkownika lub hasło");
        return res.render('pages/login', {errors, values: {username, password}});
    }
    const encryptedPassword = await userService.encrypt(password);
    if (user.encryptedPassword !== encryptedPassword) {
        errors.push("Niepoprawna nazwa użytkownika lub hasło");
        return res.render('pages/login', {errors, values: {username, password}});
    }
    req.session.userId = user._id;
    res.redirect('/');
}

async function logout(req,res){
    req.session.destroy();
    res.redirect('/');
}

module.exports = {
  index,
  matchUser,
  viewProfile,
  registrationForm,
  register,
  loginForm,
  login,
  logout
};