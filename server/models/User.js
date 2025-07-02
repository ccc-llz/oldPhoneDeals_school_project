const mongoose = require('mongoose');
const Schema = mongoose.Schema

const userSchema = new Schema
(
    {
        email: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            lowercase: true
        },
        password: {
            type: String,
            required: true
        },
        firstname: {
            type: String,
            required: true
        },
        lastname: {
            type: String,
            required: true
        },
        wishlist: {
            type: [String],
            default: []
        },
        cart: [{
            phoneId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'phonelisting'
            },
            quantity: {
                type: Number,
                default: 1
            }
        }],
        disabled: {
            type: Boolean,
            default: false
        },
        lastLogin: {
            type: Date,
        }
    }, {
    toJSON: {
        virtuals: true,
        transform: function (doc, ret) {
            delete ret.password;
            return ret;
        }
    },
    timestamps: true
});

const User = mongoose.model('userlist', userSchema, 'userlist');
module.exports = User;