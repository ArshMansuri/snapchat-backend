const mongoose = require("mongoose")

const FriendSchema = mongoose.Schema({

    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    unique: true
    },

    friends: [
        {
            fId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User",
                required: true,
            },
            addedAt: {
                type: Date,
                default: Date.now
            }
        }
    ]
})

module.exports = mongoose.model("Friend", FriendSchema);