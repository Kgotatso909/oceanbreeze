// /routes/authRoutes.js
const express = require('express');
const router = express.Router();
const { adminRegister, adminLogin, verifyAdmin } = require('../controllers/authController');
const protectRoute = require('../middlewares/authMiddleware');

// Admin registration route
router.get('/register', (req, res) => {
    res.render('pages/register');
});
router.post('/register', adminRegister);

// Admin login route
router.get('/login', (req, res) => {
    res.render('pages/login');
});
router.post('/login', adminLogin);

// Admin email verification route
router.get('/verify/:token', verifyAdmin);

module.exports = router;
