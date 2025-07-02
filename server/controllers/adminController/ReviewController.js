const PhoneList = require('../../models/PhoneList');
const User = require('../../models/User');
const { logAdminAction } = require('../../utils/adminOperationLog');

//get all reviews (including hidden ones)
exports.getAllReviews = async (req, res) => {
    try {
        const { page = 1, limit = 20, text, user, listingId, sortBy = 'reviewIndex', sortOrder = -1, sort, status } = req.query;
        console.log('Getting reviews with params:', { page, limit, text, user, listingId, sortBy, sortOrder, sort, status });
        
        //flatten all reviews
        const allListings = await PhoneList.find({}, 'title reviews');
        let allReviews = [];
        
        //store all reviewer IDs for bulk query
        const reviewerIds = new Set();
        
        allListings.forEach(listing => {
            if (listing.reviews && listing.reviews.length > 0) {
                console.log(`Processing ${listing.reviews.length} reviews from listing: ${listing.title} (${listing._id})`);
                
                listing.reviews.forEach((review, reviewIndex) => {
                    // create a unique identifier， since the reviews in the database do not have _id field
                    //format: listingId_reviewIndex
                    const reviewId = `${listing._id}_${reviewIndex}`;
                    console.log(`Creating synthetic ID for review: ${reviewId}`);
                    
                    // 收集所有reviewer ID
                    if (review.reviewer) {
                        reviewerIds.add(review.reviewer.toString());
                    }
                    
                    allReviews.push({
                        ...review.toObject ? review.toObject() : review,
                        _id: reviewId,                    // synthetic ID
                        reviewIndex: reviewIndex,         // index in the array
                        listingId: listing._id.toString(), // associated product ID
                        listingTitle: listing.title,
                        reviewerId: review.reviewer        // 保存原始reviewer ID
                    });
                });
            }
        });
        
        console.log(`Total reviews found: ${allReviews.length}`);
        console.log(`Unique reviewer IDs: ${reviewerIds.size}`);
        
        //get all related user information
        const users = await User.find({ 
            _id: { $in: Array.from(reviewerIds) } 
        }, 'firstname lastname email');
        
        //create a mapping of user IDs to usernames
        const userMap = {};
        users.forEach(user => {
            userMap[user._id.toString()] = `${user.firstname} ${user.lastname}`;
        });
        
        console.log(`Found ${users.length} users for reviewers`);
        
        //replace the reviewer ID with the username
        allReviews = allReviews.map(review => {
            if (review.reviewerId && userMap[review.reviewerId]) {
                review.reviewer = userMap[review.reviewerId];
            }
            return review;
        });
        
        // apply filters
        if (text) {
            allReviews = allReviews.filter(review => 
                review.comment && review.comment.toLowerCase().includes(text.toLowerCase())
            );
            console.log(`After text filter: ${allReviews.length} reviews`);
        }
        
        if (user) {
            allReviews = allReviews.filter(review => 
                review.reviewer && review.reviewer.toLowerCase().includes(user.toLowerCase())
            );
            console.log(`After user filter: ${allReviews.length} reviews`);
        }
        
        if (listingId) {
            allReviews = allReviews.filter(review => review.listingId === listingId);
            console.log(`After listingId filter: ${allReviews.length} reviews`);
        }

        // Filter by status (visible/hidden)
        if (status) {
            if (status === 'visible') {
                allReviews = allReviews.filter(review => review.hidden === undefined);
                console.log(`After visible status filter: ${allReviews.length} reviews`);
            } else if (status === 'hidden') {
                allReviews = allReviews.filter(review => review.hidden !== undefined);
                console.log(`After hidden status filter: ${allReviews.length} reviews`);
            }
        }
        
        // Apply sorting
        if (sort) {
            // Parse sort parameter (format: 'field:direction')
            const [field, direction] = sort.split(':');
            if (field && direction) {
                const sortDirection = direction === 'asc' ? 1 : -1;
                console.log(`Sorting by ${field} in ${direction} order`);
                
                allReviews.sort((a, b) => {
                    // Handle special case for 'hidden' field (true/false sort)
                    if (field === 'hidden') {
                        const aHidden = a.hidden !== undefined;
                        const bHidden = b.hidden !== undefined;
                        return aHidden === bHidden ? 0 : aHidden ? sortDirection : -sortDirection;
                    }
                    
                    // Handle special case for listingTitle field
                    if (field === 'listingTitle') {
                        return (a.listingTitle || '').localeCompare(b.listingTitle || '') * sortDirection;
                    }
                    
                    // Normal field sorting
                    if (a[field] < b[field]) return -1 * sortDirection;
                    if (a[field] > b[field]) return 1 * sortDirection;
                    return 0;
                });
            }
        } else if (sortBy) {
            // Backward compatibility for older clients
            const sortMultiplier = parseInt(sortOrder) || -1; // default to descending if not specified
            allReviews.sort((a, b) => {
                // Handle special sorting cases
                if (sortBy === 'listingTitle') {
                    return (a.listingTitle || '').localeCompare(b.listingTitle || '') * sortMultiplier;
                }
                
                // For numerical values
                if (sortBy === 'rating' || sortBy === 'reviewIndex') {
                    return ((a[sortBy] || 0) - (b[sortBy] || 0)) * sortMultiplier;
                }
                
                // Handle special case for hidden status
                if (sortBy === 'hidden') {
                    const aHidden = a.hidden !== undefined;
                    const bHidden = b.hidden !== undefined;
                    if (aHidden === bHidden) return 0;
                    return (aHidden ? 1 : -1) * sortMultiplier;
                }
                
                // Default string comparison for other fields
                return (a[sortBy] || '').toString().localeCompare((b[sortBy] || '').toString()) * sortMultiplier;
            });
            console.log(`Sorted reviews by ${sortBy} in ${sortOrder === 1 ? 'ascending' : 'descending'} order`);
        }
        
        // pagination
        const total = allReviews.length;
        const startIndex = (page - 1) * limit;
        const endIndex = page * limit;
        const paginatedReviews = allReviews.slice(startIndex, endIndex);
        
        console.log(`Returning page ${page} with ${paginatedReviews.length} reviews`);
        
        // display details of the first 5 reviews for debugging
        paginatedReviews.slice(0, 5).forEach((review, index) => {
            console.log(`Review ${index}: ID=${review._id}, Reviewer=${review.reviewer}, Hidden=${review.hidden !== undefined}`);
        });
        
        res.json({
            reviews: paginatedReviews,
            total,
            page: parseInt(page),
            limit: parseInt(limit),
            totalPages: Math.ceil(total / limit)
        });
    } catch (error) {
        console.error('Error getting reviews:', error);
        res.status(500).json({ message: error.message });
    }
};

// toggle review visibility
exports.toggleReviewVisibility = async (req, res) => {
    try {
        const { id } = req.params;
        console.log('Toggling review visibility for ID:', id);
        
        // parse the synthetic ID, format: listingId_reviewIndex
        const [listingId, reviewIndexStr] = id.split('_');
        const reviewIndex = parseInt(reviewIndexStr, 10);
        
        console.log(`Parsed ID: listingId=${listingId}, reviewIndex=${reviewIndex}`);
        
        if (!listingId || isNaN(reviewIndex)) {
            console.error(`Invalid synthetic ID format: ${id}`);
            return res.status(400).json({ message: 'Invalid review ID format' });
        }
        
        // find the product document
        const listing = await PhoneList.findById(listingId);
        if (!listing) {
            console.error(`Listing not found with ID: ${listingId}`);
            return res.status(404).json({ message: 'Listing not found' });
        }
        
        console.log(`Found listing: ${listing.title}`);
        
        // check if the review index is valid
        if (!listing.reviews || reviewIndex >= listing.reviews.length) {
            console.error(`Review index out of bounds: ${reviewIndex}, reviews length: ${listing.reviews?.length || 0}`);
            return res.status(404).json({ message: 'Review not found' });
        }
        
        // get the current review and status
        const currentReview = listing.reviews[reviewIndex];
        const isCurrentlyHidden = currentReview.hidden !== undefined;
        
        console.log('Current review:', currentReview);
        console.log('Is currently hidden:', isCurrentlyHidden);
        
        // prepare the update
        let updateOperation;
        
        if (isCurrentlyHidden) {
            // currently hidden, need to show: delete the hidden field
            console.log('Will make review visible by unsetting hidden field');
            updateOperation = {
                $unset: {
                    [`reviews.${reviewIndex}.hidden`]: 1
                }
            };
        } else {
            // currently visible, need to hide: set the hidden field
            console.log('Will make review hidden by setting hidden field');
            updateOperation = {
                $set: {
                    [`reviews.${reviewIndex}.hidden`]: ""
                }
            };
        }
        
        console.log('Update operation:', JSON.stringify(updateOperation));
        
        // execute the database update operation
        const updateResult = await PhoneList.updateOne(
            { _id: listingId },
            updateOperation
        );
        
        console.log('MongoDB update result:', updateResult);

        await logAdminAction(req, isCurrentlyHidden ? 'show' : 'hide', 'review', reviewIndex); // log operations
        
        if (updateResult.modifiedCount === 0) {
            console.warn('No documents were modified by the update operation');
        }
        
        // get the updated document
        const updatedListing = await PhoneList.findById(listingId);
        const updatedReview = updatedListing.reviews[reviewIndex];
        const finalHiddenStatus = updatedReview.hidden !== undefined;
        
        console.log('Updated review:', updatedReview);
        console.log('Final hidden status:', finalHiddenStatus);
        
        // return the result
        res.json({
            success: true,
            message: 'Review visibility toggled successfully',
            previouslyHidden: isCurrentlyHidden,
            currentlyHidden: finalHiddenStatus,
            review: updatedReview
        });
        
    } catch (error) {
        console.error('Error toggling review visibility:', error);
        res.status(500).json({ message: error.message });
    }
};