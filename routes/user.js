const express = require('express')
const { userLogin, userSignUp, sendPhoneOtp, userVerifyPhoneOtp, storeEmail, storeGenderAndAvatar, storeUserPassword, storeUserName, isUserNameAvailable, loadUser, getUserFriendSuggetions, addFriend, removeFriend } = require('../controller/user')
const { isUserAuth } = require('../middleware/auth')
const router = express.Router()

router.route('/user/login').post(userLogin)
router.route('/user/signup').post(userSignUp)
router.route('/user/load/me').post(isUserAuth, loadUser)
router.route('/user/send/otp/phone').post(isUserAuth, sendPhoneOtp)
router.route('/user/verify/otp/phone').post(isUserAuth, userVerifyPhoneOtp)
router.route('/user/store/email').post(isUserAuth, storeEmail)
router.route('/user/store/password').post(isUserAuth, storeUserPassword)
router.route('/user/store/username').post(isUserAuth, storeUserName)
router.route('/user/check/username/available').post(isUserAuth, isUserNameAvailable)
router.route('/user/store/genserandavatar').post(isUserAuth, storeGenderAndAvatar)



// router.route('/user/friend/suggestion').post(isUserAuth, getUserFriendSuggetions)
// router.route('/user/friend/add').post(isUserAuth, addFriend)
router.route('/user/friend/remove').post(isUserAuth, removeFriend)

module.exports = router
