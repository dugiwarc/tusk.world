var mongoose = require("mongoose");
var passportLocalMongoose = require("passport-local-mongoose");
var bcrypt = require("bcrypt-nodejs");

var userSchema = new mongoose.Schema({
  isAdmin: {
    type: Boolean,
    default: false
  },
  birthdate: {
    type: Date
  },
  verifiedID: {
    isUploaded: {
      type: Boolean,
      default: false
    },
    isPending: {
      type: Boolean,
      default: false
    },
    isVerified: {
      type: Boolean,
      default: false
    }
  },
  verifiedPicture: {
    isUploaded: {
      type: Boolean,
      default: false
    },
    isPending: {
      type: Boolean,
      default: false
    },
    isVerified: {
      type: Boolean,
      default: false
    }
  },
  verifiedStay: {
    isUploaded: {
      type: Boolean,
      default: false
    },
    isPending: {
      type: Boolean,
      default: false
    },
    isVerified: {
      type: Boolean,
      default: false
    }
  },
  verifiedPhone: {
    isUploaded: {
      type: Boolean,
      default: false
    },
    isPending: {
      type: Boolean,
      default: false
    },
    isVerified: {
      type: Boolean,
      default: false
    }
  },
  verifiedEmail: {
    isUploaded: {
      type: Boolean,
      default: false
    },
    isPending: {
      type: Boolean,
      default: false
    },
    isVerified: {
      type: Boolean,
      default: false
    }
  },

  email: String,
  coordinates: Array,
  image: {
    type: String,
    default: "/pics/default_pic.jpg"
  },
  facebook: String,
  instagram: String,
  twitter: String,
  contacts: Array,
  city: String,
  interested_city: String,
  imageId: String,
  requests: Array,
  notifications: [
    {
      category: String,
      type: mongoose.Schema.Types.ObjectId,
      ref: "Notification"
    }
  ],
  interest_notifications: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Notification"
    }
  ],
  follow_notifications: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Notification"
    }
  ],
  followers: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    }
  ],
  message_notifications: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Notification"
    }
  ],
  name: String,
  qualifications: String,
  status: {
    type: String,
    default: "Anthropos"
  },
  phone_number: String,
  gender: String,
  username: String,
  resetPasswordToken: String,
  resetPasswordExpires: Date,
  surname: String,
  password: String,
  reviews: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Review"
    }
  ],
  rating: {
    type: Number,
    default: 0
  },
  messages: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message"
    }
  ],
  sent_messages: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message"
    }
  ],
  received_messages: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message"
    }
  ],

  favors: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Favor"
    }
  ],

  posted_favors: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Favor"
    }
  ],

  interests: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Favor"
    }
  ],

  active_favors: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Favor"
    }
  ]
});

userSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model("User", userSchema);
