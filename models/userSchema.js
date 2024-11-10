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
        unique: true
    },
    userEmail: {
        type: String,
        required: true,
    },
    userPassword: {
        type: String,
        required: true
    },
    userAuthenticateType:{
        type: String,
        required: true
    }
});
module.exports = userSchema;