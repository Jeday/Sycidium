var createError = require("http-errors");
var express = require("express");
var path = require("path");
var cookieParser = require("cookie-parser");
var logger = require("morgan");
var http = require("http");
var bodyParser = require("body-parser");

// creation and configuratrion of express instance
var app = express();
app.server = http.createServer(app); // defining server here for express-ws
var expressWS = require("express-ws")(app, app.server); // connecting express-ws uptop http server and express
//to ensure proper uprage and routing of websockets
// import router that handles ws and polling
var pollRouter = require("./routes/poll");

// view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "pug");

// common middleware
app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(bodyParser.json());
// static routing
app.use(express.static(path.join(__dirname, "public")));

// routes
app.use(pollRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render("error");
});

module.exports = app;
