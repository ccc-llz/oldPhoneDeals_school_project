const express = require('express');
const router = express.Router();
const profileController = require('../controllers/profileController');

router.get('/getUserInfo', profileController.getUserInfo);
router.post('/requestChangeEmail', profileController.requestAlterUserEmail);
router.post('/toChangeEmail', profileController.toAlterUserEmail);
router.post('/passwordMatch', profileController.passwordMatch);
router.post('/setUserInfo', profileController.setUserInfo);
router.post('/changePassword', profileController.changeUserPassword);
router.get('/getUserComments', profileController.getUserComments);
router.get('/getUserListings', profileController.getUserListings);
router.post('/manageListingDisabled', profileController.manageListingDisabled);
router.post('/uploadListing', profileController.uploadListing);
router.post('/deleteListing', profileController.deleteListing);

module.exports = router;