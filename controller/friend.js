const { default: mongoose } = require("mongoose");
const Friend = require("../model/Friend");
const User = require("../model/User");

exports.getUserFriendSuggetions = async (req, res) => {
    try {
        const { contacts } = req.body;

        const phoneNums = contacts.map((num) => {
            return num.phone;
        });

        let alreadyFriends = await Friend.findOne({ user: req.user._id })
        console.log(alreadyFriends)
        const alreadyFriendIds = alreadyFriends?.friends?.map(f => f.fId) || [];

        let friendSuggestion = await await User.find({
            $and: [
                { "phone.phoneNumber": { $in: phoneNums } },
                { _id: { $ne: req.user._id } },
                { _id: { $nin: alreadyFriendIds } },
                { isVerify: true },
            ],
        }).select("_id userName firstName avatarImg phone.phoneNumber");
        console.log(friendSuggestion)

        for (let i = 0; i < friendSuggestion.length; i++) {
            const index = contacts.findIndex(
                (ele) =>
                    ele?.phone?.toString() == friendSuggestion[i]?.phone?.phoneNumber
            );
            if (index != -1) {
                friendSuggestion[i] = friendSuggestion[i].toObject();
                friendSuggestion[i].firstName = contacts[index]?.name;
                friendSuggestion[i].msg = "IN MY CONTACTS"
            }
        }

        // console.log(friendSuggestion)

        let tempFriendSuggetion = [];
        if (friendSuggestion.length < 10) {
            tempFriendSuggetion = await User.find({
                $and: [
                    { _id: { $ne: req.user._id } },
                    // { _id: { $nin: friendSuggestion._id } },
                    { _id: { $nin: alreadyFriendIds } },
                    { "phone.phoneNumber": { $nin: phoneNums } }
                    // { "phone.phoneNumber": null },
                ],
                // "isVerify": true
            })
                .select("_id userName firstName avatarImg phone.phoneNumber")
                .limit(20);
        }

        console.log(tempFriendSuggetion)

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

exports.addFriend = async (req, res) => {
    try {

        let { friendId } = req.body

        if (!friendId) {
            return res.status(400).json({
                success: false,
                message: "Frined Id Not Provided"
            })
        }

        friendId = new mongoose.Types.ObjectId(friendId)

        const isFriendExist = await User.findById(friendId);
        if (!isFriendExist) {
            return res.status(404).json({
                success: false,
                message: "Friend Not Found"
            })
        }

        const user = await Friend.findOne({ user: req.user._id }).select("friends")
        console.log(user);

        if (user == null) {
            Friend.create({
                user: req.user._id,
                friends: {
                    fId: friendId
                }
            })
            return res.status(200).json({
                success: true,
                friendId,
                message: "Friend Added Successfully"
            })
        }

        const index = user?.friends.findIndex(ele => ele?.fId.toString() === friendId.toString())
        if (index != -1) {
            return res.status(409).json({
                success: false,
                message: "User Is Already Your Friend"
            })
        }



        user?.friends?.push({
            fId: friendId
        })
        await user.save()

        return res.status(200).json({
            success: true,
            friendId,
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

