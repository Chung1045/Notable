const mongoose = require("mongoose");
const userSchema = new mongoose.Schema({
    userUUID: {
        type: String,
        required: true,
        unique: true
    },
    userName: {
        type: String,
        required: true,
    },
    userEmail: {
        type: String,
        required: true,
    },
    userPassword: {
        type: String,
    },
    userAuthenticateType:{
        type: String,
        required: true
    },
    googleId:{
        type: String,
        unique: true
    }
});
module.exports = userSchema;