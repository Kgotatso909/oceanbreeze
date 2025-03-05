// /controllers/adminController.js
const Booking = require('../models/booking');
const Contact = require('../models/contact');
const Room = require('../models/room');
const Revenue = require('../models/revenue');
const AuditLog = require('../models/auditLog');


exports.batchProcessBookings = async (req, res) => {
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



exports.getFilteredBookings = async (req, res) => {
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
exports.getAdminDashboard = async (req, res) => {
    try {
        // Count total bookings
        const totalBookings = await Booking.countDocuments();

        // Fetch total revenue from the Revenue model
        const revenueRecord = await Revenue.findOne();
        const totalRevenue = revenueRecord ? revenueRecord.totalRevenue : 0;

        // Count available rooms
        const availableRooms = await Room.countDocuments({ available: true });

        // Fetch pending bookings for approval
        const bookings = await Booking.find({ status: "pending" }).populate("guest");

        // Count number checked-in guests 
        const totalCheckedin = await Booking.countDocuments({ status: 'checked-in' });

        // Count new (unreplied) messages
        const newMessagesCount = await Contact.countDocuments({ respond: "pending" });

        res.render('pages/admin/dashboard', {
            totalBookings,
            totalRevenue,
            availableRooms,
            bookings,
            newMessagesCount,
            totalCheckedin
        });
    } catch (error) {
        console.error(error);
        res.status(500).send('Error fetching dashboard data');
    }
};

exports.sendBulkEmailNotifications = async (req, res) => {
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


exports.getCheckedInCount = async (req, res) => {
    try {
        const count = await Booking.countDocuments({ status: 'checked-in' });
        res.json({ checkedInGuests: count });
    } catch (error) {
        console.error(error);
        res.status(500).send(error);
    }
};

