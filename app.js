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
app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "X-Requested-With");
  res.header("Access-Control-Allow-Headers", "Content-Type");
  res.header("Access-Control-Allow-Methods", "PUT, GET, POST, DELETE, OPTIONS");
  next();
});

var debug = require('debug')('tusk:server');
var http = require('http');
/**
 * Get port from environment and store in Express.
 */

var server = http.createServer(app);

/**
 * Create HTTP server.
 */


var io = require('socket.io').listen(server).sockets;




mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/tusky", { useNewUrlParser: true }, function(err, db){
  if(err)
  {
    throw err;
  }
  console.log("Connected!");
  
  io.on('connection', function(socket){
    // socket.set("transports", ["xhr-polling"]);
    // socket.set("polling duration", 10);
    let chat = db.collection('chats');
    
    // Create function to send status 
    sendStatus = function(s){
      socket.emit('status', s);
    }
    
    // Get chats from mongo collection
    chat.find().limit(100).sort({ _id: 1 }).toArray(function (err, res){
      if(err){
        throw err;
      } else {
        console.log("Messages retrieved");
      }
      
      // emit the messages
      socket.emit('output', res);
    });
    
    // Handle input events
    socket.on('input', function(data){
      let sender = data.sender;
      let message = data.message;
      let receiver = data.receiver; 
      
      // check for name and message
      if(sender == '' || message == ''){
        // send error status 
        sendStatus('Please enter a name and message');
      } else {
        // Insert message
        chat.insert({sender: sender, message: message, receiver: receiver}, function(){
          io.emit('output', [data]);
          
          // Send status object 
          sendStatus({
            message: 'Message sent',
            clear: true
          });
        });
      }
    });
    // Handle clear
    socket.on('clear', function(data){
      // Remove all chats from collection
      chat.remove({}, function(){
        // Emit cleared
        socket.emit('cleared');
      });
    });
  });
});

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


app.use(function (req, res, next) {
  req.io = io;
  next();
});

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
// app.use(function(req, res, next) {
//   next(createError(404));
// });

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
}); 


/**
 * Module dependencies.
 */

// var debug = require('debug')('tusk:server');
// var http = require('http');
/**
 * Get port from environment and store in Express.
 */

// var port = normalizePort(process.env.PORT);
// app.set('port', port);

/**
 * Create HTTP server.
 */


/**
 * Listen on provided port, on all network interfaces.
 */

server.listen(process.env.PORT || 3000);
server.on('error', onError);
server.on('listening', onListening);

port = 3000;
/**
 * Normalize a port into a number, string, or false.
 */

function normalizePort(val) {
  var port = parseInt(val, 10);

  if (isNaN(port)) {
    // named pipe
    return val;
  }

  if (port >= 0) {
    // port number
    return port;
  }

  return false;
}

/**
 * Event listener for HTTP server "error" event.
 */

function onError(error) {
  if (error.syscall !== 'listen') {
    throw error;
  }

  var bind = typeof port === 'string'
    ? 'Pipe ' + port
    : 'Port ' + port;

  // handle specific listen errors with friendly messages
  switch (error.code) {
    case 'EACCES':
      console.error(bind + ' requires elevated privileges');
      process.exit(1);
      break;
    case 'EADDRINUSE':
      console.error(bind + ' is already in use');
      process.exit(1);
      break;
    default:
      throw error;
  }
}

/**
 * Event listener for HTTP server "listening" event.
 */

function onListening() {
  var addr = server.address();
  var bind = typeof addr === 'string'
    ? 'pipe ' + addr
    : 'port ' + addr.port;
  debug('Listening on ' + bind);
}
