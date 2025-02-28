//models/booking.js
const mongoose = require('mongoose');
const Guest = require('./guest');  // Import the guest model

const bookingSchema = new mongoose.Schema({
    roomNumber: {
        type: Number,
        required: true
    },
    checkInDate: {
        type: Date,
        required: true
    },
    checkOutDate: {
        type: Date,
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected', 'completed', 'cancelled', 'no-show'],
        default: 'pending'
    },
    cancellationPolicy: {
        type: String,
        enum: ['refundable', 'non-refundable'],
        default: 'non-refundable'
    },
    guest: { 
        type: mongoose.Schema.Types.ObjectId,
        ref: Guest, 
        required: true
    }
}, {
    timestamps: true
});

bookingSchema.statics.checkDateConflict = async function (roomNumber, checkInDate, checkOutDate) {
    const conflictingBooking = await this.findOne({
        roomNumber: roomNumber,
        status: { $ne: 'pending' }, // Ignore "pending" bookings
        $or: [
            { checkInDate: { $lt: checkOutDate }, checkOutDate: { $gt: checkInDate } }, // Full overlap
            { checkInDate: { $gte: checkInDate, $lt: checkOutDate } }, // Starts during existing booking
            { checkOutDate: { $gt: checkInDate, $lte: checkOutDate } }, // Ends during existing booking
        ]
    });

    return conflictingBooking;
};


bookingSchema.statics.getAvailableRooms = async function (checkInDate, checkOutDate) {
    // Find room numbers that are booked and approved within the given date range
    const bookedRoomNumbers = await this.distinct('roomNumber', {
        status: 'approved',
        $or: [
            { checkInDate: { $lt: checkOutDate }, checkOutDate: { $gt: checkInDate } }, // Full overlap
            { checkInDate: { $gte: checkInDate, $lt: checkOutDate } }, // Starts during existing booking
            { checkOutDate: { $gt: checkInDate, $lte: checkOutDate } }, // Ends during existing booking
        ],
    });

    return bookedRoomNumbers;
};


module.exports = mongoose.model('Booking', bookingSchema);
