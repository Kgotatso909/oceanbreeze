const express = require('express');
const router = express.Router();
const protectRoute = require('../middlewares/authMiddleware');

router.get('/dashboard', protectRoute, (req, res) => {
    res.render('pages/admin/dashboard'); // Make sure this page exists and is correctly set up
});

module.exports = router;
