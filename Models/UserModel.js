const mongoose = require("mongoose");

const Userschema = new mongoose.Schema({
  username: String,
  email: String,
  password: String,
  posts: [{ type: mongoose.Schema.Types.ObjectId, ref: "Post" }],
});

const user = mongoose.model("User", Userschema);

module.exports = user;
