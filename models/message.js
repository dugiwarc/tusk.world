var mongoose = require('mongoose');

var messageSchema = new mongoose.Schema({
  text: String,
  sender: String,
  receiver: String,

},
  {
    timestamps: true
  });


module.exports = mongoose.model("Message", messageSchema);
