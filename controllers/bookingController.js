const Booking = require('../models/booking');
const Guest = require('../models/guest');
const Revenue = require('../models/revenue');
const { Parser } = require('json2csv');
const ExcelJS = require('exceljs');
const pdf = require('html-pdf-node');
const ejs = require('ejs');
const path = require('path');
const fs = require('fs');
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