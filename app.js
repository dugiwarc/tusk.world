var createError = require("http-errors");
var express = require("express");
var path = require("path");
var url = require("url");
var cookieParser = require("cookie-parser");
var logger = require("morgan");
var bodyParser = require("body-parser");
var mongoose = require("mongoose");
var passport = require("passport");
var LocalStrategy = require("passport-local");
var methodOverride = require("method-override");
var Favor = require("./models/favor");
var Location = require("./models/location");
var User = require("./models/user");
var Message = require("./models/message");
var Review = require("./models/review");
var Conversation = require("./models/conversation");
var Request = require("./models/validation_request");
var Notification = require("./models/notification");
var flash = require("connect-flash");
var keyPublishable = "pk_test_K3VJ6ZLvLKdhLaJTglAd65Qk";
var keySecret = "sk_test_97z59dQM80mu9pVrQKxwaWyD";
var stripe = require("stripe")(keySecret);
var mbxGeocoding = require("@mapbox/mapbox-sdk/services/geocoding");
var geocodingClient = mbxGeocoding({
  accessToken:
    "pk.eyJ1IjoiZHVnaXdhcmMiLCJhIjoiY2pydDdmdjFtMGZlNjRhdGNreWQ1aW5mZSJ9.IJrnij1QFJbk2r_618xlUg"
});

var userRoutes = require("./routes/users");
var favorRoutes = require("./routes/favors");
var indexRoutes = require("./routes/index");
var messRoutes = require("./routes/messages");
var revRoutes = require("./routes/reviews");
var miscRoutes = require("./routes/misc");

var app = express();
app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "X-Requested-With");
  res.header("Access-Control-Allow-Headers", "Content-Type");
  res.header("Access-Control-Allow-Methods", "PUT, GET, POST, DELETE, OPTIONS");
  next();
});

var debug = require("debug")("tusk:server");
var http = require("http");

var server = http.createServer(app, function(req, res) {
  res.send("Geo");
  // Get the URL and parse it
});

var io = require("socket.io").listen(server).sockets;

mongoose.connect(
  process.env.MONGODB_URI ||
    "mongodb+srv://tuskworld:486711@cluster0-jngbm.mongodb.net/test?retryWrites=true",
  {
    useNewUrlParser: true
  },
  function(err, db) {
    if (err) {
      throw err;
      console.log("Error");
    }
    console.log("Mongoose conected...");

    io.on("connection", function(socket) {
      // Create function to send status
      sendStatus = function(s) {
        socket.emit("status", s);
      };

      // let chat = db.collection('chats');

      // Get chats from mongo collection
      // chat.find().limit(100).sort({
      //   _id: 1
      // }).toArray(function (err, res) {
      //   if (err) {
      //     throw err;
      //   }

      //   // emit the messages
      //   socket.emit('output', res);
      // });

      // Retrieve all users
      User.find({}, function(err, res) {
        if (err) {
          console.log(err);
        } else {
          socket.emit("users", res);
        }
      });

      // Retrieve all users and messages
      User.find({}, function(err, res) {
        if (err) {
          throw err;
        } else {
          Message.find({}, function(err, mes) {
            if (err) {
              throw err;
            } else {
              console.log("users retrieved");
              socket.emit("user_output", mes, res);
            }
          });
        }
      });

      // Retrieve queried user
      socket.on("input_user_search", async function(data) {
        let username = data.username;
        const regex = new RegExp(escapeRegex(username), "gi");
        var users = await User.find({
          username: regex
        });
        socket.emit("user_output_search", users);
      });

      // Handle input events
      socket.on("input", async function(data) {
        try {
          let sender = data.sender;
          let message = data.message;
          let receiver = data.receiver;
          let sender_id = data.sender_id;
          let receiver_id = data.receiver_id;

          // Check for a receiver
          if (receiver == "Filter for an user" || receiver == "") {
            // send error status
            sendStatus("Please make sure you have selected a receiver");
          } else {
            var newMessage = new Message({
              sender: sender,
              text: message,
              receiver: receiver,
              sender_id: sender_id,
              receiver_id: receiver_id
            });
            // Insert message
            var user = await User.findOne({
              _id: newMessage.sender_id
            });
            var user_contact = await User.findOne({
              _id: newMessage.receiver_id
            });
            if (!user.contacts.includes(user_contact.username)) {
              user.contacts.push(user_contact.username);
            }
            var contacts = user.contacts;
            var a = await Message.create(newMessage);
            user.save();
            a.save();
            // var all_messages = await Message.find({});
            io.emit("output", [data], contacts);

            sendStatus({
              message: "Message sent",
              clear: true
            });
          }
        } catch (err) {
          console.log(err);
        }
      });

      socket.on("get_notifs", async function(data) {
        var user = await User.findOne({ _id: data.loggedUser });
        var notifications = user.notifications;
        io.emit("receive_notifs", [notifications]);
      });

      // Handle clear
      socket.on("clear", function(data) {
        // Remove all chats from collection
        chat.remove({}, function() {
          // Emit cleared
          socket.emit("cleared");
        });
      });

      socket.on("get_contacts", async function(data) {
        let users = await User.findById(data.id);
        socket.emit("get_contacts", users.contacts);
      });
    });
  },
  { useMongoClient: true }
);
var db = mongoose.connection;
db.on("error", console.error.bind(console, "Error cola"));
app.use(
  bodyParser.urlencoded({
    extended: true
  })
);

// view engine setup
app.set("view engine", "ejs");
// app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, "public")));

app.use(methodOverride("_method"));
// app.use(logger('dev'));
// app.use(express.json());
app.use(
  require("body-parser").urlencoded({
    extended: false
  })
);
app.use(flash());
app.use(cookieParser());

app.use(
  require("express-session")({
    secret: "1234",
    resave: false,
    saveUninitialized: false
  })
);

app.locals.moment = require("moment");

app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use(function(req, res, next) {
  req.io = io;
  next();
});

app.use(async function(req, res, next) {
  res.locals.currentUser = req.user;
  // if anyone is logged in via passport
  if (req.user) {
    try {
      // get array of unread notifications
      let user = await User.findById(req.user._id)
        .populate("notifications", null, {
          isRead: false
        })
        .populate("message_notifications", null, {
          isRead: false
        })
        .populate("interest_notifications", null, {
          isRead: false
        })
        .populate("follow_notifications", null, {
          isRead: false
        })
        .exec();

      res.locals.notifications = user.notifications.reverse();
      res.locals.message_notifications = user.message_notifications.reverse();
      res.locals.interest_notifications = user.interest_notifications.reverse();
      res.locals.follow_notifications = user.follow_notifications.reverse();
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

app.post("/charge", function(req, res) {
  var amount = 500;

  stripe.customers
    .create({
      email: req.body.stripeEmail,
      source: req.body.stripeToken
    })

    .then(customer =>
      stripe.charges.create({
        amount,
        description: "Sample Charge",
        currency: "usd",
        customer: customer.id
      })
    )
    .then(charge => res.render("charge"));
});

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

server.listen(process.env.PORT || 3000, function() {
  console.log("Tusk server has started...");
});
server.on("error", onError);
server.on("listening", onListening);

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
  if (error.syscall !== "listen") {
    throw error;
  }

  var bind = typeof port === "string" ? "Pipe " + port : "Port " + port;

  // handle specific listen errors with friendly messages
  switch (error.code) {
    case "EACCES":
      console.error(bind + " requires elevated privileges");
      process.exit(1);
      break;
    case "EADDRINUSE":
      console.error(bind + " is already in use");
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
  var bind = typeof addr === "string" ? "pipe " + addr : "port " + addr.port;
  debug("Listening on " + bind);
}

function escapeRegex(text) {
  return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
}
