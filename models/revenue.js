// /models/revenue.js
const mongoose = require('mongoose');

const revenueSchema = new mongoose.Schema({
    amount: {
        type: Number,
        required: true,
    },
    booking: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Booking',
        required: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

module.exports = mongoose.model('Revenue', revenueSchema);
