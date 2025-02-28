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


bookingSchema.statics.getRoomAvailability = async function (roomNumber) {
    const bookings = await this.find({ 
        roomNumber, 
        status: 'approved' 
    }, { checkInDate: 1, checkOutDate: 1, _id: 0 });

    let bookedDates = [];
    bookings.forEach(booking => {
        let currentDate = new Date(booking.checkInDate);
        while (currentDate <= booking.checkOutDate) {
            bookedDates.push(new Date(currentDate)); // Store booked date
            currentDate.setDate(currentDate.getDate() + 1);
        }
    });

    return bookedDates;
};

bookingSchema.statics.getAvailableDates = async function (roomNumber, year, month) {
    const startOfMonth = new Date(year, month - 1, 1);
    const endOfMonth = new Date(year, month, 0);

    // Fetch bookings for the given room in the selected month
    const bookings = await this.find({
        roomNumber: roomNumber,
        status: 'approved',
        checkInDate: { $lte: endOfMonth },
        checkOutDate: { $gte: startOfMonth }
    });

    // Create an array of all booked days
    const bookedDays = new Set();
    bookings.forEach(booking => {
        let currentDate = new Date(booking.checkInDate);
        while (currentDate <= booking.checkOutDate) {
            bookedDays.add(currentDate.toISOString().split('T')[0]); // Store as YYYY-MM-DD
            currentDate.setDate(currentDate.getDate() + 1);
        }
    });

    // Generate an array of all days in the selected month
    const availableDays = [];
    for (let day = 1; day <= endOfMonth.getDate(); day++) {
        const dateStr = new Date(year, month - 1, day).toISOString().split('T')[0];
        if (!bookedDays.has(dateStr)) {
            availableDays.push(dateStr);
        }
    }

    return availableDays;
};


module.exports = mongoose.model('Booking', bookingSchema);
