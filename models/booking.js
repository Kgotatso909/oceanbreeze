// models/booking.js
const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
    roomNumber: {
        type: Number,
        required: true
    },
    numOfGuest: {
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
        default: 'non-refundable' // Ensured lowercase to match the enum
    },
}, {
    timestamps: true
});

// Method to check for date conflicts
bookingSchema.statics.checkDateConflict = async function (roomNumber, checkInDate, checkOutDate) {
    const conflictingBooking = await this.findOne({
        roomNumber: roomNumber,
        checkInDate: { $lt: checkOutDate },  // Overlapping dates
        checkOutDate: { $gt: checkInDate }
    });

    return conflictingBooking;
};

module.exports = mongoose.model('Booking', bookingSchema);
