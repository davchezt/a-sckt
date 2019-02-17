const mongoose = require('mongoose');

const chatSchema = mongoose.Schema({
  _id: mongoose.Schema.Types.ObjectId,
  room: { type: mongoose.Schema.Types.ObjectId, ref: 'Room' },
  from: { type: String },
  // from: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  text: { type: String },
  created: { type: Number }
});

module.exports = mongoose.model("Chat", chatSchema);