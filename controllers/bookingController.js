// controllers//bookingController.js
const moment = require('moment-timezone'); // To handle time zone normalization
const Booking = require('../models/booking');
const Guest = require('../models/guest');
const AuditLog = require('../models/auditLog');
const Room = require('../models/room');  
const Revenue = require('../models/revenue');
const { Parser } = require('json2csv');
const ExcelJS = require('exceljs');
const pdf = require('html-pdf-node');
const ejs = require('ejs');
const path = require('path');
const fs = require('fs');
const nodemailer = require('nodemailer');  
require('dotenv').config();


// Configure Nodemailer
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// Send Email with EJS Template
const sendEmail = async (recipientEmail, subject, template, data) => {
    try {
        // Define the path to the EJS template
        const templatePath = path.join(__dirname, '../views/emails', `${template}.ejs`);

        // Render the EJS template with the provided data
        const emailContent = await ejs.renderFile(templatePath, data);

        // Define the mail options
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: recipientEmail,
            subject: subject,
            html: emailContent  // Send the rendered HTML as email content
        };

        // Send the email
        await transporter.sendMail(mailOptions);
        console.log(`Email sent to ${recipientEmail} with subject: ${subject}`);
    } catch (error) {
        console.error('Error sending email:', error);
    }
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

        let actionDescription = '';

        switch (status) {
            case 'approved':
                if (booking.status === 'pending') {
                    booking.status = 'approved';
                    await booking.save();
                    await Revenue.addRevenue(booking.roomNumber);
                    sendEmail(booking.guest.email, 'Booking Approved', 'bookingApproved', { 
                        name: booking.guest.name, 
                        roomNumber: booking.roomNumber 
                    });

                    actionDescription = `Approved booking for room ${booking.roomNumber}`;
                }
                break;

            case 'checked-in':
                if (booking.status === 'approved') {
                    booking.status = 'checked-in';
                    await booking.save();
                    actionDescription = `Checked in guest for booking ID ${bookingId}`;
                }
                break;

            case 'completed':
                if (booking.status === 'checked-in') {
                    booking.status = 'completed';
                    await booking.save();
                    actionDescription = `Completed booking for room ${booking.roomNumber}`;
                }
                break;

            case 'cancelled':
            case 'no-show':
                if (['approved', 'checked-in'].includes(booking.status)) {
                    booking.status = status;
                    await booking.save();
                    actionDescription = `Marked booking as ${status} for room ${booking.roomNumber}`;
                }
                break;

            case 'rejected':
                if (booking.status === 'pending') {   
                    sendEmail(booking.guest.email, 'Booking Rejected', 'bookingRejected', { 
                        name: booking.guest.name 
                    });
                    await Booking.findByIdAndDelete(bookingId);
                    actionDescription = `Rejected and deleted booking ID ${bookingId}`;
                }
                break;

            default:
                return res.status(400).send('Invalid status update.');
        }

        // Log the action if a monitor performed it
        if (req.user.role === 'monitor' && actionDescription) {
            await AuditLog.create({
                monitor: req.user.id,  // Extract monitor ID from req.user
                actionType: 'UPDATE_BOOKING',
                description: actionDescription,
            });
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

exports.exportBookingHistoryExcel = async (req, res) => {
    try {
        const bookings = await Booking.find().populate('guest');
        
        // Create a new Excel workbook and worksheet
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Booking History');

        // Define column headers and styles
        worksheet.columns = [
            { header: 'Booking ID', key: '_id', width: 20 },
            { header: 'Guest', key: 'guestName', width: 30 },
            { header: 'Room', key: 'roomNumber', width: 10 },
            { header: 'Check-In', key: 'checkInDate', width: 15 },
            { header: 'Check-Out', key: 'checkOutDate', width: 15 },
            { header: 'Status', key: 'status', width: 15 }
        ];

        // Add rows to the worksheet
        bookings.forEach(booking => {
            worksheet.addRow({
                _id: booking._id.toString().slice(-6),
                guestName: booking.guest.name,
                roomNumber: booking.roomNumber,
                checkInDate: booking.checkInDate.toISOString().split('T')[0],
                checkOutDate: booking.checkOutDate.toISOString().split('T')[0],
                status: booking.status
            });
        });

        // Style the header row
        worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFF' } };
        worksheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF6B6B' } };
        worksheet.getRow(1).alignment = { horizontal: 'center', vertical: 'middle' };

        // Send the file to the client as a download
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename="booking-history.xlsx"');
        await workbook.xlsx.write(res);
        res.end();

    } catch (err) {
        console.error('Error exporting bookings to Excel:', err);
        res.status(500).send('Error exporting data');
    }
};

exports.exportBookingHistoryPDF = async (req, res) => {
    try {
        const bookings = await Booking.find().populate('guest');

        if (!bookings || bookings.length === 0) {
            console.error('No bookings found');
            return res.status(404).send('No booking data available');
        }

        // Render EJS template to HTML
        const templatePath = path.join(__dirname, '../views/bookingHistoryPDF.ejs');
        const htmlContent = await ejs.renderFile(templatePath, { bookings });

        if (!htmlContent || htmlContent.trim() === '') {
            console.error('EJS Template Rendering Error: Empty HTML');
            return res.status(500).send('Error generating PDF content');
        }

        // Create PDF options
        let pdfOptions = { format: 'A4', printBackground: true };

        // Convert HTML to PDF
        pdf.generatePdf({ content: htmlContent }, pdfOptions).then((pdfBuffer) => {
            res.setHeader('Content-Disposition', 'attachment; filename="booking-history.pdf"');
            res.setHeader('Content-Type', 'application/pdf');
            res.send(pdfBuffer);
        }).catch(err => {
            console.error('PDF Generation Error:', err);
            res.status(500).send('Failed to generate PDF');
        });

    } catch (err) {
        console.error('Error generating PDF:', err);
        res.status(500).send('Error generating PDF');
    }
};


// Send Check-in Reminder (1 day before check-in)
exports.sendCheckInReminders = async () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0); // Start of day

    const bookings = await Booking.find({ 
        checkInDate: tomorrow, 
        status: 'approved' 
    }).populate('guest');

    for (let booking of bookings) {
        await sendEmail(
            booking.guest.email,
            'Your Stay is Almost Here!',
            'checkinReminder',
            { name: booking.guest.name, checkInDate: booking.checkInDate }
        );
    }
};

// Send Review Request (1 day after check-out)
exports.sendReviewRequests = async () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0); // Start of day

    const bookings = await Booking.find({ 
        checkOutDate: yesterday, 
        status: 'completed' 
    }).populate('guest');

    for (let booking of bookings) {
        await sendEmail(
            booking.guest.email,
            'Tell Us About Your Stay!',
            'reviewRequest',
            { name: booking.guest.name }
        );
    }
};

// Render booking page with available rooms
exports.renderBookingPage = async (req, res) => {
    try {
        const availableRooms = await Room.find({ available: true });
        res.render('pages/booking', { rooms: availableRooms, message: '', success: false });
    } catch (error) {
        console.error(error);
        res.status(500).send('Error loading booking page');
    }
};


// Handle booking creation (POST request)
exports.createBooking = async (req, res) => {
    try {
        const { guestName, guestEmail, phoneNumber, numOfGuests, roomNumber, checkInDate, checkOutDate, cancellationPolicy } = req.body;

        // Convert dates to UTC
        const normalizedCheckInDate = moment.tz(checkInDate, 'UTC').toDate();
        const normalizedCheckOutDate = moment.tz(checkOutDate, 'UTC').toDate();

        const rooms = await Room.find({ available: true });

        // ❌ Ensure check-out is after check-in
        if (normalizedCheckOutDate <= normalizedCheckInDate) {
            return res.render('pages/booking', { 
                rooms, 
                message: 'Check-out date must be after check-in date.', 
                success: false 
            });
        }

        // ❌ Validate cancellation policy
        if (!cancellationPolicy) {
            return res.render('pages/booking', { 
                rooms, 
                message: 'Please select a cancellation policy.', 
                success: false 
            });
        }

        // ❌ Check for overlapping bookings
        const existingBooking = await Booking.findOne({
            roomNumber: roomNumber,
            checkInDate: { $lt: normalizedCheckOutDate }, 
            checkOutDate: { $gt: normalizedCheckInDate } 
        });

        if (existingBooking) {
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

        // Send email to client informing them about the pending status
        const emailSubject = 'Booking Confirmation - Pending Payment';
        const emailBodyData = {
            guestName,
            roomNumber,
            checkInDate: moment(normalizedCheckInDate).format('YYYY-MM-DD'),
            checkOutDate: moment(normalizedCheckOutDate).format('YYYY-MM-DD')
        };

        // Call the sendEmail function
        await sendEmail(guestEmail, emailSubject, 'bookingPending', emailBodyData);

        res.render('pages/booking', { 
            rooms, 
            message: 'Booking created successfully! Your booking is pending approval until payment is made.', 
            success: true 
        });

    } catch (error) {
        console.error(error);
        const rooms = await Room.find({ available: true });

        res.status(500).render('pages/booking', { 
            rooms, 
            message: 'Error creating booking', 
            success: false 
        });
    }
};
