var express = require('express');
var passport = require('passport');
var router = express.Router();
var User = require('../models/user');
var Message = require('../models/message');
var Review = require('../models/review');
var Favor = require('../models/favor');
var Notification = require('../models/notification');
var Conversation = require('../models/conversation');
var middleware = require('../middleware');

// POST A MESSAGE AND SAVE TO AUTHOR AND USER
// router.post("/users/:id/messages",async function (req, res) {
//     // lookup user using idea
//     let user = await User.findById(req.params.id);
//     let message = await Message.create(req.body.message);
//     let newNotification = {
//         username: req.user.username,
//         messageId: req.user.id
//     };
//     let notification = await Notification.create(newNotification);
//     user.message_notifications.push(notification);
//     message.sender.id = req.user._id;
//     message.receiver.id = user._id;
//     message.sender.username = req.user.username;
//     message.receiver.username = user.username;
//     message.messages = req.body.text;
//     req.user.sent_messages.push(message);
//     console.log(req.user);
//     user.received_messages.push(message);
//     message.save();
//     user.messages.push(message);
//     user.save();
//     res.redirect("back");
// });                     

// SHOW  User's Messages
router.get("/users/:id/messages", middleware.isLoggedIn, async function (req, res) {
    let message = await Message.find({});
    let user = await User.findById(req.params.id);
    let allusers = await User.find({});
    res.render("messages/show_messages", { user, message, allusers });
});

router.get("/users/:id/messages/new", middleware.isLoggedIn, async function (req, res) {
    var message = await Message.find({});
    var user = await User.findById(req.params.id);
    res.render("messages/new_message", { user, message });
});

router.get("/users/:id/conversation/:conversation_id",async function (req, res) {
    var message = await Message.find({});
    var user = await User.findById(req.params.id);
    res.render("messages/convo", { user, message});
});

function calculateAverage(reviews) {
    if (reviews.length === 0) {
        return 0;
    }
    var sum = 0;
    reviews.forEach(function (element) {
        sum += element.rating;
    });
    return sum / reviews.length;
}

module.exports = router;