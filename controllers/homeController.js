const Room = require('../models/room');

exports.showHomePage = async (req, res) => {
    try {
        const rooms = await Room.find(); 
        res.render('pages/index', { rooms });
    } catch (error) {
        console.error(error);
        res.status(500).send('Error loading home page');
    }
};

exports.showAboutPage = async (req, res) => {
    res.render("pages/about")
}
