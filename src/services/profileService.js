import axios from 'axios';
import CryptoJS from 'crypto-js';

const apiClient = axios.create({
    baseURL: '/api',
    withCredentials: true,
    timeout: 10000,
});

apiClient.interceptors.request.use(
    (config) => {
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

apiClient.interceptors.response.use(
    (response) => {
        return response;
    },
    (error) => {
        if (error.response?.status === 401) {

        }
        return Promise.reject(error);
    }
);
/**
 * User Profile Service Class
 */
class UserProfileService {
    /**
     * Fetch the information of user
     * @param {string} uid - UserID
     * @returns {Promise<Object>} User Info
     */
    static async getUserInfo(uid) {
        try {
            const response = await apiClient.get('/userprofile/getUserInfo', {
                params: { id: uid }
            });
            return response.data;
        } catch (error) {
            throw error;
        }
    }

    /**
   * Update User Info
   * @param {Object} userInfo - User Info
   * @param {string} userInfo.firstname - User's Firstname
   * @param {string} userInfo.lastname - User's Lastname
   * @returns {Promise<Object>} Response Data
   */
    static async updateUserInfo(userInfo) {
        try {
            const response = await apiClient.post('/userprofile/setUserInfo', userInfo);
            return response.data;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Password Verifying
     * @param {string} password - Plaintext Password
     * @returns {Promise<Object>} Result of Verification
     */
    static async verifyPassword(password) {
        try {
            const hashedPassword = CryptoJS.SHA256(password).toString();
            const response = await apiClient.post('/userprofile/passwordMatch', {
                password: hashedPassword
            });
            return response.data;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Changing Password
     * @param {string} originalPassword - Original Password
     * @param {string} newPassword - New Password
     * @returns {Promise<Object>} Result of Changing
     */
    static async changePassword(originalPassword, newPassword) {
        try {
            const hashedOriginalPassword = CryptoJS.SHA256(originalPassword).toString();
            const hashedNewPassword = CryptoJS.SHA256(newPassword).toString();

            const response = await apiClient.post('/userprofile/changePassword', {
                originalPassword: hashedOriginalPassword,
                newPassword: hashedNewPassword
            });
            return response.data;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Request to Change Email
     * @param {string} newEmail - New Email Address
     * @returns {Promise<Object>} Result of Changing
     */
    static async requestEmailChange(newEmail) {
        try {
            const response = await apiClient.post('/userprofile/requestChangeEmail', {
                newEmail
            });
            return response.data;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Verifying Email Changing
     * @param {string} newEmail - New Email Address
     * @param {string} validationCode - Validation Code
     * @returns {Promise<Object>} Result of Changing
     */
    static async confirmEmailChange(newEmail, validationCode) {
        try {
            const response = await apiClient.post('/userprofile/toChangeEmail', {
                newEmail,
                code: validationCode
            });
            return response.data;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Fetch User Comments
     * @returns {Promise<Array>} User Comments Array
     */
    static async getUserComments() {
        try {
            const response = await apiClient.get('/userprofile/getUserComments');
            return response.data;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Fetch User Listings
     * @returns {Promise<Array>} User Listing Array
     */
    static async getUserListings() {
        try {
            const response = await apiClient.get('/userprofile/getUserListings');
            return response.data;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Toggle Listing Disabled
     * @param {string} phoneId - Listing Goods ID
     * @param {boolean} setDisabled - Whether setting the listing goods to be disabled
     * @returns {Promise<Object} Result of Updating Status
     */
    static async toggleListingDisabled(phoneId, setDisabled) {
        try {
            const response = await apiClient.post('/userprofile/manageListingDisabled', {
                phoneId,
                setDisabled
            });
            return response.data;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Delete Listing
     * @param {string} phoneId - Phone ID
     * @returns {Promise<Object>} Result of Deleting
     */
    static async deleteListing(phoneId) {
        try {
            const response = await apiClient.post('/userprofile/deleteListing', {
                phoneId
            });
            return response.data;
        } catch (error) {
            throw error;
        }
    }

    /**
   * Upload Phone Listing
   * @param {Object} listingData - Listing Data
   * @param {string} listingData.title - Listing Title
   * @param {string} listingData.brand - Listing Brand
   * @param {number} listingData.stock - Listing Stock
   * @param {number} listingData.price - Listing Price
   * @param {File} listingData.image - Listing Preview Image
   * @returns {Promise<Object>} Result of Uploading
   */
    static async addListing(listingData) {
        try {
            const formData = new FormData();
            formData.append('title', listingData.title);
            formData.append('brand', listingData.brand);
            formData.append('stock', listingData.stock);
            formData.append('price', listingData.price);
            formData.append('image', listingData.image);

            const response = await apiClient.post('/userprofile/uploadListing', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
            return response.data;
        } catch (error) {
            throw error;
        }
    }
}

export default UserProfileService;