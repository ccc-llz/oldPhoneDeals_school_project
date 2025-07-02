const express = require('express')
const controller = require('../controllers/controllers')
const router = express.Router()

router.get('/phones', controller.getData);
router.get('/phones/almostSoldOut', controller.getAlmostSoldOut);
router.get('/phones/bestSellers', controller.getBestSellers);
router.get('/brands', controller.getBrands);
router.post('/checkout', controller.checkout)
router.get('/phones/:id', controller.getPhoneById);
router.post('/phones/:id/review', controller.addReview)
router.post('/phones/:id/review/:reviewIndex/toggle-visibility', controller.toggleReviewVisibility);
router.post('/user/wishlist', controller.addToWishlist)
router.post('/user/cart', controller.addToCart)
router.get('/user/cart', controller.getCart)
router.post('/user/cart/update', controller.updateCart)
router.post('/user/cart/remove', controller.removeCartItem)
// routes.js

module.exports = router