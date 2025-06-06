const jwt = require("jsonwebtoken");
const User = require("../model/User");

exports.isUserAuth = async (req, res, next) => {
  try {

    const { token } = req.body;

    if (!token) {
      return res.status(401).json({ message: "Login First" });
    }

    const decoded = jwt.verify(token, process.env.JWT);
    req.user = await User.findById(decoded._id);
    next();

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.isUserAuthForSendSnap = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Login First" });
    }

    const token = authHeader.split(" ")[1];

    const decoded = jwt.verify(token, process.env.JWT);
    req.user = await User.findById(decoded._id);

    if (!req.user) {
      return res.status(401).json({ message: "Invalid User" });
    }

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: error.message,
    });
  }
};

