const express = require('express');
const path = require('path');
const coopRouter = require('./routes/coopRouter');

const app = express();

const session = require('express-session');

app.use(session({
  secret: '000000000',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false } 
}));

const publicPath = path.join(__dirname, '..', 'public');
app.use(express.static(publicPath));

app.use('/uploads', express.static('public/uploads'));


app.set('view engine','ejs');
app.set('views',path.join(__dirname, 'views'));
app.use(express.json());
app.use(express.urlencoded({extended:true}));

app.use('/',coopRouter);

module.exports = app;