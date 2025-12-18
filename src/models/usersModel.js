const { ObjectId } = require('mongodb');
const { getDB } = require('../data/connection');
const userService = require('../services/userService');
const fs = require("fs");
const path = require('path');
/* =========================================================
   SLUG UTILITIES
   ========================================================= */

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

/* =========================================================
   GET USERS (COLLECTION LEVEL)
   ========================================================= */

async function getAllUsers() {
    const db = getDB();
    return await db.collection('users')
        .find()
        .sort({ createdAt: -1 })
        .toArray();
}

async function getAllUsersExceptCurrent(currentUserId) {
    const db = getDB();
    if (!currentUserId) return getAllUsers();
    return await db.collection('users')
        .find({ _id: { $nin: [new ObjectId(currentUserId)] } })
        .sort({ createdAt: -1 })
        .toArray();
}

/* =========================================================
   SEARCHING & FILTERING
   ========================================================= */

async function searchUsers(queryParams, currentUserId) {
    const db = getDB();
    const usersCollection = db.collection('users');

    const filter = {};

    if (currentUserId) {
        filter._id = { $ne: new ObjectId(currentUserId) };
    }

    if (queryParams.username) {
        filter.username = { $regex: queryParams.username, $options: 'i' };
    }

    if (queryParams.minAge || queryParams.maxAge) {
        const conditions = [];

        if (queryParams.minAge) {
            conditions.push({ $gte: [{ $toInt: "$age" }, parseInt(queryParams.minAge, 10)] });
        }
        if (queryParams.maxAge) {
            conditions.push({ $lte: [{ $toInt: "$age" }, parseInt(queryParams.maxAge, 10)] });
        }

        filter.$expr = { $and: conditions };
    }

    let users = await usersCollection.find(filter).toArray();

    if (queryParams.partnersOnly && currentUserId) {
        const currentUser = await usersCollection.findOne({ _id: new ObjectId(currentUserId) });
        const partnerIds = (currentUser.partners || []).map(id => id.toString());
        users = users.filter(u => partnerIds.includes(u._id.toString()));
    }

    let sort = {};
    if (queryParams.sortBy) {
        const direction = queryParams.sortDir === 'desc' ? -1 : 1;
        if (queryParams.sortBy === 'age') sort.age = direction;
        if (queryParams.sortBy === 'createdAt') sort.createdAt = direction;
    } else {
        sort = { createdAt: -1 };
    }

    const sortField = Object.keys(sort)[0];
    const sortDir = sort[sortField] || 1;

    users.sort((a, b) => {
        if (!sortField) return 0;
        return (a[sortField] - b[sortField]) * sortDir;
    });

    return users;
}

/* =========================================================
   MATCHING / REQUEST POOLS
   ========================================================= */

async function getAllMatchableUsers(currentUserId) {
    const db = getDB();

    const currentUser = await db.collection('users').findOne({
        _id: new ObjectId(currentUserId)
    });

    if (!currentUser) return [];

    const exclude = [
        currentUser._id,
        ...(currentUser.partners || []),
        ...(currentUser.outgoingRequests || []),
        ...(currentUser.incomingRequests || []),
    ].map(id => new ObjectId(id));

    return await db.collection('users')
        .aggregate([
            { $match: { _id: { $nin: exclude } } },
            { $sample: { size: 100 } }
        ])
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

async function getIncomingRequests(userId) {
    const db = getDB();
    const user = await db.collection('users').findOne({
        _id: new ObjectId(userId)
    });
    if (!user || !user.incomingRequests) return [];

    return await db.collection('users')
        .find({ _id: { $in: user.incomingRequests } })
        .toArray();
}

/* =========================================================
   GET USER BY FIELD
   ========================================================= */

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

async function isUsernameTaken(username) {
    const db = getDB();
    const found = await db.collection('users')
        .findOne({ username });
    return !!found;
}

/* =========================================================
   CREATE & UPDATE USER
   ========================================================= */

async function createUser(username, password, description, age, profileImage = 'default.svg') {
    const db = getDB();
    const encryptedPassword = await userService.encrypt(password);
    const userSlug = await checkIfRepeated(username);

    await db.collection('users').insertOne({
        username,
        encryptedPassword,
        description,
        age,
        profileImage,
        createdAt: new Date(),
        userSlug,
        partners: [],
        outgoingRequests: [],
        incomingRequests: []
    });
}

async function updateUser(id, updates) {
    const db = getDB();

    delete updates._id;
    delete updates.createdAt;

    if (updates.username) {
        updates.userSlug = await slugify(updates.username);
    }

    if (updates.password) {
        const encryptedPassword = await userService.encrypt(updates.password);
        updates.password = encryptedPassword;
    }

    await db.collection('users').updateOne(
        { _id: new ObjectId(id) },
        { $set: updates }
    );
}

/* =========================================================
   MATCH MANAGEMENT
   ========================================================= */

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

/* =========================================================
   DELETE USER
   ========================================================= */

async function deleteUser(id) {
    const db = getDB();
    const users = db.collection('users');
    const A = new ObjectId(id);
    const user = await users.findOne({ _id: A });
    if (!user) return;

    await users.updateMany(
        {},
        {
            $pull: {
                partners: A,
                incomingRequests: A,
                outgoingRequests: A
            }
        }
    );

    if (user.profileImage && user.profileImage !== 'default.svg') {
        fs.unlink(
            path.join(__dirname, '../../public/uploads', user.profileImage),
            () => {}
        );
    }

    await users.deleteOne({ _id: A });
}

/* =========================================================
   EXPORT
   ========================================================= */

module.exports = {
    getUserById,
    searchUsers,
    deleteUser,
    createUser,
    updateUser,
    getAllUsers,
    addMatch,
    removeMatch,
    getAllMatchableUsers,
    getUserByUsername,
    getUserBySlug,
    getOutgoingRequests,
    getIncomingRequests,
    isUsernameTaken
};


