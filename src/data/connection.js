const {MongoClient} = require('mongodb');

const uri = 'mongodb://localhost:27017';
const client = new MongoClient(uri);

let db;

async function connectDB() {
    try{
        await client.connect();
        db = await client.db('coop');
        console.log("Connected to MongoDB");
    }catch(err){
        console.error('MongoDB Connection Error:', err);
    }
}

function getDB(){
    if(!db) throw new Error('Database is not connected.');
    return db;
}

module.exports = {connectDB,getDB};