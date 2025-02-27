// /controllers/adminController.js
const Booking = require('../models/booking');
const Room = require('../models/room');
const Revenue = require('../models/revenue');
const AuditLog = require('../models/auditLog');


const batchProcessBookings = async (req, res) => {
    try {
        const { bookingIds, action, status } = req.body;

        if (!Array.isArray(bookingIds) || bookingIds.length === 0) {
            return res.status(400).send('No bookings to process');
        }

        const updateFields = {};

        // Determine the action and set the appropriate field(s)
        if (action === 'approve') {
            updateFields.status = 'approved';
        } else if (action === 'reject') {
            updateFields.status = 'rejected';
        } else if (action === 'update') {
            if (!status) {
                return res.status(400).send('Status is required for update');
            }
            updateFields.status = status;
        } else {
            return res.status(400).send('Invalid action');
        }

        const result = await Booking.updateMany(
            { _id: { $in: bookingIds } },
            { $set: updateFields }
        );

        res.send(`Successfully processed ${result.nModified} bookings.`);
    } catch (error) {
        console.error(error);
        res.status(500).send('Error processing bookings');
    }
};



const getFilteredBookings = async (req, res) => {
    try {
        const { startDate, endDate, guestName, roomType } = req.query;
        const filters = {};

        // Build filter object based on the query parameters
        if (startDate && endDate) {
            filters.checkInDate = { $gte: new Date(startDate), $lte: new Date(endDate) };
        }

        if (guestName) {
            filters.guestName = { $regex: guestName, $options: 'i' };  // Case insensitive search
        }

        if (roomType) {
            filters.roomType = roomType;
        }

        const bookings = await Booking.find(filters);
        res.json(bookings);
    } catch (error) {
        console.error(error);
        res.status(500).send('Error filtering bookings');
    }
};

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

const sendBulkEmailNotifications = async (req, res) => {
    try {
        const { bookingIds, action } = req.body;
        
        if (!Array.isArray(bookingIds) || bookingIds.length === 0) {
            return res.status(400).send('No bookings to send notifications for');
        }

        const bookings = await Booking.find({ _id: { $in: bookingIds } });

        if (!bookings.length) {
            return res.status(404).send('No bookings found');
        }

        const emailMessages = bookings.map((booking) => {
            return {
                to: booking.guestEmail,
                subject: `Booking ${action} Notification`,
                text: `Your booking with ID ${booking._id} has been ${action}.`
            };
        });

        // Set up a transport method for nodemailer
        const transporter = nodemailer.createTransport({
            service: 'gmail',  // Example service
            auth: {
                user: process.env.EMAIL_USER,  // Use an environment variable for email credentials
                pass: process.env.EMAIL_PASS
            }
        });

        // Send emails
        for (let message of emailMessages) {
            await transporter.sendMail(message);
        }

        res.send('Bulk email notifications sent successfully');
    } catch (error) {
        console.error(error);
        res.status(500).send('Error sending bulk email notifications');
    }
};


module.exports = { getAdminDashboard, approveBooking, getFilteredBookings, batchProcessBookings, sendBulkEmailNotifications };
