const express = require('express');
const Booking = require('../models/booking');
const Guest = require('../models/guest');
const moment = require('moment-timezone'); // To handle time zone normalization
const nodemailer = require('nodemailer'); // For sending email notifications
require('dotenv').config(); // Import environment variables from .env file

const router = express.Router();

// Route for creating a booking (POST request)
router.post('/', async (req, res) => {
    try {
        const { guestName, guestEmail, phoneNumber, numOfGuests, roomNumber, checkInDate, checkOutDate, cancellationPolicy } = req.body;

        // Normalize the dates to UTC (you can adjust this to the guest's time zone if needed)
        const normalizedCheckInDate = moment.tz(checkInDate, 'UTC').toDate();
        const normalizedCheckOutDate = moment.tz(checkOutDate, 'UTC').toDate();

        // Check for date conflicts (ensure room availability)
        const existingBooking = await Booking.checkDateConflict(roomNumber, normalizedCheckInDate, normalizedCheckOutDate);

        if (existingBooking) {
            return res.status(400).json({ message: 'The room is already booked for the selected dates.' });
        }

        // Create a new guest entry in the database
        const guest = new Guest({
            name: guestName,
            email: guestEmail,
            phoneNumber: phoneNumber,
            numOfGuests: numOfGuests
        });

        await guest.save();

        // Create new booking entry in the database
        const newBooking = new Booking({
            roomNumber,
            checkInDate: normalizedCheckInDate,
            checkOutDate: normalizedCheckOutDate,
            cancellationPolicy,
            guest: guest._id // Reference to the guest model
        });

        await newBooking.save();

        // Create a transporter for email (you can use your preferred email service)
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
            to: guestEmail, // recipient (from form)
            subject: 'Booking Confirmation',
            text: `Dear ${guestName},\n\nYour booking for room number ${roomNumber} has been received pending payment. You are booked from ${checkInDate} to ${checkOutDate}.\n\nCancellation Policy: ${cancellationPolicy}`
        };

        await transporter.sendMail(mailOptions);

        // After success, render the confirmation page or send a success response
        res.render('pages/booking', { message: 'Booking created successfully!', success: true });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error creating booking' });
    }
});

module.exports = router;
