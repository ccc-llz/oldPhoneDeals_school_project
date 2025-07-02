const mongoose = require('mongoose');
const Schema = mongoose.Schema

const userPasswordResetSchema = new Schema({
    userId:{
        type: Schema.Types.ObjectId,
        ref:'User',
        required:true
    },
    resetPasswordToken: {
        type: String,
        required: true
    },
    resetPasswordExpires: {
        type: Date,
        required: true
    }
});

const UserPasswordReset = mongoose.model('UserPasswordReset', userPasswordResetSchema);
module.exports = UserPasswordReset;