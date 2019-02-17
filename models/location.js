var mongoose = require('mongoose');

var locationSchema = new mongoose.Schema({
    name: String,
    coordinates: Array,
    followers: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }
    ]
});

module.exports = mongoose.model("Location", locationSchema);