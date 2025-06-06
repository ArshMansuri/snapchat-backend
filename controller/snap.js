const { CallPage } = require("twilio/lib/rest/api/v2010/account/call");
const Snap = require("../model/Snap");
const User = require("../model/User");
// const cloudinary = require("cloudinary");
const Friend = require("../model/Friend");
const multer = require('multer');
const { Readable } = require('stream');
// const storage = multer.memoryStorage();
// const upload = multer({ storage });
const cloudinary = require('cloudinary').v2;


exports.sendSnap = async (req, res) => {
    try {
        const { recv, mtype } = req.body;
        const file = req.file;

        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(401).json({
                success: false,
                message: "Invalid User",
            });
        }

        if (!file || !mtype || !recv || recv.length <= 0) {
            return res.status(400).json({
                success: false,
                message: "Enter all details and provide an image file",
            });
        }


        const uploadFromBuffer = (buffer) => {
            return new Promise((resolve, reject) => {
                const stream = cloudinary.uploader.upload_stream(
                    { folder: "snapchat/snaps" },
                    (error, result) => {
                        if (result) resolve(result);
                        else reject(error);
                    }
                );
                stream.end(buffer);
            });
        };

        const imgUri = await uploadFromBuffer(file.buffer);

        const newSnapRecord = await Snap.create({
            sender: user.id,
            receivers: recv,
            mediaType: mtype,
            mediaUrl: imgUri.secure_url
        });

        // console.log(newSnapRecord);

        return res.status(201).json({
            success: true,
            message: "Snap sent successfully"
        });

    } catch (error) {
        console.log("Catch Error:: ", error);
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// exports.sendSnap = async (req, res) => {
//     try {
//         const { snap, recv, mtype, } = req.body;

//         const user = await User.findById(req.user._id);
//         if (!user) {
//             return res.status(401).json({
//                 success: false,
//                 message: "Invalid User",
//             });
//         }

//         if (!snap || !mtype || !recv || recv.length <= 0) {
//             return res.status(401).json({
//                 success: false,
//                 message: "Enter All Details",
//             });
//         }

//         const imgUri = await cloudinary.v2.uploader.upload(snap, {
//             folder: "snapchat/snaps",
//         });

//         const newSnapRecord = await Snap.create({
//             sender: user.id,
//             receivers: recv,
//             mediaType: mtype,
//             mediaUrl: imgUri.secure_url
//         })

//         console.log(newSnapRecord);

//         return res.status(201).json({
//             success: true,
//             message: "Snap Send Successfully"
//         })

//     } catch (error) {
//         console.log("Catch Error:: ", error);
//         return res.status(500).json({
//             success: false,
//             message: error.message,
//         });
//     }
// }

exports.getAllSnap = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(401).json({
                success: false,
                message: "Invalid User",
            });
        }

        // const snaps = await Snap.find({
        //     receivers: user._id,
        //     'viewedBy.user': { $ne: user._id },
        // });

        const snaps = await Snap.find({
            receivers: user._id,
        })
            .sort({ createdAt: -1 })
            .populate('sender', 'username avatarImg') // Optional: to show sender info
            .exec();

        console.log(snaps)

        return res.status(200).json({
            success: true,
            snaps
        })

    } catch (error) {
        console.log("Catch Error:: ", error);
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
}

exports.getAllFriendWithSnap = async (req, res) => {
    try {
        const userId = req.user.id;

        const allFriends = await Friend.findOne({ user: userId }).lean()
        const allFriendList = allFriends?.friends || []
        const result = []

        for (const fr of allFriendList) {
            const fId = fr.fId;

            const lastSnap = await Snap.findOne({
                sender: fId,
                receivers: userId,
                'viewedBy.user': { $ne: userId }
            }).sort({ createdAt: -1 })
                .select("_id mediaUrl mediaType viewedBy createdAt")
                .lean()

            const friendInfo = await User.findById(fId).select("_id userName firstName avatarImg").lean()

            if (!friendInfo) continue

            result.push({
                friend: friendInfo,
                lastSnap: lastSnap || null,
                addedAt: fr.addedAt
            })
        }

        result.sort((a, b) => {
            const aHasSnap = !!a.lastSnap;
            const bHasSnap = !!b.lastSnap;

            if (aHasSnap && bHasSnap) {
                // Both have snaps → sort by latest snap
                return new Date(b.lastSnap.createdAt) - new Date(a.lastSnap.createdAt);
            }

            if (aHasSnap && !bHasSnap) {
                // A has snap, B doesn't
                if (new Date(a.lastSnap.createdAt) > new Date(b.addedAt)) {
                    return -1;
                } else {
                    return 1;
                }
            }

            if (!aHasSnap && bHasSnap) {
                // B has snap, A doesn't
                if (new Date(b.lastSnap.createdAt) > new Date(a.addedAt)) {
                    return 1;
                } else {
                    return -1;
                }
            }

            // Neither has snap → sort by addedAt DESC (newest first)
            return new Date(b.addedAt) - new Date(a.addedAt);
        });



        console.log(result)

        return res.status(200).json({
            success: true,
            friends: result
        })

    } catch (error) {
        console.log("Catch Error:: ", error);
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }

}

// exports.getAllFriendWithSnap = async (req, res) => {
//   try {
//     const userId = req.user.id;

//     const allFriends = await Friend.findOne({ user: userId }).lean();
//     const allFriendList = allFriends?.friends || [];

//     const result = [];

//     for (const fr of allFriendList) {
//       const fId = fr.fId;

//       // Get the latest snap from friend to user
//       const latestSnap = await Snap.findOne({
//         sender: fId,
//         receivers: userId,
//       })
//         .sort({ createdAt: -1 })
//         .select('_id mediaUrl mediaType viewedBy createdAt')
//         .lean();

//       // Check if the user has viewed this snap
//       const isViewed = latestSnap?.viewedBy?.some(
//         (v) => v.user.toString() === userId
//       );

//       const friendInfo = await User.findById(fId)
//         .select('_id userName firstName avatarImg')
//         .lean();

//       if (!friendInfo) continue;

//       result.push({
//         friend: friendInfo,
//         lastSnap: isViewed ? null : latestSnap,
//         snapTime: latestSnap?.createdAt || null,
//         addedAt: fr.addedAt,
//       });
//     }

//     // Final sorting logic
//     result.sort((a, b) => {
//       const aSnapTime = a.snapTime;
//       const bSnapTime = b.snapTime;

//       if (aSnapTime && bSnapTime) {
//         return new Date(bSnapTime) - new Date(aSnapTime); // newer snap first
//       }

//       if (aSnapTime && !bSnapTime) {
//         return -1; // a has snap, b doesn't → a first
//       }

//       if (!aSnapTime && bSnapTime) {
//         return 1; // b has snap, a doesn't → b first
//       }

//       // Both don't have snaps → sort by addedAt DESC
//       return new Date(b.addedAt) - new Date(a.addedAt);
//     });

//     const finalResult = result.map(({ snapTime, ...rest }) => rest);

//     return res.status(200).json({
//       success: true,
//       friends: finalResult,
//     });
//   } catch (error) {
//     console.log('Catch Error:: ', error);
//     return res.status(500).json({
//       success: false,
//       message: error.message,
//     });
//   }
// };


// exports.getAllFriendWithSnap = async (req, res) => {
//     try {
//         const userId = req.user.id;

//         const allFriends = await Friend.findOne({ user: userId }).lean()
//         const allFriendList = allFriends?.friends || []
//         const result = []

//         for (const fr of allFriendList) {
//             const fId = fr.fId;

//             const lastSnap = await Snap.findOne({
//                 sender: fId,
//                 receivers: userId,
//                 // 'viewedBy.user': { $ne: userId }
//             }).sort({ createdAt: -1 })
//                 .select("_id mediaUrl mediaType viewedBy createdAt")
//                 .lean()

//             const friendInfo = await User.findById(fId).select("_id userName firstName avatarImg").lean()

//             if (!friendInfo) continue

//             result.push({
//                 friend: friendInfo,
//                 lastSnap: lastSnap || null,
//                 addedAt: fr.addedAt
//             })
//         }

//         result.sort((a, b) => {
//             const aHasSnap = !!a.lastSnap;
//             const bHasSnap = !!b.lastSnap;

//             if (aHasSnap && bHasSnap) {
//                 // Both have snaps → sort by latest snap
//                 return new Date(b.lastSnap.createdAt) - new Date(a.lastSnap.createdAt);
//             }

//             if (aHasSnap && !bHasSnap) {
//                 // A has snap, B doesn't
//                 if (new Date(a.lastSnap.createdAt) > new Date(b.addedAt)) {
//                     return -1;
//                 } else {
//                     return 1;
//                 }
//             }

//             if (!aHasSnap && bHasSnap) {
//                 // B has snap, A doesn't
//                 if (new Date(b.lastSnap.createdAt) > new Date(a.addedAt)) {
//                     return 1;
//                 } else {
//                     return -1;
//                 }
//             }

//             // Neither has snap → sort by addedAt DESC (newest first)
//             return new Date(b.addedAt) - new Date(a.addedAt);
//         });



//         console.log(result)

//         return res.status(200).json({
//             success: true,
//             friends: result
//         })

//     } catch (error) {
//         console.log("Catch Error:: ", error);   
//         return res.status(500).json({
//             success: false,
//             message: error.message,
//         });
//     }
// }
// exports.getAllFriendWithSnap = async (req, res) => {
//     try {
//         const userId = req.user.id;


//         const currentUser = await User.findById(userId).populate('friends', 'userName avatarImg');
//         const friends = currentUser.friends;

//         console.log("Friends=======")
//         // console.log(friends)

//         const result = await Promise.all(
//             friends.map(async (friend) => {
//                 const latestSnap = await Snap.findOne({
//                     sender: friend._id,
//                     receivers: userId,
//                     'viewedBy.user': { $ne: userId }
//                 })
//                     .sort({ createdAt: -1 })
//                     .lean();

//                 return {
//                     friend,
//                     latestSnap: latestSnap || null,
//                 };
//             })
//         );

//         result.sort((a, b) => {
//             if (a.latestSnap && b.latestSnap) {
//                 return new Date(b.latestSnap.createdAt) - new Date(a.latestSnap.createdAt);
//             } else if (a.latestSnap) {
//                 return -1;
//             } else if (b.latestSnap) {
//                 return 1;
//             } else {
//                 const nameA = a.friend?.username || '';
//                 const nameB = b.friend?.username || '';
//                 return nameA.localeCompare(nameB);
//             }
//         });
//         res.status(200).json(result);

//     } catch (error) {
//         console.log("Catch Error:: ", error);
//         return res.status(500).json({
//             success: false,
//             message: error.message,
//         });
//     }
// }

exports.getNextSnap = async (req, res) => {
    try {
        const { frdId } = req.body;
        console.log(frdId);
        if (!frdId) {
            return res.status(400).json({
                success: false,
                message: "Frd Id Required"
            })
        }

        const snap = await Snap.findOne({
            sender: frdId,
            receivers: req.user._id,
            'viewedBy.user': { $ne: req.user._id }
        }).sort({ createdAt: 1 }).lean();
        console.log(snap);
        if (!snap) {
            return res.status(404).json({
                success: false,
                message: "No Unviewd Snap"
            })
        }

        await Snap.updateOne(
            {
                _id: snap._id,
            },
            {
                $push: {
                    viewedBy: {
                        user: req.user._id,
                        viewedAt: new Date()
                    }
                }
            }
        )

        return res.status(200).json({
            success: true,
            snap
        })

    } catch (error) {
        console.log("Catch Error:: ", error);
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
}