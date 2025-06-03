const express = require("express")
const Friend = require("../model/Friend")
const { getUserFriendSuggetions, addFriend } = require("../controller/friend")
const { isUserAuth } = require("../middleware/auth")
const router = express.Router()

router.route('/user/friend/suggestion').post(isUserAuth, getUserFriendSuggetions)
router.route('/user/friend/add').post(isUserAuth, addFriend)

module.exports = router
