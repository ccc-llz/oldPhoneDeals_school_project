const jwt = require('jsonwebtoken');

module.exports = function (req, res, next) {
  const token = req.headers.token;

  if (!token) {
    return res.status(401).json({ message: 'Not logged, login first' });
  }

  try {
    const decoded = jwt.verify(token, process.env.SECRET_KEY);
    req.admin = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'token invalid or expired' });
  }
};