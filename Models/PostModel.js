const mongoose = require("mongoose");

const PostModel = new mongoose.Schema({
  blog: String,
  title:String,
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User", // Reference the User model
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Post = mongoose.model("Post", PostModel);

module.exports = Post;
