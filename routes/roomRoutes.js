const express = require('express');
const router = express.Router();
const roomController = require('../controllers/roomController');

router.get('/search-rooms', roomController.searchAvailableRooms);

router.get('/availability', roomController.getRoomAvailability);

module.exports = router;
