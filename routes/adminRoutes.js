// /routes/adminRoutes.js
const express = require('express');
const router = express.Router();
const protectRoute = require('../middlewares/authMiddleware');
const { Parser } = require('json2csv');
const PDFDocument = require('pdfkit');
const Booking = require('../models/booking');
const roomController = require('../controllers/roomController');
const bookingController = require('../controllers/bookingController');
const newsletterController = require('../controllers/newsletterController');
const emailController = require('../controllers/emailController');
const upload = require('../middlewares/upload');
const { getAdminDashboard, getFilteredBookings, batchProcessBookings, sendBulkEmailNotifications } = require('../controllers/adminController');

// Manage bookings (list)
router.get('/manage-bookings', protectRoute, bookingController.manageBookings);

// Update booking status
router.get('/update-booking/:id', protectRoute, bookingController.viewBookings);

router.post('/update-booking/:id', protectRoute, bookingController.updateBooking);

// Route to display all rooms
router.get('/manageRooms', protectRoute, roomController.getAllRooms);

// Route to show the form for creating a new room
router.get('/createRoom', protectRoute, roomController.createRoomForm);

// Route to handle creating a new room
router.post('/createRoom', upload.array('images', 5), roomController.createRoom);

// Route to show the form for editing a room
router.get('/editRoom/:id', protectRoute, roomController.editRoomForm);

// Route to handle updating an existing room
router.post('/editRoom/:id', protectRoute, roomController.updateRoom);

// Route to handle deleting a room
router.post('/deleteRoom/:id', protectRoute, roomController.deleteRoom);

// Admin Dashboard Route
router.get('/dashboard', protectRoute, getAdminDashboard);

router.get('/bookings/filter', getFilteredBookings);

router.post('/bookings/batch-process', batchProcessBookings);

// Bulk email notification route
router.post('/bookings/send-notifications', sendBulkEmailNotifications);

router.post('/subscribe', newsletterController.subscribe);
router.post('/send-newsletter', newsletterController.sendNewsletter);
router.get('/send-newsletter', newsletterController.renderNewsletterPage);

// Export Booking History (CSV)
router.get('/export-booking-history', bookingController.exportBookingHistoryCSV);

// Export Booking History (PDF)
router.get('/export-booking-history-pdf', bookingController.exportBookingHistoryPDF);

// Render email sending page
router.get('/send-email', (req, res) => {
    res.render('pages/admin/sendEmail', { success: req.query.success, error: req.query.error });
});

// Handle email sending
router.post('/send-email', emailController.sendEmail);

module.exports = router;
