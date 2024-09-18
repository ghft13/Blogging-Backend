const express = require("express");
const app = express();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const cookieparser = require("cookie-parser");
const path = require("path");

app.set("view engine", "ejs");
const session = require("express-session");
const flash = require("connect-flash");
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieparser());

const connectdb = require("./Db");
app.use("/static", express.static(path.join(__dirname, "public")));

const usermodel = require("./Models/UserModel");
const postmodel = require("./Models/PostModel");
// const IsLogin = require("./IsLogin");

require("dotenv").config();

// const MongoStore = require("connect-mongo");
const cors = require("cors");
app.use(
  cors({
    origin:
      process.env.NODE_ENV === "production"
        ? "https://blog-jay18.netlify.app/"
        : "http://localhost:3000",
    credentials: true,
  })
);

app.use(
  session({
    secret: process.env.SESSION,
    resave: false,
    saveUninitialized: true,
    cookie: {
      maxAge: 1000 * 60 * 60 * 24, // 1 day
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", // Secure cookies in production
      sameSite: "Lax", // Prevent CSRF attacks
    },
  })
);

app.use((err, req, res, next) => {
  console.error(err.stack); // Logs the error details
  res.status(500).send("Internal");
});

app.use(flash());

app.post("/api/signup", async function (req, res) {
  const { username, email, password } = req.body;

  // Check if the user already exists
  const existingUser = await usermodel.findOne({ email });

  if (existingUser) {
    return res
      .status(400)
      .json({ message: "user already exits", flash: "User already Exist" });
  }

  // Hash the password
  const hashedPassword = await bcrypt.hash(password, 10);

  const newUser = new usermodel({
    username,
    email,
    password: hashedPassword,
  });

  let token = jwt.sign(
    { username: newUser.username, userid: newUser._id },
    process.env.JWT,
    { expiresIn: "1d" }
  );

  await newUser.save();

  res.cookie("token", token, {
    maxAge: 1000 * 60 * 60 * 24,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "Lax",
  });

  res
    .status(201)
    .json({ message: "signup sucessfull", flash: "Signup successfull", token });
});

app.post("/api/login", async function (req, res) {
  const { email, password } = req.body;

  try {
    const user = await usermodel.findOne({ email });

    if (!user) {
      return res
        .status(404)
        .json({ message: "User not found", flash: "User not found" });
    }

    // Compare the provided password with the hashed password
    const isMatch = await bcrypt.compare(password, user.password); // Fix argument order

    if (!isMatch) {
      return res
        .status(401)
        .json({ message: "Incorrect password", flash: "User not found" });
    }

    // Generate a new token with userid for login
    let token = jwt.sign(
      { username: user.username, userid: user._id },
      process.env.JWT,
      { expiresIn: "1d" }
    );

    // Set token cookie
    res.cookie("token", token, {
      maxAge: 1000 * 60 * 60 * 24, // 1 day
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", // Secure in production
      sameSite: "Lax",
    });

    res
      .status(201)
      .json({ message: "Login successful", flash: "Login successfull", token });
  } catch (err) {
    res.status(500).json({ message: "Server error", flash: "Server error" });
  }
});
app.post("/api/blog", async (req, res) => {
  try {
    const { blog, title } = req.body;
    let token = req.cookies.token;

    if (!token) {
      return res.status(401).json({
        message: "Login first",
        flash: "Login first",
      });
    }

    let decoded = jwt.verify(token, process.env.JWT);

    const userid = decoded.userid;
    const newPost = new postmodel({
      blog,
      title,
      user: userid, // Link the post to the user
    });

    await newPost.save();

    let user = await usermodel.findById(userid);
    if (user) {
      user.posts.push(newPost._id); // Add post to user's posts
      await user.save();
    }

    res.status(201).json({
      message: "Post Created Successfully",
      flash: "Post created successfully",
    });
  } catch (error) {
    console.error("Error creating post:", error);
    res.status(500).json({ error: "Error creating post" });
  }
});

app.get("/api/posts", async (req, res) => {
  try {
    let token = req.cookies.token;
    console.log("Token received:", token); // Add this to check if the token is being passed

    if (!token) {
      return res
        .status(401)
        .json({ message: "Login First", flash: "Login first" });
    }

    let decoded = jwt.verify(token, process.env.JWT);
    console.log("Decoded token:", decoded); // Check if the token is decoded correctly

    const userid = decoded.userid;

    const posts = await postmodel.find({ user: userid });
    console.log("Posts retrieved:", posts); // Check if posts are retrieved correctly

    res.status(200).json({ posts });
  } catch (error) {
    console.error("Error:", error); // Log any errors
    res.status(500).json({ error: "Error retrieving posts" });
  }
});

app.get("/api/edit/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const post = await postmodel.findById(id);

    if (post) {
      res.status(200).json({ post });
    } else {
      res
        .status(404)
        .json({ message: "Post not Found", flash: "Post not found" });
    }
  } catch (err) {
    res.status(500).json({ message: "Error fetching post" });
  }
});

app.post("/api/update/:id", async function (req, res) {
  const { title, blog } = req.body;
  const { id } = req.params;

  try {
    let updatepost = await postmodel.findByIdAndUpdate(
      id,
      {
        title,
        blog,
      },
      { new: true }
    ); // returns the updated post

    const posts = await postmodel.find({});

    console.log(posts);
    if (updatepost) {
      res.status(201).json({
        posts,
        message: "Post updated successfully",
        flash: "Post updated successfully here again",
      });
    }
  } catch (err) {
    res.status(501).json({
      message: "Error while updating",
      flash: "Error while updating",
    });
  }
});

app.post("/api/delete", async (req, res) => {
  const { id } = req.body;
  try {
    const deletepost = await postmodel.findByIdAndDelete(id);

    if (deletepost) {
      const posts = await postmodel.find({});
      res.status(200).json({
        message: "Successfully deleted",
        flash: "Deleted Successfully",
        posts,
      });
    } else {
      res
        .status(404)
        .json({ message: "Post not found", flash: "Post not found" });
    }
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error while deleting", flash: "Error while deleting" });
  }
});

const port = process.env.PORT || 5000;

app.listen(port, () => {
  console.log("Server is running on", port);
});

connectdb();
