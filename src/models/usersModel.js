const {ObjectId} = require('mongodb');
const {getDB} = require('../data/connection');
const userService = require('../services/userService');

function slugify(text) {
    return text
        .toString()
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-');
}

async function checkIfRepeated(username) {
    const users = await getAllUsers();
    const slug = slugify(username);

    let uniqueSlug = slug;
    let suffix = 1;
    while (users.some(user => user.userSlug === uniqueSlug)) {
        uniqueSlug = `${slug}-${suffix++}`;
    }
    return uniqueSlug;
}

async function getAllUsers() {
    const db = getDB();
    return await db.collection('users')
    .find().sort({createdAt:-1}).toArray();
}

async function getUserById(id) {
    const db = getDB();
    return await db.collection('users')
    .findOne({_id:new ObjectId(id)});
}

async function getUserByUsername(username) {
    const db = getDB();
    return await db.collection('users')
    .findOne({username: username});
}
async function getUserBySlug(slug) {
    const db = getDB();
    return await db.collection('users')
    .findOne({userSlug: slug});
}

async function createUser(username, password, description, age) {
    const db = getDB();
    const encryptedPassword = await userService.encrypt(password);
    const userSlug = await checkIfRepeated(username);
    await db.collection('users')
    .insertOne({username, encryptedPassword, description, age,createdAt: new Date(), userSlug});
    
}


async function updateUser(id, username, password, description, age){
    const db = getDB();
    const encryptedPassword = await userService.encrypt(password);
    const userSlug = await checkIfRepeated(username);
    await db.collection('users')
    .updateOne(
        {_id: new ObjectId(id)},
        {$set: {username, encryptedPassword, description, age, userSlug}}
    );
}

async function deleteUser(id){
    const db = getDB();
    await db.collection('users')
    .deleteOne({_id: new ObjectId(id)});
}

module.exports = {getUserById, deleteUser, createUser, updateUser, getAllUsers, getUserByUsername, getUserBySlug};
