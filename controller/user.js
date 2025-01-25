const User = require("../model/User");
const { sendSms } = require("../utils/sendSms");
const verifier = require("email-verify");
const cloudinary = require("cloudinary");
const { default: mongoose } = require("mongoose");

exports.userLogin = async (req, res) => {
  try {
    const { value, password } = req.body;
    if (!value || !password) {
      return res
        .status(400)
        .json({ success: false, message: "Enter All Fild" });
    }

    let user = null;
    let errorMsg = "";
    if (isNaN(value)) {
      user = await User.findOne({
        $or: [{ userName: value }, { "email.email": value }],
      }).select("+password");
      errorMsg = "We could not find a matching account for this email.";
    } else {
      user = await User.findOne({
        $or: [{ "phone.phoneNumber": value }],
      }).select("+password");
      errorMsg = "We could not find a matching account for this phone number.";
    }

    if (!user) {
      return res.status(401).json({
        success: false,
        message: errorMsg,
      });
    }

    if (user?.email?.email === undefined && user?.isVerify === false) {
      return res.status(401).json({
        success: false,
        message: "Invalid User",
      });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Incorrect password, please try again.",
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

exports.loadUser = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid User",
      });
    }

    if (user?.email?.email === undefined && user?.isVerify === false) {
      return res.status(401).json({
        success: false,
        user,
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
      return res.status(401).json({
        success: false,
        message:
          "This phone number has already been verified by another account. please enter another phone number",
      });
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
      phone != user.phone.phoneNumber
    ) {
      return res
        .status(400)
        .json({ message: "This number already use by another account" });
    }

    if (user.phone.otp !== otp || user.phone.otpExpired < Date.now()) {
      return res
        .status(400)
        .json({ success: false, message: "That's not the right otp" });
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
      return res.status(400).json({
        success: false,
        message:
          "This email has already been verified by another account. please enter another email",
      });
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
      message: "User Name Save Successfully",
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

exports.getUserFriendSuggetions = async (req, res) => {
  try {
    const { contacts } = req.body;

    const phoneNums = contacts.map((num) => {
      return num.phone;
    });

    let alreadyFriends = await User.findById(req.user._id).select("friends");

    let friendSuggestion = await await User.find({
      $and: [
        { "phone.phoneNumber": { $in: phoneNums } },
        { _id: { $ne: req.user._id } },
        { _id: { $nin: alreadyFriends.friends } },
        { isVerify: true },
      ],
    }).select("_id userName firstName avatarImg phone.phoneNumber");

    for (let i = 0; i < friendSuggestion.length; i++) {
      const index = contacts.findIndex(
        (ele) =>
          ele?.phone?.toString() == friendSuggestion[i]?.phone?.phoneNumber
      );

      friendSuggestion[i].firstName = contacts[index]?.name;
    }

    let tempFriendSuggetion = [];
    if (friendSuggestion.length < 10) {
      tempFriendSuggetion = await User.find({
        $and: [
          { _id: { $ne: req.user._id } },
          { _id: { $nin: alreadyFriends.friends } },
          { "phone.phoneNumber": { $nin: phoneNums } },
        ],
        // "isVerify": true
      })
        .select("_id userName firstName avatarImg phone.phoneNumber")
        .limit(20);
    }

    friendSuggestion = [...friendSuggestion, ...tempFriendSuggetion];

    return res.status(200).json({
      success: true,
      friendSuggestion,
    });
  } catch (error) {
    console.log("Catch Error:: ", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.addFriend = async(req, res) =>{
  try {

    let {friendId} = req.body
    
    if(!friendId){
      return res.status(400).json({
        success: false,
        message: "Frined Id Not Provided"
      })
    }

    friendId = new mongoose.Types.ObjectId(friendId)

    const isFriendExist = await User.findById(friendId);
    if(!isFriendExist){
      return res.status(404).json({
        success: false,
        message: "Friend Not Found"
      })
    }

    const user = await User.findById(req.user._id).select("friends")

    const index = user?.friends.findIndex(ele => ele.toString() === friendId.toString())
    if(index != -1){
      return res.status(409).json({
        success: false,
        message: "User Is Already Your Friend"
      })
    }



    user?.friends?.push(friendId)
    await user.save()

    return res.status(200).json({
      success: true,
      message: "Friend Added Successfully"
    })

  } catch (error) {
    console.log("Catch Error:: ", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}


exports.removeFriend = async(req, res) =>{
  try {

    let {friendId} = req.body
    
    if(!friendId){
      return res.status(400).json({
        success: false,
        message: "Frined Id Not Provided"
      })
    }

    friendId = new mongoose.Types.ObjectId(friendId)

    const isFriendExist = await User.findById(friendId);
    if(!isFriendExist){
      return res.status(404).json({
        success: false,
        message: "Friend Not Found"
      })
    }

    const user = await User.findById(req.user._id).select("friends")

    const index = user?.friends.findIndex(ele => ele.toString() === friendId.toString())
    if(index == -1){
      return res.status(409).json({
        success: false,
        message: "User Is Not Your Friend"
      })
    }




    user?.friends?.splice(index,1)
    await user.save()

    return res.status(200).json({
      success: true,
      message: "Friend Removed Successfully"
    })

  } catch (error) {
    console.log("Catch Error:: ", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}