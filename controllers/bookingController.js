const Booking = require('../models/booking');
const Guest = require('../models/guest');
const Revenue = require('../models/revenue');
const { Parser } = require('json2csv');
const PDFDocument = require('pdfkit');
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


// Export Booking History as CSV
exports.exportBookingHistoryCSV = async (req, res) => {
    try {
        const bookings = await Booking.find().populate('guest');

        // Convert bookings to CSV
        const fields = ['_id', 'guest.name', 'roomNumber', 'checkInDate', 'checkOutDate', 'status'];
        const json2csvParser = new Parser({ fields });
        const csv = json2csvParser.parse(bookings);

        res.header('Content-Type', 'text/csv');
        res.attachment('booking-history.csv');
        res.send(csv);
    } catch (err) {
        console.error('Error exporting bookings to CSV:', err);
        res.status(500).send('Error exporting data');
    }
};

// Export Booking History as PDF
exports.exportBookingHistoryPDF = async (req, res) => {
    try {
        const bookings = await Booking.find().populate('guest');

        const doc = new PDFDocument({ margin: 30 });
        res.header('Content-Type', 'application/pdf');
        res.attachment('booking-history.pdf');

        doc.pipe(res);

        // Header Styling
        doc.fontSize(18).text('Booking History Report', { align: 'center' });
        doc.moveDown(2);

        // Table Header
        doc
            .fontSize(12)
            .text('Booking ID', 50, doc.y, { continued: true })
            .text('Guest', 180, doc.y, { continued: true })
            .text('Room', 280, doc.y, { continued: true })
            .text('Check-In', 350, doc.y, { continued: true })
            .text('Check-Out', 420, doc.y, { continued: true })
            .text('Status', 500);
        doc.moveDown(0.5);
        doc.strokeColor('#000').lineWidth(1).moveTo(50, doc.y).lineTo(550, doc.y).stroke();
        doc.moveDown(0.5);

        // Table Rows
        bookings.forEach(booking => {
            doc
                .fontSize(10)
                .text(booking._id.toString().slice(-6), 50, doc.y, { continued: true })
                .text(booking.guest.name, 180, doc.y, { continued: true })
                .text(booking.roomNumber.toString(), 280, doc.y, { continued: true })
                .text(booking.checkInDate.toISOString().split('T')[0], 350, doc.y, { continued: true })
                .text(booking.checkOutDate.toISOString().split('T')[0], 420, doc.y, { continued: true })
                .text(booking.status, 500);
            doc.moveDown(0.5);
        });

        doc.end();
    } catch (err) {
        console.error('Error exporting bookings to PDF:', err);
        res.status(500).send('Error exporting data');
    }
};