const PhoneList = require("../models/PhoneList");
const User = require("../models/User");
const { mongoose } = require("mongoose");

exports.getData = async (req, res) => {
    try {
        const brand = req.query.brand;
        const title = req.query.title;
        const maxPrice = req.query.maxPrice;
        // Filter out items where disabled field exists and is not null or undefined

        /* console.log(
            `Filter Condition:\nBrand:${brand}\nTitle:${title}\nmaxPrice:${maxPrice}`
        ); */

        const filter = { disabled: { $exists: false } }; //Not disabled

        if (brand.trim() !== "") {
            // console.log("Filter add condition brand");
            filter.brand = brand;
        }
        if (title.trim() !== "") {
            // console.log("Filter add condition title");
            filter.title = { $regex: title, $options: "i" };
        }
        if (maxPrice > 0) {
            // console.log("Filter add condition price");
            filter.price = { $lte: parseFloat(maxPrice) };
        }

        const phones = await PhoneList.find(filter)
            .select("_id title price image")
            .lean();
        // console.log("Search Phone List", phones);
        res.json(phones);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Database query failed" });
    }
};

exports.getAlmostSoldOut = async (req, res) => {
    try {
        const filter = {
            disabled: { $exists: false },
            stock: { $gt: 0 },
        }; //Not disabled

        const phones = await PhoneList.find(filter)
            .sort({ stock: 1 })
            .limit(5)
            .select("_id title price image")
            .lean();
        // console.log("Search Phone List", phones);
        res.json(phones);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Database query failed" });
    }
};

exports.getBestSellers = async (req, res) => {
    try {
        const phones = await PhoneList.find({
            disabled: { $exists: false },
            reviews: { $exists: true },
        }).lean();
        const bestSellers = await phones
            .filter(
                (phone) =>
                    Array.isArray(phone.reviews) && phone.reviews.length >= 2
            )
            .map((phone) => ({
                _id: phone._id,
                title: phone.title,
                image: phone.image,
                price: phone.price,
                avgRating:
                    phone.reviews.reduce(
                        (sum, review) => sum + (parseFloat(review.rating) || 0),
                        0
                    ) / phone.reviews.length,
            }))
            .sort((a, b) => b.avgRating - a.avgRating)
            .slice(0, 5);
        // console.log("Search Phone List", bestSellers);
        res.json(bestSellers);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Database query failed" });
    }
};

exports.getBrands = async function (req, res) {
    try {
        const brands = await PhoneList.distinct("brand");
        res.json(brands);
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch brands" });
    }
};

exports.getPhoneById = async function (req, res) {
    const id = req.params.id;
    var uid = null;
    if (req.session.user) {
        uid = req.session.user.id;
    } else {
        uid = null;
    }
    try {
        const phone = await PhoneList.findById(id).lean();

        if (!phone) {
            return res.status(404).json({ error: "Item not found" });
        }

        // Process seller to include details
        if (phone.seller !== undefined) {
            const sellerUser = await User.findById(phone.seller).lean();
            if (sellerUser) {
                // Update seller to an object
                phone.seller = {
                    _id: sellerUser._id,
                    firstname: sellerUser.firstname,
                    lastname: sellerUser.lastname,
                };
            } else {
                phone.seller = null; // Handle missing seller
            }
        } else {
            phone.seller = null;
        }
        // console.log(phone.seller?._id.toString() || "null");
        const preprocessedReviews = [];
        // Process reviews to include reviewer details
        if (Array.isArray(phone.reviews) && phone.reviews.length > 0) {
            for (let review of phone.reviews) {
                if (review.reviewer) {
                    const reviewerUser = await User.findById(
                        review.reviewer
                    ).lean();
                    if (reviewerUser) {
                        // Attach reviewer details to the review
                        review.reviewer = {
                            _id: reviewerUser._id,
                            firstname: reviewerUser.firstname,
                            lastname: reviewerUser.lastname,
                        };
                    } else {
                        console.error(
                            `Reviewer not found for ID: ${review.reviewer}`
                        );
                        review.reviewer = null; // Handle missing reviewer
                    }

                    /* if (uid !== null && uid !== review.reviewer._id.toString()) {
                        if (review.hidden === undefined) {
                            console.log('Display to public as uid matched')
                            preprocessedReviews.push(review);
                        }
                    } else if (uid !== null && (uid === review.reviewer._id.toString() || uid === phone.seller?._id.toString())) {
                        console.log("is seller or reviewer");
                        if (review.hidden !== undefined) {
                            // console.log('Is a hidden comment')
                            review.toDisplay = false;
                        }
                        preprocessedReviews.push(review);
                    } else if (uid === null && review.hidden === undefined) {
                        preprocessedReviews.push(review);
                    }
                    console.log(uid, review); */
                    if(review.hidden === undefined) {
                        preprocessedReviews.push(review);
                    } else {
                        if(uid !== null) {
                            if(uid === review.reviewer._id.toString() || (uid === phone.seller?._id.toString())) {
                                review.toDisplay = false;
                                preprocessedReviews.push(review);
                            }
                        }
                    }
                } else {
                    console.error("Review missing reviewer field:", review);
                    review.reviewer = null;
                }
            }
        } else {
            console.error("No reviews found for phone:", phone._id);
        }

        phone.reviews = preprocessedReviews;
        console.log(preprocessedReviews);
        res.json(phone);
    } catch (err) {
        console.error("Error fetching item:", err);
        res.status(500).json({ error: "Internal server error" });
    }
};

exports.addReview = async function (req, res) {
    const phoneId = req.params.id;
    const { comment, rating, hidden } = req.body;
    const userId = req.session?.user?.id;

    if (!userId) {
        return res.status(401).json({ message: "Not logged in" });
    }

    if (!comment || rating == null) {
        return res.status(400).json({ message: "Missing comment or rating" });
    }

    try {
        const phone = await PhoneList.findById(phoneId);
        if (!phone) {
            return res.status(404).json({ message: "Phone not found" });
        }

        const newReview = {
            reviewer: userId,
            comment,
            rating,
            createdAt: new Date(),
        };

        if (hidden === true) {
            newReview.hidden = "";
        }

        // console.log("Final review object to save:", newReview);
        phone.reviews.push(newReview);
        await phone.save();

        return res
            .status(200)
            .json({ message: "Review submitted successfully" });
    } catch (err) {
        console.error("Error submitting review:", err);
        return res.status(500).json({ message: "Server error" });
    }
};

exports.addToWishlist = async function (req, res) {
    const userId = req.session?.user?.id;
    const { phoneId } = req.body;

    if (!userId) return res.status(401).json({ message: "Not logged in" });

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (!user.wishlist) user.wishlist = [];

    if (!user.wishlist.includes(phoneId)) {
        user.wishlist.push(phoneId);
        await user.save();
    }

    return res.status(200).json({ message: "Added to wishlist" });
};

exports.addToCart = async function (req, res) {
    const userId = req.session?.user?.id;
    const { phoneId, quantity } = req.body;

    if (!userId) return res.status(401).json({ message: "Not logged in" });

    try {
        // Check if phone exists and has enough stock
        const phone = await PhoneList.findById(phoneId);
        if (!phone) {
            return res.status(404).json({ message: "Phone not found" });
        }

        if (phone.stock < quantity) {
            return res
                .status(400)
                .json({ message: "Not enough stock available" });
        }

        // Find user and update cart
        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: "User not found" });

        if (!user.cart) user.cart = [];

        // Check if item already in cart
        const existingItemIndex = user.cart.findIndex(
            (item) =>
                item.phoneId && item.phoneId.toString() === phoneId.toString()
        );

        if (existingItemIndex > -1) {
            // Update quantity if already in cart
            user.cart[existingItemIndex].quantity += quantity;
        } else {
            // Add new item to cart
            user.cart.push({ phoneId, quantity });
        }

        await user.save();

        return res.status(200).json({
            message: "Added to cart",
            cart: user.cart,
        });
    } catch (err) {
        console.error("Error adding to cart:", err);
        return res.status(500).json({ message: "Server error" });
    }
};

exports.getCart = async function (req, res) {
    const userId = req.session?.user?.id;

    if (!userId) return res.status(401).json({ message: "Not logged in" });

    try {
        const user = await User.findById(userId)
            .populate("cart.phoneId")
            .lean();
        if (!user) return res.status(404).json({ message: "User not found" });

        const cart = [];
        const unavailableItem = [];
        for (const item of user.cart) {
            //Verify item is available
            // console.log(item);
            const phone = PhoneList.findById(item.phoneId);
            if (!phone || item.phoneId === null) {
                console.log("Detected unavailable item");
                unavailableItem.push(item._id);
                continue;
            }
            delete item.seller;
            delete item.reviews;
            delete item.brand;
            delete item.image;
            cart.push(item);
        }
        for (const itemID of unavailableItem) {
            await User.updateOne(
                { _id: userId },
                { $pull: { cart: { _id: itemID } } }
            );
        }
        return res.status(200).json({ cart: cart });
    } catch (err) {
        console.error("Error fetching cart:", err);
        return res.status(500).json({ message: "Server error" });
    }
};

exports.checkout = async function (req, res) {
    // console.log("Checkout request received:", req.body);
    const cart = req.body.cart;
    const userId = req.session?.user?.id;

    if (!userId) {
        return res.status(401).json({ error: "Not logged in" });
    }

    // Validate cart data
    if (!cart || !Array.isArray(cart) || cart.length === 0) {
        console.error("Invalid cart data:", cart);
        return res.status(400).json({ error: "Invalid cart data" });
    }

    const PhoneList = mongoose.model("phonelisting");

    try {
        // Remove the transaction session approach
        let totalAmount = 0;
        const purchasedItems = [];

        // Step 1: Validate all items before making any changes
        for (let item of cart) {
            // console.log("Checking item:", item);

            if (!item.phoneId && !item._id) {
                console.error("Item missing ID:", item);
                return res
                    .status(400)
                    .json({ error: "Invalid item data: missing phone ID" });
            }

            const phoneId = item.phoneId || item._id;
            const quantity = item.quantity || 1;

            if (quantity <= 0) {
                console.error("Invalid quantity:", quantity);
                return res.status(400).json({ error: "Invalid quantity" });
            }

            const phone = await PhoneList.findById(phoneId);

            if (!phone) {
                console.error(`Phone not found: ${phoneId}`);
                return res
                    .status(404)
                    .json({ error: `Phone ${item.title} not found` });
            }

            if (phone.stock < quantity) {
                console.error(
                    `Insufficient stock for ${phone.title}: ${phone.stock} < ${quantity}`
                );
                return res.status(400).json({
                    error: `Insufficient stock for ${phone.title}. Only ${phone.stock} available.`,
                });
            }

            purchasedItems.push({
                product: phone._id,
                title: phone.title,
                price: phone.price,
                quantity: quantity,
            });

            totalAmount += phone.price * quantity;
        }

        // Step 2: Update stock quantities
        for (let item of cart) {
            const phoneId = item.phoneId || item._id;
            const quantity = item.quantity || 1;

            const phone = await PhoneList.findById(phoneId);
            phone.stock -= quantity;
            await phone.save();
        }

        // Step 3: Clear user's cart
        // console.log(`Clearing cart for user ${userId}`);
        const User = mongoose.model("userlist");
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        user.cart = [];
        await user.save();

        // Step 4: Create transaction record
        const Transaction = require("../models/Transaction");

        const transaction = new Transaction({
            buyer: userId,
            items: purchasedItems.map((item) => ({
                ...item,
                product: item.product,
            })),
            totalAmount: totalAmount,
            status: "completed",
            timestamp: new Date(),
        });

        await transaction.save();
        console.log("Transaction record created:", transaction._id);

        const io = req.app.get("io");
        io.emit("new-order", {
            orderId: transaction._id,
            buyerName: `${user.firstname || ""} ${user.lastname || ""}`.trim(),
            total: totalAmount,
            itemCount: purchasedItems.length,
            createdAt: transaction.timestamp,
        });

        // console.log("Checkout completed successfully");
        return res.status(200).json({
            message: "Checkout successful! Your order has been delivered.",
            orderId: transaction._id,
        });
    } catch (err) {
        console.error("Checkout error:", err);
        console.error("Error details:", {
            name: err.name,
            message: err.message,
            stack: err.stack,
            code: err.code,
        });

        res.status(500).json({ error: "Server error during checkout" });
    }
};

exports.updateCart = async function (req, res) {
    const userId = req.session?.user?.id;
    const { phoneId, quantity } = req.body;

    if (!userId) return res.status(401).json({ message: "Not logged in" });

    try {
        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: "User not found" });

        if (!user.cart) user.cart = [];

        const itemIndex = user.cart.findIndex(
            (item) =>
                item.phoneId && item.phoneId.toString() === phoneId.toString()
        );

        if (itemIndex === -1) {
            return res.status(404).json({ message: "Item not in cart" });
        }

        user.cart[itemIndex].quantity = quantity;
        await user.save();

        return res.status(200).json({
            message: "Cart updated",
            cart: user.cart,
        });
    } catch (err) {
        console.error("Error updating cart:", err);
        return res.status(500).json({ message: "Server error" });
    }
};

exports.removeCartItem = async function (req, res) {
    const userId = req.session?.user?.id;
    const { phoneId } = req.body;

    if (!userId) return res.status(401).json({ message: "Not logged in" });

    try {
        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: "User not found" });

        if (!user.cart) user.cart = [];

        user.cart = user.cart.filter(
            (item) =>
                !item.phoneId || item.phoneId.toString() !== phoneId.toString()
        );

        await user.save();

        return res.status(200).json({
            message: "Item removed from cart",
            cart: user.cart,
        });
    } catch (err) {
        console.error("Error removing from cart:", err);
        return res.status(500).json({ message: "Server error" });
    }
};

exports.toggleReviewVisibility = async function (req, res) {
    const phoneId = req.params.id;
    const reviewIndex = req.params.reviewIndex;
    const { hidden } = req.body;
    const userId = req.session?.user?.id;
    if (!userId) {
        return res.status(401).json({ message: "Not logged in" });
    }
    try {
        const phone = await PhoneList.findById(phoneId);
        if (!phone) {
            return res.status(404).json({ message: "Phone not found" });
        }

        if (!phone.reviews || reviewIndex >= phone.reviews.length) {
            return res.status(400).json({ message: "Review not found" });
        }

        const review = phone.reviews[reviewIndex];
        if (review.reviewer !== userId && phone.seller !== userId) {
            return res
                .status(403)
                .json({ message: "Not authorized to modify this review" });
        }

        if (hidden) {
            review.hidden = "";
        } else {
            review.set("hidden", undefined);
        }

        await phone.save();

        return res.status(200).json({
            message: "Review visibility updated",
        });
    } catch (err) {
        console.error("Error updating review visibility:", err);
        return res.status(500).json({ message: "Server error" });
    }
};
