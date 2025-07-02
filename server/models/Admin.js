const mongoose = require('./db');
const bcrypt = require('bcrypt');

// set hardcode strength
const SALT_ROUNDS = 10;

const AdminSchema = new mongoose.Schema({
  adminName: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  }
}, {
  versionKey: false
});

// encode the password
AdminSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  try {
    const hashed = await bcrypt.hash(this.password, SALT_ROUNDS);
    this.password = hashed;
    next();
  } catch (err) {
    next(err);
  }
});

const Admin = mongoose.model('Admin', AdminSchema, 'admin');

module.exports = Admin;
