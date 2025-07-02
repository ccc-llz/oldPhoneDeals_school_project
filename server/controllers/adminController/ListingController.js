const PhoneList = require('../../models/PhoneList');
const User = require('../../models/User');
const { logAdminAction } = require('../../utils/adminOperationLog');

//get all listings
exports.getAllListings = async (req, res) => {
    try {
        const listings = await PhoneList.find();
        res.json(listings);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

//get paginated listings
exports.getPagedListings = async (req, res) => {
    try {
        console.log('Received query params:', req.query);
        const { page = 1, limit = 20, title, brand, sortBy = 'createdAt', sortOrder = -1, sort } = req.query;
        
        //build the query
        let query = {};
        if (title) {
            query.title = { $regex: title, $options: 'i' };
        }
        if (brand) {
            query.brand = brand;
            console.log(`Filtering by brand: "${brand}"`);
        }
        
        console.log('Built query:', query);
        
        //build the sort object
        let sortObj = { createdAt: -1 }; // Default sort
        
        if (sort) {
            try {
                // Parse sort parameter (format: 'field:direction')
                const [field, direction] = sort.split(':');
                if (field && direction) {
                    sortObj = {};
                    sortObj[field] = direction === 'asc' ? 1 : -1;
                    console.log(`Sorting by ${field} in ${direction} order`);
                }
            } catch (error) {
                console.error('Error parsing sort parameter:', error);
                // Fallback to default sorting
                sortObj = { createdAt: -1 };
            }
        } else if (sortBy) {
            // Backward compatibility for older clients
            try {
                sortObj = {};
                sortObj[sortBy] = parseInt(sortOrder) || -1;
            } catch (error) {
                console.error('Error setting sortBy parameter:', error);
                // Fallback to default sorting
                sortObj = { createdAt: -1 };
            }
        }
        
        console.log('Final sort object:', JSON.stringify(sortObj));
        
        //use lean() to speed up the query and only select the needed fields
        const listings = await PhoneList.find(query)
            .select('title brand price stock image seller disabled')
            .sort(sortObj)
            .limit(parseInt(limit) || 20)
            .skip(((parseInt(page) || 1) - 1) * (parseInt(limit) || 20))
            .lean();
        
        //use countDocuments to get the total number of listings faster
        const total = await PhoneList.countDocuments(query);
        
        //get the seller ids
        const sellerIds = listings
            .map(listing => listing.seller)
            .filter(Boolean)
            .map(id => id.toString());
        
        console.log(`Found ${sellerIds.length} unique seller IDs`);
        
        //get the seller information
        let users = [];
        try {
            if (sellerIds.length > 0) {
                users = await User.find({ 
                    _id: { $in: sellerIds } 
                }, 'firstname lastname email').lean();
                console.log(`Found ${users.length} users for sellers`);
            }
        } catch (error) {
            console.error('Error fetching seller information:', error);
            // continue execution, but user information may be incomplete
        }
        
        //create a mapping of user IDs to usernames
        const userMap = {};
        users.forEach(user => {
            if (user && user._id) {
                userMap[user._id.toString()] = `${user.firstname || ''} ${user.lastname || ''}`.trim() || 'Unknown User';
            }
        });
        
        //add the seller name to each listing
        const listingsWithUsernames = listings.map(listing => {
            const result = { ...listing };
            
            //save the original ID, but replace the seller field with the username
            if (listing.seller && userMap[listing.seller.toString()]) {
                result.sellerId = listing.seller;
                result.seller = userMap[listing.seller.toString()];
                console.log(`Processed listing ${listing._id}: seller ID = ${result.sellerId}, seller name = ${result.seller}`);
            } else {
                console.log(`Listing ${listing._id} has no valid seller ID or the seller was not found.`);
            }
            
            return result;
        });
        
        res.json({
            listings: listingsWithUsernames,
            total,
            page: parseInt(page),
            limit: parseInt(limit),
            totalPages: Math.ceil(total / limit)
        });
    } catch (error) {
        console.error(`Error getting paginated listings: ${error.message}`);
        res.status(500).json({ message: error.message });
    }
};

//search listings
exports.searchListings = async (req, res) => {
    try {
        const { title, brand } = req.query;
        let query = {};

        if (title) {
            query.title = { $regex: title, $options: 'i' };
        }
        if (brand) {
            query.brand = brand;
        }

        const listings = await PhoneList.find(query);
        res.json(listings);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

//create new listing
exports.createListing = async (req, res) => {
    try {
        const listingData = req.body;
        
        // Validate required fields
        if (!listingData.title || !listingData.brand || 
            listingData.price === undefined || listingData.stock === undefined || 
            !listingData.seller) {
            return res.status(400).json({ message: 'Missing required fields' });
        }
        
        // Create new phone listing
        const newListing = new PhoneList({
            title: listingData.title,
            brand: listingData.brand,
            price: listingData.price,
            stock: listingData.stock,
            image: listingData.image || '',
            seller: listingData.seller,
            reviews: []
        });
        
        await newListing.save();
        await logAdminAction(req, 'create', 'listing', userId, {Title: listingData.title}); // log operations
        res.status(201).json(newListing);
    } catch (error) {
        console.error(`Error creating listing: ${error.message}`);
        res.status(500).json({ message: error.message });
    }
};

//update listing
exports.updateListing = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;

        //do not allow updating certain fields
        delete updateData.seller;
        delete updateData.reviews;
        delete updateData.createdAt;
        delete updateData.updatedAt;

        const listing = await PhoneList.findByIdAndUpdate(
            id,
            { $set: updateData },
            { new: true }
        );

        if (!listing) {
            return res.status(404).json({ message: 'Listing not found' });
        }
        
        await logAdminAction(req, 'update', 'listing', id, {Title: listing.title}); // log operations

        res.json(listing);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

//disable/enable listing
exports.toggleListingStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const listing = await PhoneList.findById(id);

        if (!listing) {
            return res.status(404).json({ message: 'Listing not found' });
        }

        console.log(`Current disabled status:`, listing.disabled);
        
        //based on the actual database structure, toggling means adding or removing the disabled field
        if (listing.disabled === undefined || listing.disabled === null) {
            //if the disabled field does not exist, add an empty string to disable it
            listing.disabled = "";
            console.log('Disabling listing');

            await logAdminAction(req, 'disable', 'listing', id, {Title: listing.title}); // log operations
        } else {
            //if the disabled field exists, remove it to enable the item
            listing.disabled = undefined;
            //due to Mongoose's mechanism, we need to explicitly notify it that we've modified the field
            listing.markModified('disabled');
            console.log('Enabling listing');

            await logAdminAction(req, 'enable', 'listing', id, {Title: listing.title}); // log operations
        }
        
        await listing.save();
        
        console.log(`After save, disabled status:`, listing.disabled);

        res.json(listing);
    } catch (error) {
        console.error(`Error toggling status: ${error.message}`);
        res.status(500).json({ message: error.message });
    }
};

//delete listing
exports.deleteListing = async (req, res) => {
    try {
        const { id } = req.params;
        const listing = await PhoneList.findByIdAndDelete(id);

        if (!listing) {
            return res.status(404).json({ message: 'Listing not found' });
        }
        
        await logAdminAction(req, 'delete', 'listing', id, {Title: listing.title}); // log operations

        res.json({ message: 'Listing deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

//get listing details (including reviews and seller information)
exports.getListingDetails = async (req, res) => {
    try {
        const { id } = req.params;
        const listing = await PhoneList.findById(id);

        if (!listing) {
            return res.status(404).json({ message: 'Listing not found' });
        }

        res.json(listing);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};