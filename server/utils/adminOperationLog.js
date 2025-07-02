const AdminLog = require('../models/AdminLog');

/**
 * log operations
 * @param {Object} req - Administrator detail
 * @param {string} action
 * @param {string} targetType -（'user'、'listing'...）
 * @param {Object} [details]
 */
const logAdminAction = async (req, action, targetType, targetId = null, details = {}) => {
  try {
    const log = new AdminLog({
      adminId: req.admin.adminId,
      adminName: req.admin.adminName,
      action,
      targetType,
      targetId,
      details,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    await log.save();
    console.log(`[Log] ${req.admin.adminName} ${action} ${targetType}${targetId ? ` (ID: ${targetId})` : ''}`);
  } catch (err) {
    console.error('[logAdminAction] err:', err.message);
  }
};

module.exports = {
  logAdminAction
};