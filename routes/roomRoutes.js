const express = require('express');
const router = express.Router();
const roomController = require('../controllers/roomController');

router.get('/search-rooms', roomController.searchAvailableRooms);

module.exports = router;
