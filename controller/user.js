const User = require("../model/User");
const { sendSms } = require("../utils/sendSms");
const verifier = require("email-verify");
const cloudinary = require("cloudinary");

exports.userLogin = async (req, res) => {
  try {
    const { value, password } = req.body;
    if (!value || !password) {
      return res
        .status(400)
        .json({ success: false, message: "Enter All Fild" });
    }

    let user = null;

    if (isNaN(value)) {
      user = await User.findOne({
        $or: [{ userName: value }, { "email.email": value }],
      }).select("+password");
    } else {
      user = await User.findOne({
        $or: [{ "phone.phoneNumber": value }],
      }).select("+password");
    }

    if (!user) {
      return res
        .status(401)
        .json({
          success: false,
          message: "We could not find a matching account and/or password",
        });
    }

    if (
      user?.email?.email === undefined &&
      user?.phone?.phoneNumber === undefined &&
      user?.phone?.isVerify === undefined 
    ) {
      return res.status(401).json({
        success: false,
        message: "Invalid User"
      });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res
        .status(401)
        .json({
          success: false,
          message: "We could not find a matching account and/or password",
        });
    }

    const token = await user.CreateToken();
    return res.status(200).json({
      success: true,
      user,
      token,
    });
  } catch (error) {
    console.log("Catch Error:: ", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.userSignUp = async (req, res) => {
  try {
    const { firstName, lastName, dob } = req.body;

    if (!firstName || !dob) {
      return res.status(400).json({
        success: false,
        message: "Enter All Detail",
      });
    }

    // according to frontend code change formate of date
    console.log(dob);
    const tempDob = new Date(dob);
    console.log(tempDob);

    //if user don't verify in 30 min then delete account
    expiredUser = new Date(Date.now() + 30 * 60 * 1000);

    let tempUserName = "";
    let isUser = null;

    do {
      tempNameArr = firstName.split(" ");
      tempUserName =
        tempNameArr[0] +
        Math.floor(Math.random() * 1000 + 1) +
        tempNameArr[0][Math.floor(Math.random() * tempNameArr[0].length)] +
        tempNameArr[0][Math.floor(Math.random() * tempNameArr[0].length)];
      isUser = await User.findOne({ userName: tempUserName });
      console.log(tempUserName);
    } while (isUser);

    let newUser = await User.create({
      firstName,
      lastName: lastName !== undefined ? lastName : "",
      dob: tempDob,
      "phone.otpExpired": expiredUser,
      userName: tempUserName,
    });

    const token = await newUser.CreateToken();
    console.log(token);
    (newUser.token = token), await newUser.save();

    return res.status(201).json({
      success: true,
      user: newUser,
      token
    });

  } catch (error) {
    console.log("Catch Error:: ", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.loadUser = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid User",
      });
    }

    if (
      user?.email?.email === undefined &&
      user?.phone?.phoneNumber === undefined &&
      user?.phone?.isVerify === undefined
    ) {
      return res.status(401).json({
        success: false,
        user
      });
    }

    return res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    console.log("Catch Error:: ", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.sendPhoneOtp = async (req, res) => {
  try {
    const { phone } = req.body;

    if (!phone) {
      return res
        .status(401)
        .json({ success: false, message: "Enter Phone Number" });
    }

    const isUser = await User.findOne({
      "phone.phoneNumber": phone,
      "phone.isVerify": true,
    });

    if (isUser) {
      return res
        .status(401)
        .json({ success: false, message: "Phone Number Alredy Used" });
    }

    otp = Math.floor(Math.random() * 900000) + 1000;
    otpExpired = new Date(Date.now() + 5 * 60 * 1000);

    tempPhoneNumber = "9574478944";
    sendSms(
      tempPhoneNumber,
      `Veryfy Your Account On SNAPCHAT Your OTP Is ${otp}`
    );

    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(401).json({ success: false, message: "Invalid User" });
    }

    user.phone.phoneNumber = phone;
    user.phone.isVerify = false;
    user.phone.otp = otp;
    user.phone.otpExpired = otpExpired;
    await user.save();

    return res.status(200).json({
      success: true,
      message: "Otp Send Successfully",
    });
  } catch (error) {
    console.log("Catch Error:: ", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.userVerifyPhoneOtp = async (req, res) => {
  try {
    const { otp, phone } = req.body;
    if (!otp) {
      return res.status(400).json({ success: false, message: "Enter OPT" });
    }

    if (!phone) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid inputs" });
    }

    const user = await User.findOne({ "phone.phoneNumber": phone });
    if (
      !user ||
      user.phone.isVerify === true ||
      phone !== user.phone.phoneNumber
    ) {
      return res.status(400).json({ message: "Invalid inputs" });
    }

    if (user.phone.otp !== otp || user.phone.otpExpired < Date.now()) {
      return res
        .status(400)
        .json({ success: false, message: "OTP DOn't Match And expired" });
    }

    user.phone.otp = null;
    user.phone.otpExpired = null;
    user.phone.isVerify = true;
    user.isVerify = true;

    await user.save();

    return res
      .status(200)
      .json({ success: true, message: "Otp Verify Successfully" });
  } catch (error) {
    console.log("Catch Error:: ", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.storeEmail = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: "Enter Email" });
    }

    const isUser = await User.findOne({ "email.email": email });
    if (isUser || isUser?.email?.isVerify) {
      return res
        .status(400)
        .json({ success: false, message: "Email Already Used" });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(401).json({ success: false, message: "Invalid User" });
    }

    user.email.email = email;
    user.email.isVerify = false;
    user.phone.otpExpired = null;
    await user.save();

    return res.status(200).json({
      success: true,
      message: "Email Store Successfully",
    });
  } catch (error) {
    console.log("Catch Error:: ", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.storeUserPassword = async (req, res) => {
  try {
    const { password } = req.body;

    if (!password) {
      return res
        .status(400)
        .json({ success: false, message: "Enter Password" });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(401).json({ success: false, message: "Invalid User" });
    }

    user.password = password;
    await user.save();

    return res.status(200).json({
      success: true,
      message: "Password Save Successfully",
    });
  } catch (error) {
    console.log("Catch Error:: ", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.storeUserName = async (req, res) => {
  try {
    const { userName } = req.body;

    if (!userName) {
      return res
        .status(400)
        .json({ success: false, message: "Enter Username" });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(401).json({ success: false, message: "Invalid User" });
    }

    const isUser = await User.findOne({
      userName: userName,
      _id: { $ne: req?.user?._id },
    });
    if (isUser) {
      return res
        .status(401)
        .json({ success: false, message: "User Name Not Available" });
    }


    user.userName = userName;
    await user.save();

    return res.status(200).json({
      success: true,
      user,
      message: "User Name Save Successfully"
    });
  } catch (error) {
    console.log("Catch Error:: ", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.isUserNameAvailable = async (req, res) => {
  try {
    const { userName } = req.body;
    if (!userName) {
      return res
        .status(400)
        .json({ success: false, message: "Enter Password" });
    }

    const isUser = await User.findOne({
      userName: userName,
      _id: { $ne: req?.user?._id },
    });

    if (isUser) {
      return res
        .status(401)
        .json({ success: false, message: "User Name Not Available" });
    }

    return res.status(200).json({
      success: true,
      message: "user name available",
    });
  } catch (error) {
    console.log("Catch Error:: ", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.storeGenderAndAvatar = async (req, res) => {
  try {
    const { gender, img } = req.body;

    if (!gender) {
      return res.status(400).json({
        success: false,
        message: "Enter Gender",
      });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid User",
      });
    }

    if (img) {
      const myCloud = await cloudinary.v2.uploader.upload(img, {
        folder: "snapchat/userAvatar",
      });
      user.avatarImg = myCloud.secure_url;
    }
    user.gender = gender;
    await user.save();

    return res.status(200).json({
      success: true,
      message: "Detail Store Successfully",
    });
  } catch (error) {
    console.log("Catch Error:: ", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
