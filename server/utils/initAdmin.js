const Admin = require('../models/Admin');

async function initAdmin() {
  const DEFAULT_EMAIL = 'admin@example.com';
  const DEFAULT_PASSWORD = 'admin123456';

  try {
    const existing = await Admin.findOne({ email: DEFAULT_EMAIL });
    if (existing) {
      console.log(`[INIT] existed：${DEFAULT_EMAIL}`);
      return;
    }

    const admin = new Admin({
      adminName: 'admin',
      email: DEFAULT_EMAIL,
      password: DEFAULT_PASSWORD
    });

    await admin.save();
    console.log(`[INIT] init admin success：${DEFAULT_EMAIL}`);
  } catch (err) {
    console.error('[INIT] init admin failed:', err);
  }
}

module.exports = initAdmin;
