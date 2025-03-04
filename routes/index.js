const express = require('express');
const router = express.Router();
const homeController = require('../controllers/homeController');

router.get('/', homeController.showHomePage);

router.get('/about', homeController.showAboutPage);

router.get('/gallery', homeController.showGalleryPage);

module.exports = router;
