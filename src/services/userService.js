const bcrypt = require('bcrypt');

async function encrypt(password) {
    const saltRounds = 10;
    return await bcrypt.hash(password, saltRounds);
}

async function compare(plainPassword, hashedPassword) {
    return await bcrypt.compare(plainPassword, hashedPassword);
}

module.exports = { encrypt, compare };