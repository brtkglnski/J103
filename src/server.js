const app = require('./app.js');
const  { connectDB } = require('./data/connection.js');

const PORT = 2025;

connectDB().then(() =>{
    app.listen(PORT, () => console.log(`http://localhost:${PORT}`));
})