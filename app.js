var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

// import routes and attach websockets
var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var pollRouter = require('./routes/poll');
var app = express();
var expressWs = require('express-ws')(app);


// set up routes with websockets
// better to use  separate module and attach webscokets to specific router object
app.ws('/', function(ws, req) {
  ws.on('message', function(msg) {
    console.log(msg);
  });
  ws.on('close', function(code,reason){
    cosole.log("Client left:"+code+" "+reason);
  });
  console.log('socket', req.testing);
});


// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');




// common middleware
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
// static routing
app.use(express.static(path.join(__dirname, 'public')));


// routes
app.use('/index', indexRouter);
app.use('/users', usersRouter);
app.use(pollRouter);


// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
