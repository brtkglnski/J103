// * populate database with default data by running:
// * node seedDatabase.js

const fs = require('fs');
const { connectDB, getDB } = require('./src/data/connection');
const userService = require('./src/services/userService');
const { ObjectId } = require('mongodb');

async function seed() {
    await connectDB();
    const db = getDB();
    let users = JSON.parse(fs.readFileSync('./database/seed.json', 'utf8'));

    users.forEach(u => u._id = new ObjectId());

    for (const user of users) {
        user.encryptedPassword = await userService.encrypt(user.password);
        delete user.password; // remove plain text password
        user.createdAt = new Date(user.createdAt);
    }

    await db.collection('users').deleteMany({});

    const userDocs = users.map(u => ({
        ...u,
        partners: [],
        outgoingRequests: [],
        incomingRequests: []
    }));

    await db.collection('users').insertMany(userDocs);

    const usernameToId = {};
    const allUsers = await db.collection('users').find().toArray();
    allUsers.forEach(u => usernameToId[u.username] = u._id);

    for (const user of users) {
        const update = {};

        if (user.partners && user.partners.length) {
            update.partners = user.partners.map(name => usernameToId[name]);
        }
        if (user.incomingRequests && user.incomingRequests.length) {
            update.incomingRequests = user.incomingRequests.map(name => usernameToId[name]);
        }
        if (user.outgoingRequests && user.outgoingRequests.length) {
            update.outgoingRequests = user.outgoingRequests.map(name => usernameToId[name]);
        }

        if (Object.keys(update).length) {
            await db.collection('users').updateOne(
                { _id: usernameToId[user.username] },
                { $set: update }
            );
        }
    }

    console.log('Database seeded with default users and relationships. For login details, check the README file.');
    process.exit();
}

seed().catch(err => {
    console.error(err);
    process.exit(1);
});
