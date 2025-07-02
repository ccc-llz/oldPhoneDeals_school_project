const Transaction = require('../../models/Transaction');
const User = require('../../models/User');
const json2csv = require('json2csv').parse;
const { logAdminAction } = require('../../utils/adminOperationLog');

// get all transactions
exports.getAllTransactions = async (req, res) => {
    try {
        const { page = 1, limit = 20, status, startDate, endDate, search, sort } = req.query;
        const skip = (page - 1) * limit;
        
        console.log('Getting transactions with params:', { page, limit, status, startDate, endDate, search, sort });
        
        // build the query
        let query = {};
        
        // filter by status
        if (status) {
            query.status = status;
        }
        
        // filter by date range 
        if (startDate || endDate) {
            query.timestamp = {};
            if (startDate) {
                query.timestamp.$gte = new Date(startDate);
            }
            if (endDate) {
                // set the time to 23:59:59 of the day, to include the whole day
                const endOfDay = new Date(endDate);
                endOfDay.setHours(23, 59, 59, 999);
                query.timestamp.$lte = endOfDay;
            }
        }
        
        // filter by buyer name or product title
        if (search) {
            query.$or = [
                { 'buyer': { $regex: search, $options: 'i' } },
                { 'items.title': { $regex: search, $options: 'i' } }
            ];
        }
        
        console.log('Query:', JSON.stringify(query));
        
        // get the total number of transactions
        const total = await Transaction.countDocuments(query);
        
        // Build sort object
        let sortObj = { timestamp: -1 }; // Default sort by timestamp descending
        
        if (sort) {
            // Parse sort parameter (format: 'field:direction')
            const [field, direction] = sort.split(':');
            if (field && direction) {
                sortObj = {};
                sortObj[field] = direction === 'asc' ? 1 : -1;
                console.log(`Sorting by ${field} in ${direction} order`);
            }
        }
        
        // get the paginated data
        const transactions = await Transaction.find(query)
            .sort(sortObj)
            .skip(skip)
            .limit(parseInt(limit))
            .lean(); // use lean() to get pure JavaScript objects, improve performance
        
        console.log(`Found ${transactions.length} transactions`);
        
        //get all buyer IDs
        const buyerIds = transactions.map(t => t.buyer).filter(Boolean);
        
        //get the user information of these buyers
        const users = await User.find({ 
            _id: { $in: buyerIds } 
        }, 'firstname lastname email').lean();
        
        //create a mapping of user IDs to usernames
        const userMap = {};
        users.forEach(user => {
            userMap[user._id.toString()] = `${user.firstname} ${user.lastname}`;
        });
        
        console.log(`Found ${users.length} users for buyers`);
        
        //add the buyer name to each transaction
        const transactionsWithUsernames = transactions.map(transaction => {
            const result = { ...transaction };
            
            //save the original ID, but replace the buyer field with the username
            if (transaction.buyer && userMap[transaction.buyer]) {
                result.buyerId = transaction.buyer;
                result.buyer = userMap[transaction.buyer];
            }
            
            return result;
        });
        
        res.json({
            transactions: transactionsWithUsernames,
            total,
            page: parseInt(page),
            limit: parseInt(limit),
            totalPages: Math.ceil(total / limit)
        });
    } catch (error) {
        console.error('Error fetching transactions:', error);
        res.status(500).json({ message: 'Failed to retrieve transactions' });
    }
};

// get transaction details
exports.getTransactionDetails = async (req, res) => {
    try {
        const { id } = req.params;
        
        const transaction = await Transaction.findById(id)
            .populate('items.product', 'title brand image price')
            .lean();
        
        if (!transaction) {
            return res.status(404).json({ message: 'Transaction not found' });
        }
        
        //get the buyer information
        if (transaction.buyer) {
            const user = await User.findById(transaction.buyer).lean();
            if (user) {
                //save the original ID, but provide the username
                transaction.buyerId = transaction.buyer;
                transaction.buyer = `${user.firstname} ${user.lastname}`;
            }
        }
        
        res.json(transaction);
    } catch (error) {
        console.error('Error getting transaction details:', error);
        res.status(500).json({ message: error.message });
    }
};

// export transactions (CSV format)
exports.exportTransactions = async (req, res) => {
    console.log('Export transactions request received:', req.query);
    try {
        const { format = 'csv', status, startDate, endDate } = req.query;
        
        // build the query
        let query = {};
        
        // filter by status
        if (status) {
            query.status = status;
        }
        
        // filter by date range
        if (startDate || endDate) {
            query.timestamp = {};
            if (startDate) {
                query.timestamp.$gte = new Date(startDate);
            }
            if (endDate) {
                const endOfDay = new Date(endDate);
                endOfDay.setHours(23, 59, 59, 999);
                query.timestamp.$lte = endOfDay;
            }
        }
        
        console.log('Export query:', JSON.stringify(query));
        
        // get the transactions
        const transactions = await Transaction.find(query)
            .sort({ timestamp: -1 })
            .lean();
        
        console.log(`Found ${transactions.length} transactions to export`);
        
        //get all the buyer IDs
        const buyerIds = transactions.map(t => t.buyer).filter(Boolean);
        
        //get the user information of these buyers
        const users = await User.find({ 
            _id: { $in: buyerIds } 
        }, 'firstname lastname email').lean();
        
        //create a mapping of user IDs to usernames
        const userMap = {};
        users.forEach(user => {
            userMap[user._id.toString()] = `${user.firstname} ${user.lastname}`;
        });
        
        console.log(`Found ${users.length} users for buyers in export`);
        
        // prepare the data to export with user names
        const exportData = transactions.map(transaction => {
            // create a simpler string for the purchased items
            const itemsList = transaction.items.map(item => 
                `${item.title} (${item.quantity} x $${item.price})`
            ).join('; ');
            
            //use the username instead of the ID
            const buyerName = userMap[transaction.buyer] || transaction.buyer;
            
            return {
                ID: transaction._id.toString(),
                Date: new Date(transaction.timestamp).toLocaleString(),
                Buyer: buyerName,
                Items: itemsList,
                Quantity: transaction.items.reduce((total, item) => total + item.quantity, 0),
                TotalAmount: `$${transaction.totalAmount.toFixed(2)}`
            };
        });
        
        const filename = `sales_${Date.now()}`;
        
        // Log the export action
        await logAdminAction(req, 'export', 'transaction', null, {format, count: transactions.length}); // log operations
        
        if (format.toLowerCase() === 'json') {
            // return JSON format
            console.log('Sending JSON response');
            res.setHeader('Content-Type', 'application/json');
            res.setHeader('Content-Disposition', `attachment; filename=${filename}.json`);
            // Use formatting for the JSON output (4-space indentation)
            return res.send(JSON.stringify(exportData, null, 4));
        } else {
            // return CSV format (default)
            try {
                console.log('Generating CSV data');
                const fields = ['ID', 'Date', 'Buyer', 'Items', 'Quantity', 'TotalAmount'];
                const { Parser } = require('json2csv');
                const jsonParser = new Parser({ fields });
                const csv = jsonParser.parse(exportData);
                
                console.log('CSV generated, sending response');
                res.setHeader('Content-Type', 'text/csv');
                res.setHeader('Content-Disposition', `attachment; filename=${filename}.csv`);
                return res.send(csv);
            } catch (csvError) {
                console.error('Error generating CSV:', csvError);
                return res.status(500).json({ message: 'Error generating CSV file: ' + csvError.message });
            }
        }
    } catch (error) {
        console.error('Error exporting transactions:', error);
        return res.status(500).json({ message: error.message });
    }
};

// add a simple transaction (for testing)
exports.addTransaction = async (req, res) => {
    try {
        const { buyer, items, totalAmount, status } = req.body;
        
        const newTransaction = new Transaction({
            buyer,
            items,
            totalAmount,
            status: status || 'completed',
            timestamp: new Date()
        });
        
        await newTransaction.save();
        
        res.status(201).json(newTransaction);
    } catch (error) {
        console.error('Error adding transaction:', error);
        res.status(500).json({ message: error.message });
    }
}; 