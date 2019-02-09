var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
var passport = require('passport');
var LocalStrategy = require('passport-local');
var methodOverride = require('method-override');
var Favor = require('./models/favor');
var User = require('./models/user');
var Message = require('./models/message');
var Review = require('./models/review');
var Conversation = require('./models/conversation');
var Notification = require('./models/notification');
var flash = require('connect-flash');
var keyPublishable = 'pk_test_K3VJ6ZLvLKdhLaJTglAd65Qk';
var keySecret = 'sk_test_97z59dQM80mu9pVrQKxwaWyD';
var stripe = require('stripe')(keySecret);
var mbxGeocoding = require('@mapbox/mapbox-sdk/services/geocoding');
var geocodingClient = mbxGeocoding({ accessToken: 'pk.eyJ1IjoiZHVnaXdhcmMiLCJhIjoiY2pydDdmdjFtMGZlNjRhdGNreWQ1aW5mZSJ9.IJrnij1QFJbk2r_618xlUg' });

var userRoutes = require('./routes/users');
var favorRoutes = require('./routes/favors');
var indexRoutes = require('./routes/index');
var messRoutes = require('./routes/messages');
var revRoutes = require('./routes/reviews');
var miscRoutes = require('./routes/misc');

var app = express();

mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/tusky", { useNewUrlParser: true });

app.use(bodyParser.urlencoded({ extended: true }));



// view engine setup
app.set('view engine', 'ejs');
// app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));

app.use(methodOverride("_method"));
// app.use(logger('dev'));
// app.use(express.json());
app.use(require('body-parser').urlencoded({ extended: false }));
app.use(flash());
app.use(cookieParser());

app.use(require('express-session')({
  secret: "1234",
  resave: false,
  saveUninitialized: false
}));

app.locals.moment = require('moment');


app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());


app.use(async function (req, res, next) {
  res.locals.currentUser = req.user;
  // if anyone is logged in via passport
  if (req.user) {
    try {
      // get array of unread notifications
      let user = await User.findById(req.user._id).populate('notifications', null, {
        isRead: false
      }).populate('message_notifications', null, {
        isRead: false
      }).populate('interest_notifications', null, {
        isRead: false
      }).exec();

      res.locals.notifications = user.notifications.reverse();
      res.locals.message_notifications = user.message_notifications.reverse();
      res.locals.interest_notifications = user.interest_notifications.reverse();
    } catch (err) {
      console.log(err.message);
    }
  }
  res.locals.error = req.flash("error");
  res.locals.success = req.flash("success");
  res.locals.note = req.flash("note");
  next();
});


app.use(indexRoutes);
app.use(userRoutes);
app.use(favorRoutes);
app.use(messRoutes);
app.use(revRoutes);
app.use(miscRoutes);

app.post('/charge', function (req, res) {
  var amount = 500;

  stripe.customers.create({
    email: req.body.stripeEmail,
    source: req.body.stripeToken
  })

    .then(customer =>
      stripe.charges.create({
        amount,
        description: "Sample Charge",
        currency: "usd",
        customer: customer.id
      }))
    .then(charge => res.render('charge'));
});


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
