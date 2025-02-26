// /controllers/adminController.js
const Booking = require('../models/booking');
const Room = require('../models/room');
const Revenue = require('../models/revenue');
const AuditLog = require('../models/auditLog');

// Admin Dashboard: Overview with key metrics
const getAdminDashboard = async (req, res) => {
    try {
        const totalBookings = await Booking.countDocuments();
        const totalRevenue = await Revenue.aggregate([
            { $group: { _id: null, total: { $sum: '$amount' } } },
        ]);
        const availableRooms = await Room.countDocuments({ available: true });

        // Fetch some booking data (Example: to get bookingId for the approval form)
        const bookings = await Booking.find({ status: 'pending' });

        res.render('pages/admin/dashboard', {
            totalBookings,
            totalRevenue: totalRevenue[0]?.total || 0,
            availableRooms,
            bookings,  // Pass the bookings array to the view
        });
    } catch (error) {
        console.error(error);
        res.status(500).send('Error fetching dashboard data');
    }
};

// Approve Booking and log action, also add revenue
const approveBooking = async (req, res) => {
    try {
        const bookingId = req.params.id;
        const booking = await Booking.findById(bookingId).populate('room');

        if (!booking) {
            return res.status(404).send('Booking not found');
        }

        booking.status = 'approved';
        await booking.save();

        // Create revenue entry
        const revenue = new Revenue({
            amount: booking.room.price,  // Assuming you want the room price to be the revenue
            booking: bookingId,
        });
        await revenue.save();

        // Log the action in the audit log
        const logMessage = `Booking ${bookingId} approved by admin, revenue recorded: $${booking.room.price}`;
        const log = new AuditLog({
            action: 'Booking Approved',
            message: logMessage,
            admin: req.user.id,
        });

        await log.save();

        res.send('Booking approved and revenue recorded');
    } catch (error) {
        console.error(error);
        res.status(500).send('Error approving booking');
    }
};

module.exports = { getAdminDashboard, approveBooking };
