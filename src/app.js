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

const errorHandler = require('./middleware/errorHandler');

const publicPath = path.join(__dirname, '..', 'public');
app.use(express.static(publicPath));

app.use('/uploads', express.static('public/uploads'));

app.use(errorHandler);

app.set('view engine','ejs');
app.set('views',path.join(__dirname, 'views'));
app.use(express.json());
app.use(express.urlencoded({extended:true}));

app.use('/',coopRouter);

app.use((req, res, next) => {
  const err = new Error('Page not found');
  err.status = 404;
  next(err);
});

app.use((err, req, res, next) => {
  const status = err.status || 500;

  res.status(status).render('pages/error', {
    req,
    status,
    message: err.message || 'Something went wrong'
  });
});

module.exports = app;