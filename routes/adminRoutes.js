// /routes/adminRoutes.js
const express = require('express');
const router = express.Router();
const protectRoute = require('../middlewares/authMiddleware');
const { getAdminDashboard, approveBooking } = require('../controllers/adminController');

// Admin Dashboard Route
router.get('/dashboard', protectRoute, getAdminDashboard);

// Approve Booking Route
router.post('/approve-booking/:id', protectRoute, approveBooking);

module.exports = router;
