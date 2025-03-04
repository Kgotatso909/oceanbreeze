// models/room.js
const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
    roomNumber: {
        type: Number,
        required: true,
        unique: true,  
    },
    capacity: {
        type: Number,
        required: true,
    },
    price: {
        type: Number,
        required: true,
        min: 0,  // Ensure price is a positive number
    },
    available: {
        type: Boolean,
        default: true,
    },
    roomType: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
    images: [{
        type: String, // Store image paths
        required: true,
    }],
}, { timestamps: true });

module.exports = mongoose.model('Room', roomSchema);
