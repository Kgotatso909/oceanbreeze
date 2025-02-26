// /config/database.js

const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load environment variables from .env file
dotenv.config();

// MongoDB connection string from .env
const mongoURI = process.env.MONGODB_URI;

// Set Mongoose options for connection, retry mechanism, and read/write preferences
const options = {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 5000, // Timeout for selecting the server
    socketTimeoutMS: 45000, // Timeout for socket connections
    retryWrites: true, // Enable retryable writes
    w: "majority", // Write concern to ensure data is written to the majority of replica set members
    readPreference: "primaryPreferred", // Ensure reads happen from the primary replica set member
};

// Retry mechanism to handle failed connections
const connectDB = async () => {
    try {
        await mongoose.connect(mongoURI, options);
        console.log('MongoDB connected successfully');
    } catch (error) {
        console.error('MongoDB connection error:', error.message);
        process.exit(1); // Exit process with failure
    }
};

module.exports = connectDB;
