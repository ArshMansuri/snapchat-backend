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
