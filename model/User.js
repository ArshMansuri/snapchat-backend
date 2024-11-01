const mongoose = require('mongoose')
const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt')
const crypto = require('crypto')

const UserSchema = mongoose.Schema({

    firstName: {
        type: String,
        required: true
    },

    lastName: String,

    dob: Date,

    userName: {
        type: String,
        unique: true
    },

    password: {
        type: String,
        minlength: [6, "password must be at least 6 characters"],
        select: false,
    },

    phone: {
        phoneNumber: {
            type: Number,
            minlength: [10, "phone number must be 10 characters"]
        },
        isVerify: Boolean,
        otp: Number,
        otpExpired: Date
    },

    email: {
        email: {
            type: String,
        },
        isVerify: Boolean,
        otp: Number,
        otpExpired: Date
    },

    avatarImg: {
        type: String,
        default: "https://res.cloudinary.com/dbirutg8t/image/upload/v1685538206/avatars/qmjmyxjbuysuf2vzd1ba.jpg"
    },

    gender: {
        type: String,
        enum: ["male", "female"]
    },

    isVerify: {
        type: Boolean,
        default: false
    },

    token: String,

    createdAt: {
        type: Date,
        default: Date.now
    }

})

UserSchema.pre("save", async function (next){
    if(this.isModified("password")){
        this.password = await bcrypt.hash(this.password, 10)
    }
})

UserSchema.methods.matchPassword = async function(password){
    return await bcrypt.compare(password, this.password)
}

UserSchema.methods.CreateToken = async function(){
    return jwt.sign({_id: this._id},process.env.JWT)
}

UserSchema.methods.createForgotPassToken = function(){
    const userToken = crypto.randomBytes(32).toString("hex")
    this.forgotPassToken = crypto.createHash('sha256').update(userToken).digest('hex')
    this.forgotPassExpired = Date.now() +  10 * 60 * 1000
    return userToken
}

UserSchema.index({"phone.otpExpired": 1}, {expireAfterSeconds: 0})

module.exports = mongoose.model("User", UserSchema)
