var crypto = require('crypto');

function slugify(text) {
    return text
        .toString()
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-');
}

async function encrypt(password){
    var hash = await crypto.createHash('md5').update(password).digest('hex');
    return hash;
}

module.exports = {encrypt};
