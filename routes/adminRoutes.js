// /routes/adminRoutes.js
const express = require('express');
const router = express.Router();
const protectRoute = require('../middlewares/authMiddleware');
const { Parser } = require('json2csv');
const PDFDocument = require('pdfkit');
const Booking = require('../models/booking');
const roomController = require('../controllers/roomController');
const bookingController = require('../controllers/bookingController');
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
router.post('/createRoom', protectRoute, roomController.createRoom);

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


// CSV Export Route
router.get('/export-booking-history', async (req, res) => {
    try {
      // Fetch all bookings
      const bookings = await Booking.find();
  
      // Convert bookings to CSV
      const json2csvParser = new Parser();
      const csv = json2csvParser.parse(bookings);
  
      // Send CSV file to the client
      res.header('Content-Type', 'text/csv');
      res.attachment('booking-history.csv');
      res.send(csv);
    } catch (err) {
      console.error('Error exporting bookings to CSV:', err);
      res.status(500).send('Error exporting data');
    }
  });

  // PDF Export Route
router.get('/export-booking-history-pdf', async (req, res) => {
    try {
      const bookings = await Booking.find();
  
      const doc = new PDFDocument();
      res.header('Content-Type', 'application/pdf');
      res.attachment('booking-history.pdf');
  
      doc.pipe(res);
      doc.fontSize(16).text('Booking History', { align: 'center' });
  
      // Add booking details to the PDF
      bookings.forEach(booking => {
        doc.text(`Booking ID: ${booking._id}`);
        doc.text(`Guest Name: ${booking.guestName}`);
        doc.text(`Room Type: ${booking.roomType}`);
        doc.text(`Booking Date: ${booking.bookingDate}`);
        doc.text(`Status: ${booking.status}`);
        doc.text('--------------------------');
      });
  
      doc.end();
    } catch (err) {
      console.error('Error exporting bookings to PDF:', err);
      res.status(500).send('Error exporting data');
    }
  });


  // Approve a single booking
router.post('/approve/:id', async (req, res) => {
  try {
      const bookingId = req.params.id;
      const booking = await Booking.findById(bookingId);

      if (!booking) {
          return res.status(404).json({ message: 'Booking not found' });
      }

      booking.status = 'Confirmed';
      await booking.save();

      // Notify admin if booking is nearing the check-in date
      const checkInDate = moment(booking.checkInDate);
      const daysUntilCheckIn = checkInDate.diff(moment(), 'days');
      
      if (daysUntilCheckIn <= 2) {
          // Send email to admin
          const transporter = nodemailer.createTransport({
              service: 'gmail',
              auth: {
                  user: process.env.EMAIL_USER,
                  pass: process.env.EMAIL_PASS,
              },
          });

          const mailOptions = {
              from: process.env.EMAIL_USER,
              to: process.env.ADMIN_EMAIL,
              subject: `Booking ${bookingId} Approaching Check-In`,
              text: `Booking ID ${bookingId} is nearing its check-in date. Please confirm if not already done.`,
          };

          transporter.sendMail(mailOptions, (error, info) => {
              if (error) {
                  console.log(error);
              } else {
                  console.log('Email sent: ' + info.response);
              }
          });
      }

      res.status(200).json({ message: 'Booking approved', booking });
  } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Error approving booking' });
  }
});

// Reject a single booking
router.post('/reject/:id', async (req, res) => {
  try {
      const bookingId = req.params.id;
      const booking = await Booking.findById(bookingId);

      if (!booking) {
          return res.status(404).json({ message: 'Booking not found' });
      }

      booking.status = 'Rejected';
      await booking.save();

      res.status(200).json({ message: 'Booking rejected', booking });
  } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Error rejecting booking' });
  }
});

// Bulk Approve Bookings
router.post('/bulk-approve', async (req, res) => {
  try {
      const { bookingIds } = req.body;
      
      const bookings = await Booking.updateMany(
          { _id: { $in: bookingIds } },
          { $set: { status: 'Confirmed' } }
      );

      res.status(200).json({ message: `${bookings.modifiedCount} bookings approved` });
  } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Error bulk approving bookings' });
  }
});

// Bulk Reject Bookings
router.post('/bulk-reject', async (req, res) => {
  try {
      const { bookingIds } = req.body;
      
      const bookings = await Booking.updateMany(
          { _id: { $in: bookingIds } },
          { $set: { status: 'Rejected' } }
      );

      res.status(200).json({ message: `${bookings.modifiedCount} bookings rejected` });
  } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Error bulk rejecting bookings' });
  }
});


// Check room availability with caching
router.get('/check-availability/:roomId', async (req, res) => {
  const roomId = req.params.roomId;
  const startDate = req.query.startDate;
  const endDate = req.query.endDate;

  try {
      // Check if availability is cached
      let availability = await getAvailabilityCache(roomId);

      if (availability) {
          console.log('Returning cached availability');
          return res.status(200).json(availability);
      }

      // If no cached data, calculate availability
      const room = await Room.findById(roomId);
      if (!room) {
          return res.status(404).json({ message: 'Room not found' });
      }

      const bookings = await Booking.find({
          roomId,
          $or: [
              { startDate: { $lte: endDate, $gte: startDate } },
              { endDate: { $gte: startDate, $lte: endDate } },
          ],
      });

      // Calculate availability based on the bookings
      const isAvailable = bookings.length === 0;
      const availabilityData = { roomId, isAvailable };

      // Cache the availability result
      setAvailabilityCache(roomId, availabilityData);

      res.status(200).json(availabilityData);
  } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Error checking availability' });
  }
});

router.get('/admin/bookings', async (req, res) => {
  const { status, paymentStatus, specialRequest, dateRange } = req.query;
  let filterCriteria = {};

  if (status) filterCriteria.status = status;
  if (paymentStatus) filterCriteria.paymentStatus = paymentStatus;
  if (specialRequest) filterCriteria.specialRequest = specialRequest;
  if (dateRange) {
    const [startDate, endDate] = dateRange.split(':');
    filterCriteria.bookingDate = { $gte: new Date(startDate), $lte: new Date(endDate) };
  }

  try {
    const bookings = await Booking.find(filterCriteria);
    res.render('admin/bookings', { bookings });
  } catch (err) {
    console.error('Error fetching bookings:', err);
    res.status(500).send('Error fetching bookings');
  }
});



  

module.exports = router;
