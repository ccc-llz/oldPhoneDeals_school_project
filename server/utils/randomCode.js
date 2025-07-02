const crypto = require('crypto')

const generateNewCode = (lowerBound, upperBound) => {
    const code = crypto.randomInt(100000, 999999).toString();
    return code;
};

exports.newCode = generateNewCode;