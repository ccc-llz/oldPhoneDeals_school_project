const express = require('express');
const router = express.Router();
const authMiddleware = require('../utils/adminAuthMiddleware');
const LoginController = require('../controllers/adminController/LoginController');
const UserController = require('../controllers/adminController/UserController');
const ListingController = require('../controllers/adminController/ListingController');
const ReviewController = require('../controllers/adminController/ReviewController');
const TransactionController = require('../controllers/adminController/TransactionController');
const OperationController = require('../controllers/adminController/OperationController');

/* Admin login */
router.post('/login', LoginController.login);

//interceptor token
router.use(authMiddleware);

// get all listings
router.get('/listings', ListingController.getAllListings);

// get paginated listings
router.get('/listings/paged', ListingController.getPagedListings);

// search listings
router.get('/listings/search', ListingController.searchListings);

// create new listing
router.post('/listings', ListingController.createListing);

// get listing details
router.get('/listings/:id', ListingController.getListingDetails);

// update listing
router.put('/listings/:id', ListingController.updateListing);

// disable/enable listing
router.patch('/listings/:id/toggle', ListingController.toggleListingStatus);

// delete listing
router.delete('/listings/:id', ListingController.deleteListing);

// get all reviews
router.get('/reviews', ReviewController.getAllReviews);

// toggle review visibility
router.patch('/reviews/:id/toggle', ReviewController.toggleReviewVisibility);

// get all transactions
router.get('/transactions', TransactionController.getAllTransactions);

// export transactions
router.get('/transactions/export', TransactionController.exportTransactions);

// get transaction details
router.get('/transactions/:id', TransactionController.getTransactionDetails);

// add transaction (for testing)
router.post('/transactions', TransactionController.addTransaction);

/* User Management */
router.get('/users', UserController.getAllUsers);
router.get('/users/:id', UserController.getUserById);
router.put('/users/:id', UserController.updateUser);
router.patch('/users/:id/toggle', UserController.toggleUserStatus);
router.delete('/users/:id/', UserController.deleteUser);
router.get('/users/:id/listings', UserController.getListingsByUserId);
router.get('/users/:id/reviews', UserController.getReviewsByUserId);

/* Operations Log */
router.get('/operations', OperationController.getAllOperations);
router.post('/log', OperationController.logAction);

module.exports = router; 