var mongoose = require('mongoose');

var messageSchema = new mongoose.Schema({
  text: String,
  sender: String,
  receiver: String,
  sender_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },
  receiver_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },
},
  {
    timestamps: true
  });


module.exports = mongoose.model("Message", messageSchema);
