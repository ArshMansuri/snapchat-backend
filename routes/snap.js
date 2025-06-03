const express = require('express');
const { isUserAuth } = require('../middleware/auth');
const { sendSnap, getAllSnap, getAllFriendWithSnap, getNextSnap } = require('../controller/snap');
const router = express.Router();

router.route('/user/send/snap').post(isUserAuth, sendSnap)
router.route('/user/get/all/snap').post(isUserAuth, getAllSnap)
router.route('/user/get/all/friend-and-snap').post(isUserAuth, getAllFriendWithSnap)
router.route('/user/get/next-snap').post(isUserAuth, getNextSnap)

module.exports = router