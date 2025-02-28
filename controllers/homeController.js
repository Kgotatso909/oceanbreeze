const Room = require('../models/room');

exports.showHomePage = async (req, res) => {
    try {
        const rooms = await Room.find(); // Fetch all rooms from the database
        res.render('pages/index', { rooms });
    } catch (error) {
        console.error(error);
        res.status(500).send('Error loading home page');
    }
};
