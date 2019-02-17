const mongoose = require('mongoose');

const roomSchema = mongoose.Schema({
  _id: mongoose.Schema.Types.ObjectId,
  subject: { type: String },
  petani: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  agronomis: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
});

module.exports = mongoose.model("Room", roomSchema);