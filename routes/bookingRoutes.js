// routes/bookingRoutes.js
const express = require('express');
const bookingController = require('../controllers/bookingController');

const router = express.Router();

// Route for rendering booking page
router.get('/', bookingController.renderBookingPage);

// Route for creating a booking (POST request)
router.post('/', bookingController.createBooking);

module.exports = router;
