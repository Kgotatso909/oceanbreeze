const Booking = require('../models/booking');
const Contact = require('../models/contact');
const Room = require('../models/room');
const Admin = require("../models/admin");
const Revenue = require('../models/revenue');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const AuditLog = require('../models/auditLog');
const moment = require('moment');

// Batch process bookings (approve, reject, update)
exports.batchProcessBookings = async (req, res) => {
    try {
        const { bookingIds, action, status } = req.body;

        if (!Array.isArray(bookingIds) || bookingIds.length === 0) {
            return res.status(400).send('No bookings to process');
        }

        const updateFields = {};
        // Set appropriate status based on action
        if (action === 'approve') updateFields.status = 'approved';
        else if (action === 'reject') updateFields.status = 'rejected';
        else if (action === 'update') {
            if (!status) return res.status(400).send('Status is required for update');
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

// Get filtered bookings based on query parameters
exports.getFilteredBookings = async (req, res) => {
    try {
        const { startDate, endDate, guestName, roomType } = req.query;
        const filters = {};

        if (startDate && endDate) filters.checkInDate = { $gte: new Date(startDate), $lte: new Date(endDate) };
        if (guestName) filters.guestName = { $regex: guestName, $options: 'i' };  // Case insensitive search
        if (roomType) filters.roomType = roomType;

        const bookings = await Booking.find(filters);
        res.json(bookings);
    } catch (error) {
        console.error(error);
        res.status(500).send('Error filtering bookings');
    }
};

// Admin dashboard: Overview with key metrics
exports.getAdminDashboard = async (req, res) => {
    try {
        const totalBookings = await Booking.countDocuments();
        const revenueRecord = await Revenue.findOne();
        const totalRevenue = revenueRecord ? revenueRecord.totalRevenue : 0;
        const availableRooms = await Room.countDocuments({ available: true });
        const bookings = await Booking.find({ status: "pending" }).populate("guest");
        const totalCheckedin = await Booking.countDocuments({ status: 'checked-in' });
        const newMessagesCount = await Contact.countDocuments({ respond: "pending" });

        res.render('pages/admin/dashboard', {
            totalBookings, totalRevenue, availableRooms, bookings, 
            newMessagesCount, totalCheckedin
        });
    } catch (error) {
        console.error(error);
        res.status(500).send('Error fetching dashboard data');
    }
};

// Send bulk email notifications for bookings
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

        const emailMessages = bookings.map((booking) => ({
            to: booking.guestEmail,
            subject: `Booking ${action} Notification`,
            text: `Your booking with ID ${booking._id} has been ${action}.`
        }));

        // Send emails using nodemailer
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });

        for (let message of emailMessages) {
            await transporter.sendMail(message);
        }

        res.send('Bulk email notifications sent successfully');
    } catch (error) {
        console.error(error);
        res.status(500).send('Error sending bulk email notifications');
    }
};

// Get checked-in guest count
exports.getCheckedInCount = async (req, res) => {
    try {
        const count = await Booking.countDocuments({ status: 'checked-in' });
        res.json({ checkedInGuests: count });
    } catch (error) {
        console.error(error);
        res.status(500).send(error);
    }
};

// Create new monitor (admin role with restricted access)
exports.createMonitor = async (req, res) => {
    const { username, email, password } = req.body;

    if (req.user.role !== 'admin') {
        return res.status(403).send('You are not authorized to create new admins.');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newAdmin = new Admin({
        username,
        email,
        password: hashedPassword,
        role: 'monitor',  
        isVerified: true,
    });

    await newAdmin.save();
    res.send('New admin created successfully.');
};

// Render page for creating a new monitor
exports.renderCreateMonitorPage = (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).send('You are not authorized to access this page.');
    }
    res.render('pages/admin/createMonitor', { user: req.user });
};

exports.viewMonitorActions = async (req, res) => {
    try {
        const logs = await AuditLog.find().populate('monitor', 'username').sort({ createdAt: -1 });

        res.render('pages/admin/monitorActions', { logs });
    } catch (error) {
        console.error("Error fetching audit logs:", error);
        res.status(500).send("Internal Server Error");
    }
};


exports.deleteMonitor = async (req, res) => {
    try {
        const monitorId = req.params.id;

        // Find monitor
        const monitor = await Admin.findById(monitorId);
        if (!monitor || monitor.role !== 'monitor') {
            return res.status(404).send("Monitor not found or unauthorized deletion.");
        }

        // Delete monitor
        await Admin.findByIdAndDelete(monitorId)

        res.redirect('/admin/manage-monitors'); // Redirect back to monitor management
    } catch (error) {
        console.error("Error deleting monitor:", error);
        res.status(500).send("Internal Server Error");
    }
};

exports.getMonitors = async (req, res) => {
    try {
        // Find all monitors
        const monitors = await Admin.find({ role: 'monitor' });

        // Render the monitors list page, passing the monitors data
        res.render('pages/admin/manageMonitors', { monitors });
    } catch (error) {
        console.error("Error fetching monitors:", error);
        res.status(500).send("Internal Server Error");
    }
};
