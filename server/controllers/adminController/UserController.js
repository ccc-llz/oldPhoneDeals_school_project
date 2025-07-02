const User = require('../../models/User');
const PhoneList = require('../../models/PhoneList');
const { logAdminAction } = require('../../utils/adminOperationLog');

//get all users
exports.getAllUsers = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      name,
      email,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      sort
    } = req.query;

    // Handle the sort parameter in the new format (field:direction)
    let useSortByField = sortBy;
    let useSortDirection = sortOrder === 'asc' ? 1 : -1;

    if (sort) {
      // Parse sort parameter (format: 'field:direction')
      const [field, direction] = sort.split(':');
      if (field && direction) {
        useSortByField = field;
        useSortDirection = direction === 'asc' ? 1 : -1;
        console.log(`Sorting by ${field} in ${direction} order`);
      }
    }

    const sortOption = {};
    const dbSortableFields = ['createdAt', 'email', 'firstname', 'lastname', '_id'];
    const useDatabaseSort = dbSortableFields.includes(useSortByField);
    
    if (useDatabaseSort) {
      sortOption[useSortByField] = useSortDirection;
    }

    const allUsers = useDatabaseSort
      ? await User.find().sort(sortOption).lean()
      : await User.find().lean();

    const userIds = allUsers.map(u => u._id.toString());

    // Listing count
    const listingCounts = await PhoneList.aggregate([
      { $match: { seller: { $in: userIds } } },
      { $group: { _id: '$seller', count: { $sum: 1 } } }
    ]);
    const listingMap = Object.fromEntries(listingCounts.map(l => [l._id, l.count]));

    // Review counts
    const postedCounts = await PhoneList.aggregate([
      { $unwind: '$reviews' },
      { $match: { 'reviews.reviewer': { $in: userIds } } },
      { $group: { _id: '$reviews.reviewer', count: { $sum: 1 } } }
    ]);
    const postedMap = Object.fromEntries(postedCounts.map(r => [r._id.toString(), r.count]));

    const receivedCounts = await PhoneList.aggregate([
      { $match: { seller: { $in: userIds } } },
      { $unwind: '$reviews' },
      { $group: { _id: '$seller', count: { $sum: 1 } } }
    ]);
    const receivedMap = Object.fromEntries(receivedCounts.map(r => [r._id.toString(), r.count]));

    // enrich data
    let users = allUsers.map(user => {
      const uid = user._id.toString();
      return {
        ...user,
        fullName: `${user.firstname || ''} ${user.lastname || ''}`.trim(),
        listingCount: listingMap[uid] || 0,
        postedCount: postedMap[uid] || 0,
        receivedCount: receivedMap[uid] || 0
      };
    });

    // filtering
    if (name) {
      users = users.filter(user =>
        user.fullName && user.fullName.toLowerCase().includes(name.toLowerCase())
      );
    }
    if (email) {
      users = users.filter(user =>
        user.email && user.email.toLowerCase().includes(email.toLowerCase())
      );
    }

    // sort by custom field (like fullName)
    if (!useDatabaseSort && useSortByField) {
      users.sort((a, b) => {
        const aVal = (a[useSortByField] || '').toString().toLowerCase();
        const bVal = (b[useSortByField] || '').toString().toLowerCase();
        return useSortDirection === 1
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      });
    }

    // pagination
    const total = users.length;
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const paginatedUsers = users.slice(startIndex, endIndex);

    res.json({
      users: paginatedUsers,
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error(`Error getting users: ${error.message}`);
    res.status(500).json({ message: error.message });
  }
};


//update user
exports.updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;

        //do not allow updating certain fields
        delete updateData.password;
        delete updateData.lastLogin;

        const userUpdate = await User.findByIdAndUpdate(
            id,
            { $set: updateData },
            { new: true }
        );

        if (!userUpdate) {
            return res.status(404).json({ message: 'User not found' });
        }

        await logAdminAction(req, 'update', 'user', id, {Useremail: updateData.email}); // log operations

        res.json(userUpdate);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

//disable/enable user
exports.toggleUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    console.log(`Current disabled status:`, user.disabled);

    // default false
    if (user.disabled === undefined || user.disabled === null) {
      user.disabled = false;
      console.log('Disabling user');
    } else {
      user.disabled = !user.disabled; // switch
      console.log(`Toggling user to: ${user.disabled ? 'Disabled' : 'Active'}`);
    }

    await user.save();

    await logAdminAction(req, user.disabled ? 'disable' : 'enable', 'user', id, {Useremail: user.email}); // log operations
    console.log(`After save, disabled status:`, user.disabled);

    res.json({
      user
    });
  } catch (error) {
    console.error(`Error toggling user status: ${error.message}`);
    res.status(500).json({ message: error.message });
  }
};

//delete user
exports.deleteUser = async (req, res) => {
    try {
        const { id } = req.params;
        const user = await User.findByIdAndDelete(id);

        if (!user) {
            return res.status(404).json({ message: 'user not found' });
        }

        await logAdminAction(req, 'delete', 'user', id, {Useremail: user.email}); // log operations

        res.json({ message: 'User deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getListingsByUserId = async (req, res) => {
    try {
        const { id } = req.params;
        const listings = await PhoneList.find({ seller: id });
        res.json(listings);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getReviewsByUserId = async (req, res) => {
    try {
        const { id } = req.params;

        // as reviewer
        const phoneReviews = await PhoneList.aggregate([
            { $unwind: '$reviews' },
            { $match: { 'reviews.reviewer': id } },
            { $project: {
            _id: 0,
            listingId: '$_id',
            title: '$title',
            image: '$image',
            rating: '$reviews.rating',
            comment: '$reviews.comment',
            hidden: '$reviews.hidden',
            role: { $literal: 'authored' }
            }}
        ]);

        // as seller
        const receivedReviews = await PhoneList.aggregate([
            { $match: { seller: id } },
            { $unwind: '$reviews' },
            {
                $addFields: {
                reviewerObjectId: { $toObjectId: '$reviews.reviewer' }
                }
            },
            {
                $lookup: {
                from: 'userlist',
                localField: 'reviewerObjectId',
                foreignField: '_id',
                as: 'reviewerInfo'
                }
            },
            { $unwind: '$reviewerInfo' },
            { $project: {
            _id: 0,
            listingId: '$_id',
            title: '$title',
            image: '$image',
            reviewerId: '$reviews.reviewer',
            reviewer: {
                $concat: [
                { $ifNull: ['$reviewerInfo.firstname', ''] },
                ' ',
                { $ifNull: ['$reviewerInfo.lastname', ''] }
                ]
            },
            rating: '$reviews.rating',
            comment: '$reviews.comment',
            hidden: '$reviews.hidden',
            role: { $literal: 'received' }
            }}
        ]);

        res.json([...phoneReviews, ...receivedReviews]);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// get the information of a single user
exports.getUserById = async (req, res) => {
    try {
        const { id } = req.params;
        
        console.log(`Attempting to find user with ID: ${id}`);
        console.log(`Type of ID: ${typeof id}`);
        
        // Validate the ID format to make sure it's a valid MongoDB ObjectId
        if (!id || typeof id !== 'string' || !id.match(/^[0-9a-fA-F]{24}$/)) {
            console.error(`Invalid user ID format: ${id}`);
            return res.status(400).json({ message: 'Invalid user ID format' });
        }
        
        const user = await User.findById(id).lean();
        
        if (!user) {
            console.error(`User not found for ID: ${id}`);
            return res.status(404).json({ message: 'User not found' });
        }
        
        console.log(`Found user: ${user.firstname} ${user.lastname}`);
        
        //get the user's sales data
        const listingsCount = await PhoneList.countDocuments({ seller: id });
        
        //get the user's reviews data
        const reviewsAsAuthor = await PhoneList.aggregate([
            { $unwind: '$reviews' },
            { $match: { 'reviews.reviewer': id } },
            { $count: 'count' }
        ]);
        
        const reviewsCount = reviewsAsAuthor.length > 0 ? reviewsAsAuthor[0].count : 0;
        
        //create an enhanced user information object
        const enhancedUser = {
            ...user,
            fullName: `${user.firstname || ''} ${user.lastname || ''}`.trim(),
            listingsCount,
            reviewsCount,
            lastLoginFormatted: user.lastLogin ? new Date(user.lastLogin).toLocaleString() : 'Never'
        };
        
        res.json(enhancedUser);
    } catch (error) {
        console.error(`Error getting user by ID: ${error.message}`);
        console.error(error.stack);
        res.status(500).json({ message: error.message });
    }
};