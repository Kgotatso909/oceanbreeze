const express = require('express');
const router = express.Router();
const contactController = require('../controllers/contactController');

// Route to handle contact form submission
router.post('/contact', contactController.submitContactForm);
router.get('/contact', contactController.contactPage);

module.exports = router;
