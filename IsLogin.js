const jwt = require("jsonwebtoken");

const IsLogin = (req, res, next) => {
  const token = req.cookies.token; // Get token from cookies

  if (!token) {
    return res.status(401).json({ message: "Login First", flash: "Login First" });
  }

  try {
    // Verify token and decode the user information
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // Attach user data to the request object
    next(); // Proceed to the next middleware or route handler
  } catch (err) {
    return res.status(401).json({ message: "Invalid Token", flash: "Login First" });
  }
};

module.exports = IsLogin;
  