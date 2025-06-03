const mongoose = require('mongoose')

const SnapSchema = mongoose.Schema({
    sender: {
        type:  mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },

    receivers: [
        {
            type:  mongoose.Schema.Types.ObjectId,
            ref: "User"
        }
    ],

    mediaType: {
        type: String,
        enum: ["img", "video"],
        required: true
    },

    mediaUrl: {
        type: String,
        required: true
    },

    duration: {
        type: Number,
        default: 10
    },

    isStory: {
        type: Boolean,
        default: false
    },

    viewedBy: [
        {
            user: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User"
            },
            viewedAt: {
                type: Date,
                default: Date.now
            }
        }
    ],

    createdAt: {
        type: Date,
        default: Date.now,
    }
})


module.exports = mongoose.model('Snap', SnapSchema);