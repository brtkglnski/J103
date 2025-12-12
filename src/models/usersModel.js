const { ObjectId } = require('mongodb');
const { getDB } = require('../data/connection');
const userService = require('../services/userService');

// -----------------------------------------
// Slug
// -----------------------------------------

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

// -----------------------------------------
// Get users
// -----------------------------------------

async function getAllUsers() {
    const db = getDB();
    return await db.collection('users')
        .find()
        .sort({ createdAt: -1 })
        .toArray();
}

// -----------------------------------------
// NEW: Get all available profiles for a user
// -----------------------------------------

async function getAllAvailableUsers(currentUserId) {
    const db = getDB();

    const currentUser = await db.collection('users').findOne({
        _id: new ObjectId(currentUserId)
    });

    if (!currentUser) return [];

    const exclude = [
        currentUser._id,
        ...(currentUser.partners || []),
        ...(currentUser.outgoingRequests || []),
        ...(currentUser.incomingRequests || [])
    ];

    return await db.collection('users')
        .find({ _id: { $nin: exclude } })
        .sort({ createdAt: -1 })
        .toArray();
}

async function getOutgoingRequests(userId) {
    const db = getDB();
    const user = await db.collection('users').findOne({
        _id: new ObjectId(userId)
    });
    if (!user || !user.outgoingRequests) return [];

    return await db.collection('users')
        .find({ _id: { $in: user.outgoingRequests } })
        .toArray();
}
// -----------------------------------------
// Get by various fields
// -----------------------------------------

async function getUserById(id) {
    const db = getDB();
    return await db.collection('users')
        .findOne({ _id: new ObjectId(id) });
}

async function getUserByUsername(username) {
    const db = getDB();
    return await db.collection('users')
        .findOne({ username });
}

async function getUserBySlug(slug) {
    const db = getDB();
    return await db.collection('users')
        .findOne({ userSlug: slug });
}

// -----------------------------------------
// Create user - UPDATED
// -----------------------------------------

async function createUser(username, password, description, age) {
    const db = getDB();
    const encryptedPassword = await userService.encrypt(password);
    const userSlug = await checkIfRepeated(username);

    await db.collection('users').insertOne({
        username,
        encryptedPassword,
        description,
        age,
        createdAt: new Date(),
        userSlug,

        partners: [],        
        outgoingRequests: [],  
        incomingRequests: []  
    });
}

// -----------------------------------------
// Update user (readonly fields unchanged)
// -----------------------------------------

async function updateUser(id, username, password, description, age) {
    const db = getDB();
    const encryptedPassword = await userService.encrypt(password);
    const userSlug = await checkIfRepeated(username);

    await db.collection('users').updateOne(
        { _id: new ObjectId(id) },
        { $set: { username, encryptedPassword, description, age, userSlug } }
    );
}

// -----------------------------------------
// managing matches
// -----------------------------------------

async function addMatch(userId, targetId) {
    const db = getDB();

    const A = new ObjectId(userId);
    const B = new ObjectId(targetId);
    const users = db.collection('users');

    const [userA, userB] = await Promise.all([
        users.findOne({ _id: A }),
        users.findOne({ _id: B })
    ]);

    if (!userA || !userB) throw new Error("User not found");

    const isMutual =
        userB.outgoingRequests &&
        userB.outgoingRequests.some(id => id.equals(A));

    if (isMutual) {
        // Add to partners as just IDs
        await Promise.all([
            users.updateOne(
                { _id: A },
                {
                    $addToSet: { partners: B },
                    $pull: { incomingRequests: B, outgoingRequests: B }
                }
            ),
            users.updateOne(
                { _id: B },
                {
                    $addToSet: { partners: A },
                    $pull: { incomingRequests: A, outgoingRequests: A }
                }
            )
        ]);
        return { success: true, mutual: true };
    }

    // Normal one-way request
    await Promise.all([
        users.updateOne({ _id: A }, { $addToSet: { outgoingRequests: B } }),
        users.updateOne({ _id: B }, { $addToSet: { incomingRequests: A } })
    ]);

    return { success: true, mutual: false };
}


async function removeMatch(userId, targetId) {
    const db = getDB();
    const A = new ObjectId(userId);
    const B = new ObjectId(targetId);
    const users = db.collection('users');

    // Remove from partners
    await Promise.all([
        users.updateOne(
            { _id: A },
            { $pull: { partners: B, outgoingRequests: B, incomingRequests: B } }
        ),
        users.updateOne(
            { _id: B },
            { $pull: { partners: A, outgoingRequests: A, incomingRequests: A } }
        )
    ]);
}




// -----------------------------------------
// Delete
// -----------------------------------------

async function deleteUser(id) {
    const db = getDB();
    await db.collection('users')
        .deleteOne({ _id: new ObjectId(id) });
}

module.exports = {
    getUserById,
    deleteUser,
    createUser,
    updateUser,
    getAllUsers,
    addMatch,
    removeMatch,
    getAllAvailableUsers,  
    getUserByUsername,
    getUserBySlug,
    getOutgoingRequests
};
