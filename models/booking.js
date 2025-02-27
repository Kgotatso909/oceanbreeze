// models/booking.js
const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
    guestName: {
        type: String,
        required: true
    },
    roomType: {
        type: String,
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
        enum: ['Pending', 'approved', 'rejected', 'Completed', 'Cancelled', 'No-show'],
        default: 'Pending'
    },
    cancellationPolicy: {
        type: String,
        enum: ['refundable', 'non-refundable'],
        default: 'Non-refundable' // Default to non-refundable
    },
    // Add other fields like payment status, guest info, etc.
}, {
    timestamps: true
});

// Method to check for date conflicts
bookingSchema.statics.checkDateConflict = async function (roomType, checkInDate, checkOutDate) {
    const conflictingBooking = await this.findOne({
        roomType: roomType,
        $or: [
            { checkInDate: { $lt: checkOutDate }, checkOutDate: { $gt: checkInDate } },  // Overlapping dates
            { checkInDate: { $gte: checkInDate, $lt: checkOutDate } },
            { checkOutDate: { $gt: checkInDate, $lte: checkOutDate } }
        ]
    });

    return conflictingBooking;
};

module.exports = mongoose.model('Booking', bookingSchema);
