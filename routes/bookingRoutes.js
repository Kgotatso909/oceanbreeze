// routes/bookingRoutes.js
const express = require('express');
const Booking = require('../models/booking');
const Guest = require('../models/guest');
const moment = require('moment-timezone'); // To handle time zone normalization
const nodemailer = require('nodemailer'); // For sending email notifications
const Room = require('../models/room');  // Import the Room model
require('dotenv').config(); // Import environment variables from .env file

const router = express.Router();


// Render booking page with available rooms
router.get('/', async (req, res) => {
    try {
        const allRooms = await Room.find();
        const availableRooms = [];

        for (const room of allRooms) {
            const existingBooking = await Booking.findOne({
                roomNumber: room.roomNumber,
                checkInDate: { $lt: new Date() }, // Prevent bookings in the past
                checkOutDate: { $gt: new Date() }
            });

            if (!existingBooking) {
                availableRooms.push(room);
            }
        }

        res.render('pages/booking', { rooms: availableRooms, message: '', success: false });
    } catch (error) {
        console.error(error);
        res.status(500).send('Error loading booking page');
    }
});

// Route for creating a booking (POST request)
router.post('/', async (req, res) => {
    try {
        const { guestName, guestEmail, phoneNumber, numOfGuests, roomNumber, checkInDate, checkOutDate, cancellationPolicy } = req.body;

        // Convert dates to UTC
        const normalizedCheckInDate = moment.tz(checkInDate, 'UTC').toDate();
        const normalizedCheckOutDate = moment.tz(checkOutDate, 'UTC').toDate();

        // ❌ Ensure check-out is after check-in
        if (normalizedCheckOutDate <= normalizedCheckInDate) {
            const rooms = await Room.find();
            return res.render('pages/booking', { 
                rooms, 
                message: 'Check-out date must be after check-in date.', 
                success: false 
            });
        }

        // ❌ Check for overlapping bookings
        const existingBooking = await Booking.findOne({
            roomNumber: roomNumber,
            $or: [
                { checkInDate: { $lt: normalizedCheckOutDate }, checkOutDate: { $gt: normalizedCheckInDate } }, // Overlaps existing booking
                { checkInDate: { $gte: normalizedCheckInDate, $lt: normalizedCheckOutDate } }, // Starts during existing booking
                { checkOutDate: { $gt: normalizedCheckInDate, $lte: normalizedCheckOutDate } } // Ends during existing booking
            ]
        });

        if (existingBooking) {
            const rooms = await Room.find();
            return res.render('pages/booking', { 
                rooms, 
                message: 'The selected room is already booked for these dates.', 
                success: false 
            });
        }

        // Create guest entry
        const guest = new Guest({ name: guestName, email: guestEmail, phoneNumber, numOfGuests });
        await guest.save();

        // Create new booking
        const newBooking = new Booking({ 
            roomNumber, 
            checkInDate: normalizedCheckInDate, 
            checkOutDate: normalizedCheckOutDate, 
            cancellationPolicy, 
            guest: guest._id 
        });

        await newBooking.save();

        const rooms = await Room.find();
        res.render('pages/booking', { 
            rooms, 
            message: 'Booking created successfully!', 
            success: true 
        });

    } catch (error) {
        console.error(error);
        const rooms = await Room.find();

        res.status(500).render('pages/booking', { 
            rooms, 
            message: 'Error creating booking', 
            success: false 
        });
    }
});

module.exports = router;
