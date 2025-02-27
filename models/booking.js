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
        ref: 'Guest', // Reference to the guest model
        required: true
    }
}, {
    timestamps: true
});

bookingSchema.statics.checkDateConflict = async function (roomNumber, checkInDate, checkOutDate) {
    const conflictingBooking = await this.findOne({
        roomNumber: roomNumber,
        checkInDate: { $lt: checkOutDate },
        checkOutDate: { $gt: checkInDate }
    });

    return conflictingBooking;
};

module.exports = mongoose.model('Booking', bookingSchema);
