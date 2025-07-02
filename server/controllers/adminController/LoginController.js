const Admin = require('../../models/Admin');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { logAdminAction } = require('../../utils/adminOperationLog');

exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const admin = await Admin.findOne({ email });
    if (!admin) {
      return res.status(401).json({ message: 'email incorrect' });
    }

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'password incorrect' });
    }

    const token = jwt.sign(
      {
        adminId: admin._id,
        adminName: admin.adminName
      },
      process.env.SECRET_KEY,
      { expiresIn: process.env.TOKEN_EXPIRES_IN }
    );

    req.admin = {
      adminId: admin._id,
      adminName: admin.adminName
    };
    await logAdminAction(req, 'login', 'system', admin._id, {adminName: admin.adminName}); // log operations

    return res.status(200).json({
      message: 'log in success',
      token,
      admin: {
        adminId: admin._id,
        adminName: admin.adminName,
        email: admin.email
      }
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};