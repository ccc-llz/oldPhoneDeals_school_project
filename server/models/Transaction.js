const mongoose = require('./db');

const TransactionSchema = new mongoose.Schema(
  {
    buyer: {
      type: String,
      ref: 'User',
      required: true
    },
    items: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'phonelisting'
        },
        title: String,
        price: Number,
        quantity: {
          type: Number,
          required: true,
          min: 1
        }
      }
    ],
    totalAmount: {
      type: Number,
      required: true,
      min: 0
    },
    status: {
      type: String,
      enum: ['pending', 'completed', 'cancelled'],
      default: 'completed'
    },
    timestamp: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true // Add createdAt and updatedAt fields
  }
);

const Transaction = mongoose.model('Transaction', TransactionSchema);

module.exports = Transaction; 