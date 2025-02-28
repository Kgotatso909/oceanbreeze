const Booking = require('../models/booking');
const Guest = require('../models/guest');
const Revenue = require('../models/revenue');
const nodemailer = require('nodemailer');  // For email sending functionality

// Helper function for sending email
const sendEmail = async (email, subject, text) => {
    let transporter = nodemailer.createTransport({
        service: 'gmail', // Example
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    });

    let info = await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: email,
        subject: subject,
        text: text
    });

    return info;
};

exports.manageBookings = async (req, res) => {
    try {
        const bookings = await Booking.find().populate('guest');
        res.render('pages/admin/manageBookings', { bookings });
    } catch (error) {
        res.status(500).send(error);
    }
};

exports.updateBooking = async (req, res) => {
    const bookingId = req.params.id;
    const status = req.body.status;

    try {
        const booking = await Booking.findById(bookingId).populate('guest');

        if (!booking) {
            return res.status(404).send('Booking not found');
        }

        // Handle status updates
        if (booking.status !== 'approved' && status === 'approved') {
            booking.status = 'approved';
            await booking.save();

            await Revenue.addRevenue(booking.roomNumber);

            // Send approval email
            sendEmail(booking.guest.email, 'Booking Approved', 'Your booking has been approved.');
        } else if (status === 'rejected') {
            booking.status = 'rejected';
            await booking.save();

            // Send rejection email
            sendEmail(booking.guest.email, 'Booking Rejected', 'Your booking has been rejected.');
        } else if (['completed', 'cancelled', 'no-show'].includes(status)) {
            booking.status = status;
            await booking.save();
        }

        res.redirect('/admin/manage-bookings');
    } catch (error) {
        console.error(error);
        res.status(500).send(error);
    }
};

exports.viewBookings = async (req, res) => {
    const booking = await Booking.findById(req.params.id).populate('guest');
    res.render('pages/admin/updateBooking', { booking });

}