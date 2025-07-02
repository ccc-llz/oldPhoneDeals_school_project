const mongoose = require('./db');

const AdminLogSchema = new mongoose.Schema({
  adminId: {
    type: String,
    required: true
  },
  adminName: {
    type: String,
    required: true
  },
  action: {
    type: String,
    required: true,
    enum: ['create', 'update', 'delete', 'disable', 'enable', 'hide', 'show', 'export', 'login', 'logout', 'other']
  },
  targetType: {
    type: String,
    required: true,
    enum: ['listing', 'review', 'transaction', 'user', 'system']
  },
  targetId: {
    type: String
  },
  details: {
    type: mongoose.Schema.Types.Mixed
  },
  ipAddress: {
    type: String
  },
  userAgent: {
    type: String
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
}, {
  versionKey: false
});

const AdminLog = mongoose.model('AdminLog', AdminLogSchema, 'adminLog');

module.exports = AdminLog;