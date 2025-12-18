var crypto = require('crypto');

// not sure if keeping this separate still makes sense

async function encrypt(password){
    var hash = await crypto.createHash('md5').update(password).digest('hex');
    return hash;
}

module.exports = {encrypt};
