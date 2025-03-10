const express = require('express');
const router = express.Router();
const { protectRoute, setUserLocals } = require('../middlewares/authMiddleware');
const Booking = require('../models/booking');
const roomController = require('../controllers/roomController');
const bookingController = require('../controllers/bookingController');
const contactController = require('../controllers/contactController');
const newsletterController = require('../controllers/newsletterController');
const emailController = require('../controllers/emailController');
const upload = require('../middlewares/upload');
const adminController = require('../controllers/adminController');
const moment = require('moment');

// Apply middlewares for all routes
router.use(protectRoute, setUserLocals);

// Manage bookings
router.get('/manage-bookings', bookingController.manageBookings);
router.get('/update-booking/:id', bookingController.viewBookings);
router.post('/update-booking/:id', bookingController.updateBooking);


// Manage rooms
router.get('/manageRooms', roomController.getAllRooms);
router.get('/createRoom', roomController.createRoomForm);
router.post('/createRoom', upload.array('images', 5), roomController.createRoom);
router.get('/editRoom/:id', roomController.editRoomForm);
router.post('/editRoom/:id', upload.array('images', 5), roomController.updateRoom);
router.post('/deleteRoom/:id', roomController.deleteRoom);

// Admin Dashboard
router.get('/dashboard', adminController.getAdminDashboard);
router.get('/bookings/filter', adminController.getFilteredBookings);
router.post('/bookings/batch-process', adminController.batchProcessBookings);
router.post('/bookings/send-notifications', adminController.sendBulkEmailNotifications);
router.get('/monitor-actions', adminController.viewMonitorActions);
router.post('/delete-monitor/:id', adminController.deleteMonitor);
router.get('/manage-monitors', adminController.getMonitors);

// Newsletter routes
router.post('/subscribe', newsletterController.subscribe);
router.post('/send-newsletter', newsletterController.sendNewsletter);
router.get('/send-newsletter', newsletterController.renderNewsletterPage);

// Export booking history
router.get('/export-booking-history-csv', bookingController.exportBookingHistoryCSV);
router.get('/export-booking-history-excel', bookingController.exportBookingHistoryExcel);
router.get('/export-booking-history-pdf', bookingController.exportBookingHistoryPDF);

// Email routes
router.get('/send-email', (req, res) => {
    res.render('pages/admin/sendEmail', { success: req.query.success, error: req.query.error });
});
router.post('/send-email', emailController.sendEmail);

// Contact messages
router.get('/messages', contactController.getMessages);
router.post('/messages/reply', contactController.markAsReplied);

// Admin monitor creation
router.post('/create-monitor', adminController.createMonitor);
router.get('/create-monitor', adminController.renderCreateMonitorPage);


module.exports = router;
