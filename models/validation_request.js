var mongoose = require('mongoose');

var validationSchema = new mongoose.Schema({
    isApproved: {
        type: Boolean,
        default: false
    },
    author: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
    },

    image: {
        type: String
    }
}, {
    timestamps: true
});

module.exports = mongoose.model("Request", validationSchema);
