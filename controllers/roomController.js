const Room = require('../models/room');
const Booking = require('../models/booking');

// Get all available rooms
exports.getAllRooms = async (req, res) => {
    try {
        const rooms = await Room.find({ available: true }); // Show only available rooms
        res.render('pages/admin/manageRooms', { rooms });
    } catch (err) {
        res.status(500).send('Error fetching rooms');
    }
};

// Show the form to create a new room
exports.createRoomForm = (req, res) => {
    res.render('pages/admin/createRoom');
};

// Create a new room
exports.createRoom = async (req, res) => {
    const { roomNumber, capacity, price, available } = req.body;
    try {
        const newRoom = new Room({ roomNumber, capacity, price, available: available === 'on' }); // Handle checkbox for availability
        await newRoom.save();
        res.redirect('/admin/manageRooms');
    } catch (err) {
        res.status(500).send('Error creating room');
    }
};

// Show the form to edit an existing room
exports.editRoomForm = async (req, res) => {
    const roomId = req.params.id;
    try {
        const room = await Room.findById(roomId);
        if (!room) {
            return res.status(404).send('Room not found');
        }
        res.render('pages/admin/editRoom', { room });
    } catch (err) {
        res.status(500).send('Error fetching room details');
    }
};

// Update an existing room
exports.updateRoom = async (req, res) => {
    const roomId = req.params.id;
    const { roomNumber, capacity, price, available } = req.body;
    try {
        await Room.findByIdAndUpdate(roomId, { roomNumber, capacity, price, available: available === 'on' });
        res.redirect('/admin/manageRooms');
    } catch (err) {
        res.status(500).send('Error updating room');
    }
};

// Delete a room
exports.deleteRoom = async (req, res) => {
    const roomId = req.params.id;
    try {
        await Room.findByIdAndDelete(roomId);
        res.redirect('/admin/manageRooms');
    } catch (err) {
        res.status(500).send('Error deleting room');
    }
};

exports.searchAvailableRooms = async (req, res) => {
    const { checkInDate, checkOutDate } = req.query;

    if (!checkInDate || !checkOutDate) {
        return res.status(400).send('Please provide both check-in and check-out dates.');
    }

    try {
        const bookedRoomNumbers = await Booking.getAvailableRooms(new Date(checkInDate), new Date(checkOutDate));

        // Find rooms that are NOT in the bookedRoomNumbers list
        const availableRooms = await Room.find({ roomNumber: { $nin: bookedRoomNumbers } });

        res.render('pages/availableRoom', { availableRooms, checkInDate, checkOutDate });
    } catch (error) {
        console.error(error);
        res.status(500).send('Error searching for available rooms.');
    }
};

exports.getRoomAvailability = async (req, res) => {
    try {
        const { roomNumber, year, month } = req.query;

        if (!roomNumber || !year || !month) {
            return res.status(400).send('Missing parameters');
        }

        // Check if the room exists
        const room = await Room.findOne({ roomNumber });
        if (!room) {
            return res.status(404).send('Room not found');
        }

        // Get available dates for the selected month
        const availableDates = await Booking.getAvailableDates(roomNumber, year, month);

        res.render('pages/roomAvaliability', { roomNumber, availableDates, year, month });
    } catch (error) {
        console.error(error);
        res.status(500).send('Error fetching room availability');
    }
};