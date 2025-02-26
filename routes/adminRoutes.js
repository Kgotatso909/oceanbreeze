// /routes/adminRoutes.js
const express = require('express');
const router = express.Router();
const { adminRegister, adminLogin, verifyAdmin } = require('../controllers/adminController');
const protectRoute = require('../middlewares/authMiddleware');

// Admin registration route
router.get('/register', (req, res) => {
    res.render('pages/admin/register');
});
router.post('/register', adminRegister);

// Admin login route
router.get('/login', (req, res) => {
    res.render('pages/admin/login');
});
router.post('/login', adminLogin);

// Admin email verification route
router.get('/verify/:token', verifyAdmin);

// Protected route (only accessible if the user is logged in and authenticated)
router.get('/dashboard', protectRoute, (req, res) => {
    res.render('pages/admin/dashboard'); // Make sure this page exists and is correctly set up
});

module.exports = router;
