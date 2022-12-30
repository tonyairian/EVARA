var createError = require("http-errors");
var express = require("express");
var path = require("path");
var cookieParser = require("cookie-parser");
var logger = require("morgan");
const session = require("express-session");
const ConnectMongoDBSession = require("connect-mongodb-session");
const userRouter = require("./routes/user");
const adminRouter = require("./routes/admin");
const fileUpload = require("express-fileupload");
var app = express();

const mongoDbSession = new ConnectMongoDBSession(session);
app.use(
  session({
    saveUninitialized: false,
    secret: "KEY",
    resave: false,
    store: new mongoDbSession({
      uri: "mongodb://localhost:27017/Ecommerce",
      collection: "session",
    }),
    cookie: {
      maxAge: 1000 * 60 * 60 * 24 * 10, // 10 days
    },
  })
);

// view engine setup

app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");
app.use(fileUpload());

// app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

app.use("/", userRouter);
app.use("/admin", adminRouter);


// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render("error");
});

app.listen(process.env.PORT);
