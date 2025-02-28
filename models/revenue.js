// models/revenue.js
const mongoose = require('mongoose');

const revenueSchema = new mongoose.Schema({
    totalRevenue: {
        type: Number,
        required: true,
        default: 0,
    }
}, { timestamps: true });

// Function to update revenue when a booking is approved
revenueSchema.statics.addRevenue = async function (roomNumber) {
    const Room = mongoose.model('Room');
    const room = await Room.findOne({ roomNumber });

    if (!room) {
        throw new Error('Room not found');
    }

    const revenueRecord = await this.findOne();

    if (!revenueRecord) {
        // If no revenue record exists, create a new one
        await this.create({ totalRevenue: room.price });
    } else {
        // Increment the revenue
        revenueRecord.totalRevenue += room.price;
        await revenueRecord.save();
    }
};

module.exports = mongoose.model('Revenue', revenueSchema);
