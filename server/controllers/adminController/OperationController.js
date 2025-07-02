const AdminLog = require('../../models/AdminLog');
const { logAdminAction } = require('../../utils/adminOperationLog');

// get all operations
exports.getAllOperations = async (req, res) => {
    try {
        const {
        page = 1,
        limit = 20,
        action,
        target,
        startDate,
        endDate,
        sort
        } = req.query;

        const query = {};

        if (action) {
        query.action = action;
        }

        if (target) {
        query.targetType = target;
        }

        if (startDate && endDate) {
          // If startDate and endDate are the same (single day selected)
          if (startDate === endDate) {
            const selectedDate = new Date(startDate);
            const nextDay = new Date(selectedDate);
            nextDay.setDate(selectedDate.getDate() + 1);
            
            query.timestamp = {
              $gte: selectedDate,
              $lt: nextDay
            };
            console.log(`Filtering by single date: ${startDate}`);
          } else {
            // Handle date range as before
            const endDateObj = new Date(endDate);
            // Add one day to end date to make it inclusive of the full end date
            endDateObj.setDate(endDateObj.getDate() + 1);
            
            query.timestamp = {
              $gte: new Date(startDate),
              $lt: endDateObj
            };
            console.log(`Filtering by date range: ${startDate} to ${endDate}`);
          }
        }

        // Build sort object based on sort parameter
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

        const total = await AdminLog.countDocuments(query);
        const operations = await AdminLog.find(query)
        .sort(sortObj)
        .skip((page - 1) * limit)
        .limit(Number(limit));

        res.json({
        operations,
        total,
        page: Number(page),
        limit: Number(limit)
        });
    } catch (error) {
        console.error('[AdminLog] Failed to fetch logs:', error);
        res.status(500).json({ message: 'Failed to retrieve admin logs' });
    }
};

// log a custom action
exports.logAction = async (req, res) => {
    try {
        const { action, targetType, targetId, details } = req.body;
        
        console.log('Logging custom action:', { action, targetType, targetId });
        
        // Validate required fields
        if (!action || !targetType) {
            return res.status(400).json({ message: 'Missing required fields: action and targetType are required' });
        }
        
        // Log the action using the existing utility
        await logAdminAction(req, action, targetType, targetId, details || {});
        
        res.status(200).json({ message: 'Action logged successfully' });
    } catch (error) {
        console.error('Error logging action:', error);
        res.status(500).json({ message: 'Failed to log action' });
    }
};