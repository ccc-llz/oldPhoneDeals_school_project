/**
 * Validates Email Formate
 * @param {string} email - Email Address
 * @returns {boolean} isValid
 */
export const validateEmail = (email) => {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailPattern.test(email);
};

/**
 * Check is not empty
 * @param {string} value - Value
 * @returns {boolean} Is Not Empty
 */
export const validateRequired = (value) => {
    return value && value.trim() !== '';
};