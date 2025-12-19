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
    try {
        const users = await getAllUsers();
        const slug = slugify(username);

        let uniqueSlug = slug;
        let suffix = 1;
        while (users.some(user => user.userSlug === uniqueSlug)) {
            uniqueSlug = `${slug}-${suffix++}`;
        }
        return uniqueSlug;
    } catch (err) {
        console.error('checkIfRepeated error:', err);
        throw new Error('Failed to generate unique slug');
    }
}

/* =========================================================
   GET USERS (COLLECTION LEVEL)
   ========================================================= */

async function getAllUsers() {
    try {
        const db = getDB();
        return await db.collection('users')
            .find()
            .sort({ createdAt: -1 })
            .toArray();
    } catch (err) {
        console.error('getAllUsers error:', err);
        throw new Error('Failed to fetch users');
    }
}

async function getAllUsersExceptCurrent(currentUserId) {
    try {
        if (!currentUserId) return await getAllUsers();
        const db = getDB();
        return await db.collection('users')
            .find({ _id: { $nin: [new ObjectId(currentUserId)] } })
            .sort({ createdAt: -1 })
            .toArray();
    } catch (err) {
        console.error('getAllUsersExceptCurrent error:', err);
        throw new Error('Failed to fetch users');
    }
}

/* =========================================================
   SEARCHING & FILTERING
   ========================================================= */

async function searchUsers(queryParams, currentUserId) {
    try {
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
            if (queryParams.minAge) conditions.push({ $gte: [{ $toInt: "$age" }, parseInt(queryParams.minAge, 10)] });
            if (queryParams.maxAge) conditions.push({ $lte: [{ $toInt: "$age" }, parseInt(queryParams.maxAge, 10)] });
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
    } catch (err) {
        console.error('searchUsers error:', err);
        throw new Error('Failed to search users');
    }
}

/* =========================================================
   MATCHING / REQUEST POOLS
   ========================================================= */

async function getAllMatchableUsers(currentUserId) {
    try {
        const db = getDB();
        const currentUser = await db.collection('users').findOne({ _id: new ObjectId(currentUserId) });
        if (!currentUser) return [];

        const exclude = [
            currentUser._id,
            ...(currentUser.partners || []),
            ...(currentUser.outgoingRequests || []),
            ...(currentUser.incomingRequests || [])
        ].map(id => new ObjectId(id));

        return await db.collection('users')
            .aggregate([
                { $match: { _id: { $nin: exclude } } },
                { $sample: { size: 100 } }
            ])
            .toArray();
    } catch (err) {
        console.error('getAllMatchableUsers error:', err);
        throw new Error('Failed to fetch matchable users');
    }
}

async function getOutgoingRequests(userId) {
    try {
        const db = getDB();
        const user = await db.collection('users').findOne({ _id: new ObjectId(userId) });
        if (!user || !user.outgoingRequests) return [];
        return await db.collection('users').find({ _id: { $in: user.outgoingRequests } }).toArray();
    } catch (err) {
        console.error('getOutgoingRequests error:', err);
        throw new Error('Failed to fetch outgoing requests');
    }
}

async function getIncomingRequests(userId) {
    try {
        const db = getDB();
        const user = await db.collection('users').findOne({ _id: new ObjectId(userId) });
        if (!user || !user.incomingRequests) return [];
        return await db.collection('users').find({ _id: { $in: user.incomingRequests } }).toArray();
    } catch (err) {
        console.error('getIncomingRequests error:', err);
        throw new Error('Failed to fetch incoming requests');
    }
}

/* =========================================================
   GET USER BY FIELD
   ========================================================= */

async function getUserById(id) {
    try {
        if (!ObjectId.isValid(id)) return null;
        const db = getDB();
        return await db.collection('users').findOne({ _id: new ObjectId(id) });
    } catch (err) {
        console.error('getUserById error:', err);
        throw new Error('Failed to get user by ID');
    }
}

async function getUserByUsername(username) {
    try {
        const db = getDB();
        return await db.collection('users').findOne({ username });
    } catch (err) {
        console.error('getUserByUsername error:', err);
        throw new Error('Failed to get user by username');
    }
}

async function getUserBySlug(slug) {
    try {
        const db = getDB();
        return await db.collection('users').findOne({ userSlug: slug });
    } catch (err) {
        console.error('getUserBySlug error:', err);
        throw new Error('Failed to get user by slug');
    }
}

async function isUsernameTaken(username) {
    try {
        const db = getDB();
        const found = await db.collection('users').findOne({ username });
        return !!found;
    } catch (err) {
        console.error('isUsernameTaken error:', err);
        throw new Error('Failed to check username');
    }
}

/* =========================================================
   CREATE & UPDATE USER
   ========================================================= */

async function createUser(username, password, description, age, profileImage = 'default.svg') {
    try {
        if (!username || !password || !description || !age) throw new Error('Missing required fields');

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
    } catch (err) {
        console.error('createUser error:', err);
        throw new Error('Failed to create user');
    }
}

async function updateUser(id, updates) {
    try {
        if (!ObjectId.isValid(id)) throw new Error('Invalid user ID');

        const db = getDB();

        delete updates._id;
        delete updates.createdAt;

        if (updates.username) updates.userSlug = slugify(updates.username);

        if (updates.password) {
            updates.encryptedPassword = await userService.encrypt(updates.password);
            delete updates.password;
        }

        await db.collection('users').updateOne({ _id: new ObjectId(id) }, { $set: updates });
    } catch (err) {
        console.error('updateUser error:', err);
        throw new Error('Failed to update user');
    }
}

/* =========================================================
   MATCH MANAGEMENT
   ========================================================= */

async function addMatch(userId, targetId) {
    try {
        const db = getDB();
        if (!ObjectId.isValid(userId) || !ObjectId.isValid(targetId)) throw new Error('Invalid user ID');

        const users = db.collection('users');
        const [userA, userB] = await Promise.all([
            users.findOne({ _id: new ObjectId(userId) }),
            users.findOne({ _id: new ObjectId(targetId) })
        ]);

        if (!userA || !userB) throw new Error('User not found');

        const isMutual = userB.outgoingRequests?.some(id => id.equals(new ObjectId(userId)));

        if (isMutual) {
            await Promise.all([
                users.updateOne(
                    { _id: new ObjectId(userId) },
                    { $addToSet: { partners: new ObjectId(targetId) }, $pull: { incomingRequests: new ObjectId(targetId), outgoingRequests: new ObjectId(targetId) } }
                ),
                users.updateOne(
                    { _id: new ObjectId(targetId) },
                    { $addToSet: { partners: new ObjectId(userId) }, $pull: { incomingRequests: new ObjectId(userId), outgoingRequests: new ObjectId(userId) } }
                )
            ]);
            return { success: true, mutual: true };
        }

        await Promise.all([
            users.updateOne({ _id: new ObjectId(userId) }, { $addToSet: { outgoingRequests: new ObjectId(targetId) } }),
            users.updateOne({ _id: new ObjectId(targetId) }, { $addToSet: { incomingRequests: new ObjectId(userId) } })
        ]);

        return { success: true, mutual: false };
    } catch (err) {
        console.error('addMatch error:', err);
        throw new Error('Failed to add match');
    }
}

async function removeMatch(userId, targetId) {
    try {
        const db = getDB();
        const users = db.collection('users');

        if (!ObjectId.isValid(userId) || !ObjectId.isValid(targetId)) throw new Error('Invalid user ID');

        await Promise.all([
            users.updateOne({ _id: new ObjectId(userId) }, { $pull: { partners: new ObjectId(targetId), outgoingRequests: new ObjectId(targetId), incomingRequests: new ObjectId(targetId) } }),
            users.updateOne({ _id: new ObjectId(targetId) }, { $pull: { partners: new ObjectId(userId), outgoingRequests: new ObjectId(userId), incomingRequests: new ObjectId(userId) } })
        ]);
    } catch (err) {
        console.error('removeMatch error:', err);
        throw new Error('Failed to remove match');
    }
}

/* =========================================================
   DELETE USER
   ========================================================= */

async function deleteUser(id) {
    try {
        if (!ObjectId.isValid(id)) throw new Error('Invalid user ID');

        const db = getDB();
        const users = db.collection('users');
        const user = await users.findOne({ _id: new ObjectId(id) });
        if (!user) return;

        await users.updateMany({}, { $pull: { partners: new ObjectId(id), incomingRequests: new ObjectId(id), outgoingRequests: new ObjectId(id) } });

        if (user.profileImage && user.profileImage !== 'default.svg') {
            fs.unlink(path.join(__dirname, '../../public/uploads', user.profileImage), () => {});
        }

        await users.deleteOne({ _id: new ObjectId(id) });
    } catch (err) {
        console.error('deleteUser error:', err);
        throw new Error('Failed to delete user');
    }
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