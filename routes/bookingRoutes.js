// routes/bookingRoutes.js
const express = require('express');
const Booking = require('../models/booking');
const moment = require('moment-timezone'); // To handle time zone normalization
const nodemailer = require('nodemailer'); // For sending email notifications
const { setAvailabilityCache, getAvailabilityCache } = require('../utils/cache');
require('dotenv').config(); // Import environment variables from .env file

const router = express.Router();

// Serve the booking form page

// Create a booking
router.post('/create', async (req, res) => {
    try {
        const { guestName, roomType, checkInDate, checkOutDate, cancellationPolicy } = req.body;

        // Normalize the dates to UTC (you can adjust this to the guest's time zone if needed)
        const normalizedCheckInDate = moment.tz(checkInDate, 'UTC').toDate();
        const normalizedCheckOutDate = moment.tz(checkOutDate, 'UTC').toDate();

        // Check for date conflicts (ensure room availability)
        const existingBooking = await Booking.checkDateConflict(roomType, normalizedCheckInDate, normalizedCheckOutDate);

        if (existingBooking) {
            return res.status(400).json({ message: 'The room is already booked for the selected dates.' });
        }

        // Create new booking
        const newBooking = new Booking({
            guestName,
            roomType,
            checkInDate: normalizedCheckInDate,
            checkOutDate: normalizedCheckOutDate,
            cancellationPolicy,
        });

        await newBooking.save();

        // Create a transporter for email
       const transporter = nodemailer.createTransport({
              service: 'gmail',
              auth: {
                  user: process.env.EMAIL_USER,
                  pass: process.env.EMAIL_PASS
              }
        });

        // Send a booking confirmation email
        const mailOptions = {
            from: process.env.EMAIL_USER, // sender address (from .env)
            to: req.body.guestEmail, // recipient (from form)
            subject: 'Booking Confirmation',
            text: `Dear ${guestName},\n\nYour booking has been confirmed for ${roomType} from ${checkInDate} to ${checkOutDate}.`
        };

        await transporter.sendMail(mailOptions);

        // After success, render the confirmation page
        res.render('pages/booking', { message: 'Booking created successfully!', success: true });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error creating booking' });
    }
});

module.exports = router;
