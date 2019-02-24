var express = require('express');
var multer = require('multer');
var passport = require('passport');
var Favor = require('../models/favor');
var Location = require('../models/location');
var User = require('../models/user');
var Notification = require('../models/notification');
var middleware = require("../middleware");

var router = express.Router();
var storage = multer.diskStorage({
  filename: function (req, file, callback) {
    callback(null, Date.now() + file.originalname);
  }
});

var imageFilter = function (req, file, cb) {
  // accept image files only
  if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/i)) {
    return cb(new Error('Only image files are allowed!'), false);
  }
  cb(null, true);
};

var upload = multer({
  storage: storage,
  fileFilter: imageFilter
});

var cloudinary = require('cloudinary');
cloudinary.config({
  cloud_name: 'dugiwarc',
  api_key: '266892371552875',
  api_secret: 'KPuc3ggLVjzoQSQMAhgLxEt4p8k'
});

// finds all favors and outputs them on the page
router.get("/favors", async function (req, res) {
  if (req.query.search_users) {
    const regex = new RegExp(escapeRegex(req.query.search), 'gi');
    var favors = await Favor.find({
      $or: [{
        "author.username": regex
      }]
    });
    res.render("favors/favors", {
      favors
    });
  } else if (req.query.search_favors) {
    const regex = new RegExp(escapeRegex(req.query.search), 'gi');
    var favors = await Favor.find({
      $or: [{
        task: regex
      }]
    });
    res.render("favors/favors", {
      favors
    });
  } else if (req.query.search_locations) {
    const regex = new RegExp(escapeRegex(req.query.search), 'gi');
    var favors = await Favor.find({
      $or: [{
        location: regex
      }]
    });
    res.render("favors/favors", {
      favors
    });
  } else {
    var favors = await Favor.find({});
    res.render("favors/favors", {
      favors
    });
  }
});

// finds the favor and outputs it's show page 
router.get("/favors/:id", middleware.isLoggedIn, function (req, res) {
  Favor.findById(req.params.id, function (err, foundFavor) {
    if (err) {
      console.log(err);
    } else {
      res.render("favors/show_favor", {
        favor: foundFavor
      });
    }
  });
});

// creates a favor and assigns it to the current logged in user
router.post("/users/:id/favors", middleware.isLoggedIn, upload.single('image'), function (req, res) {
  User.findById(req.params.id).populate('followers').exec(function (err, user) {
    if (err) {
      console.log(err);
      redirect("/users");
    } else {
      // cloudinary.uploader.upload(req.file.path, function(result){
      //   req.body.favor.image = result.secure_url;
      //   req.body.favor.author = {
      //     id: req.user._id,
      //     username: req.user.username                            
      //   }
      var newFavor = new Favor({
        task: req.body.task,
        price: req.body.price,
        // image: req.body.image,
        location: req.body.location,
        description: req.body.description
      });

      Favor.create(newFavor, async function (err, favor) {
        if (err) {
          console.log(err);
        } else {
          // define newNotification with an username and a favorID
          let newNotification = {
            username: req.user.username,
            favorId: favor.id
          }
          // notify user's followers by saving a notification to their array
          for (const follower of user.followers) {
            let notification = await Notification.create(newNotification);
            follower.notifications.push(notification);
            follower.save();
          }

          location = await Location.findOne({
            name: req.body.location
          });
          console.log("LOCATION" + location);

          location.followers.forEach(async function (follower) {
            console.log("=======");
            console.log("FOLLOWER" + follower);
            let follo = await User.findById(follower);
            console.log("FOLLO" + follo);
            let notification = await Notification.create(newNotification);
            follo.notifications.push(notification);
            follo.save();
          });
          favor.author.id = req.user._id;
          console.log(favor.author.id);
          favor.author.username = req.user.username;
          favor.author.task = req.body.task;
          req.user.posted_favors.push(favor);
          favor.save();
          user.favors.push(favor);
          user.posted_favors.push(favor);
          user.save();
          req.flash("success", "Favor succesfully posted!");
          // res.redirect("/users/" + user._id + "/favors");
          res.render("users/payment", {
            favor: favor
          })
        }
      });
      // });
    }
  });
});

// finds favor/outputs edit page
router.get("/favors/:id/edit", middleware.checkFavorOwnership, async function (req, res) {
  let favor = await Favor.findById(req.params.id);
  res.render("favors/edit", {
    favor
  });
});

// finds the favor and updates it's contents with the inputted data
router.put("/favors/:id", middleware.isLoggedIn, function (req, res) {
  Favor.findByIdAndUpdate(req.params.id, req.body.favor, function (err, updateFavor) {
    if (err) {
      res.redirect("/favors");
    } else {
      req.flash("success", "Favor succesfully edited!");
      res.redirect("/favors/" + req.params.id);
    }
  });
});

// finds the logged in user and outputs a private page where he can create a favor
router.get("/users/:id/favors/new", middleware.isLoggedIn, function (req, res) {
  User.findById(req.user._id, function (err, user) {
    if (err) {
      console.log(err);
    } else {
      res.render("favors/new_favor", {
        user: user
      });
    }
  });
});


// finds user and outputs it's posted favors
router.get("/users/:id/favors", middleware.isLoggedIn, function (req, res) {
  User.findById(req.params.id).populate("favors").exec(function (err, foundUser) {
    if (err) {
      console.log(err);
    } else {
      console.log(foundUser);
      res.render("users/user_posted_favors", {
        user: foundUser
      });
    }
  });
});

router.delete("/favors/:id", middleware.checkFavorOwnership, function (req, res) {
  Favor.findOneAndDelete(req.params.id, function (err) {
    if (err) {
      res.redirect("/favors");
    } else {
      req.flash("success", "Favor succesfully deleted!");
      res.redirect("/favors");
    }
  });
});

function escapeRegex(text) {
  return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
};

module.exports = router;
