// /routes/authRoutes.js
const express = require('express');
const router = express.Router();
const authController  = require('../controllers/authController');
const protectRoute = require('../middlewares/authMiddleware')
const Admin = require('../models/admin');


router.get('/register', async (req, res) => {
    const existingAdmin = await Admin.findOne();
    if (existingAdmin) {
        return res.redirect('/auth/login');  
    }
    res.render('pages/register');
});

router.post('/register', authController.adminRegister);


router.get('/login', (req, res) => {
    res.render('pages/login');
});
router.post('/login', authController.adminLogin);

// Admin email verification route
router.get('/verify/:token', authController.verifyAdmin);

router.get('/logout', authController.adminLogout);

router.post('/forgot-password', authController.forgotPassword);
router.get('/forgot-password', (req, res) => {
    res.render('pages/forgot-password');  
});
router.get('/reset-password/:token', (req, res) => {
    res.render('pages/reset-password', { token: req.params.token });
});
router.post('/reset-password/:token', authController.resetPassword);


module.exports = router;
