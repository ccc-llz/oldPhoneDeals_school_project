import axios from 'axios';
import CryptoJS from 'crypto-js';

const authClient = axios.create({
    baseURL: '/api',
    withCredentials: true,
    timeout: 10000,
});

/**
 * Authentication Service Class
 */
class AuthService {
    /**
    * Check Authentication Status
    * @returns {Promise<Object>} Authentication Info
    */
    static async checkAuthStatus() {
        try {
            const response = await authClient.get('/auth/status');
            return response.data;
        } catch (error) {
            throw error;
        }
    }

    /**
     * User Sign In
     * @param {string} email - Email Address
     * @param {string} password - Password
     * @returns {Promise<Object>} Result of Signing in
     */
    static async login(email, password) {
        try {
            const hashedPassword = CryptoJS.SHA256(password).toString();
            const response = await authClient.post('/auth/login', {
                email,
                password: hashedPassword
            });
            return response.data;
        } catch (error) {
            throw error;
        }
    }

    /**
     * User Sign Up
     * @param {Object} userData - User Data
     * @param {string} userData.email - User Email Address
     * @param {string} userData.password - User Password
     * @param {string} userData.firstname - User Firstname
     * @param {string} userData.lastname - User Lastname
     * @returns {Promise<Object>} Result of Register
     */
    static async register(userData) {
        try {
            const hashedPassword = CryptoJS.SHA256(userData.password).toString();
            const response = await authClient.post('/auth/register', {
                ...userData,
                password: hashedPassword
            });
            return response.data;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Validate Email
     * @param {string} code - Validation Code
     * @returns {Promise<Object>} Result of Validation
     */
    static async verifyEmail(code) {
        try {
            const response = await authClient.post('/auth/verifyEmail', { code });
            return response.data;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Resend Validation Code
     * @returns {Promise<Object>} Result of Sending Code
     */
    static async resendValidationCode() {
        try {
            const response = await authClient.post('/auth/resendCode', {});
            return response.data;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Request Reset Password
     * @param {string} email - Email Address
     * @returns {Promise<Object>} Result of Request
     */
    static async forgotPassword(email) {
        try {
            const response = await authClient.post('/auth/forgot-password', { email });
            return response.data;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Verify Token of Resetting Password
     * @param {string} token - Token of Resetting
     * @returns {Promise<Object>} Result of Varification
     */
    static async validateResetToken(token) {
        try {
            const response = await authClient.get(`/auth/reset-password/${token}`);
            return response.data;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Reset Password
     * @param {string} token - Token of Resetting
     * @param {string} password - New Password
     * @returns {Promise<Object>} Result of Resetting
     */
    static async resetPassword(token, password) {
        try {
            const hashedPassword = CryptoJS.SHA256(password).toString();
            const response = await authClient.post(`/auth/reset-password/${token}`, {
                password: hashedPassword
            });
            return response.data;
        } catch (error) {
            throw error;
        }
    }

    /**
     * User Sign Out
     * @returns {Promise<Object>} Result of Signing Out
     */
    static async logout() {
        try {
            const response = await authClient.post('/auth/logout', {});
            return response.data;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Abort Registration
     * @returns {Promise<Object>} Result of Abortion
     */
    static async abortRegistration() {
        try {
            const response = await authClient.post('/auth/abortRegistration', {});
            return response.data;
        } catch (error) {
            throw error;
        }
    }
}

export default AuthService;