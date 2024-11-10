const mongoose = require("mongoose");
const noteEntrySchema = new mongoose.Schema({
    noteUUID: {
        type: String,
        required: true,
        unique: true
    },
    noteContent: {
        type: String,
        required: true,
    },
    noteUserUUID: {
        type: String,
        required: true,
    },
    noteLastModified: {
        type: String,
        required: true
    }
});
module.exports = noteEntrySchema;