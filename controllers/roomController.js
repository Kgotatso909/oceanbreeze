const Room = require('../models/room');
const Booking = require('../models/booking');
const AuditLog = require('../models/auditLog');

// Get all available rooms
exports.getAllRooms = async (req, res) => {
    try {
        const rooms = await Room.find(); 
        res.render('pages/admin/manageRooms', { rooms });
    } catch (err) {
        res.status(500).send('Error fetching rooms');
    }
};

// Show the form to create a new room
exports.createRoomForm = (req, res) => {
    res.render('pages/admin/createRoom');
};


exports.createRoom = async (req, res) => {
    try {
        const { roomNumber, capacity, price, roomType, description, available } = req.body;
        const images = req.files.map(file => `/images/upload/${file.filename}`);

        const newRoom = new Room({
            roomNumber,
            capacity,
            price,
            roomType,
            description,
            available: available === 'on', // Handle checkbox value
            images
        });

        await newRoom.save();

        // Log the action if a monitor performed it
        if (req.user.role === 'monitor') {
            await AuditLog.create({
                monitor: req.user.id,
                actionType: 'CREATE_ROOM',
                description: `Created room ${roomNumber}`,
            });
        }

        res.redirect('/admin/manageRooms');
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.updateRoom = async (req, res) => {
    try {
        const roomId = req.params.id;
        const { roomNumber, capacity, price, roomType, description, available } = req.body;
        const availableBool = available === "true";

        let updateData = {
            roomNumber,
            capacity,
            price,
            roomType,
            description,
            available: availableBool
        };

        if (req.files && req.files.length > 0) {
            updateData.images = req.files.map(file => `/images/upload/${file.filename}`);
        }

        const updatedRoom = await Room.findByIdAndUpdate(
            roomId,
            updateData,
            { new: true, runValidators: true }
        );

        if (!updatedRoom) {
            return res.status(404).json({ error: "Room not found" });
        }

        // Log the action if a monitor performed it
        if (req.user.role === 'monitor') {
            await AuditLog.create({
                monitor: req.user.id,
                actionType: 'UPDATE_ROOM',
                description: `Updated room ${roomNumber}`,
            });
        }

        res.redirect('/admin/manageRooms');
    } catch (error) {
        console.error("Error updating room:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

exports.deleteRoom = async (req, res) => {
    const roomId = req.params.id;
    try {
        const deletedRoom = await Room.findByIdAndDelete(roomId);

        if (!deletedRoom) {
            return res.status(404).json({ error: "Room not found" });
        }

        // Log the action if a monitor performed it
        if (req.user.role === 'monitor') {
            await AuditLog.create({
                monitor: req.user.id,
                actionType: 'DELETE_ROOM',
                description: `Deleted room ${deletedRoom.roomNumber}`,
            });
        }

        res.redirect('/admin/manageRooms');
    } catch (err) {
        res.status(500).send('Error deleting room');
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

        // Get all bookings for the selected room in the given month
        const bookings = await Booking.find({
            roomNumber,
            checkIn: { $gte: new Date(year, month - 1, 1) },
            checkOut: { $lt: new Date(year, month, 1) }
        });

        // Get unavailable dates (dates where bookings overlap with the requested month)
        const unavailableDates = bookings.map(booking => {
            const dateRange = getDateRange(booking.checkIn, booking.checkOut);
            return dateRange;
        }).flat();

        // Render the room availability page
        res.render('pages/roomAvaliability', { roomNumber, availableDates, unavailableDates, year, month });
    } catch (error) {
        console.error(error);
        res.status(500).send('Error fetching room availability');
    }
};

// Helper function to generate an array of dates between checkIn and checkOut
function getDateRange(checkIn, checkOut) {
    let dates = [];
    let currentDate = new Date(checkIn);
    while (currentDate < checkOut) {
        dates.push(currentDate.toISOString().split('T')[0]); // Get date in YYYY-MM-DD format
        currentDate.setDate(currentDate.getDate() + 1);
    }
    return dates;
}
