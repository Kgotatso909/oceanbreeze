const express = require('express');
const path = require('path');
const dotenv = require('dotenv');
const cors = require('cors');
const cron = require('node-cron');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const setSecurityHeaders = require('./middlewares/helmet'); 
const errorMiddleware = require('./middlewares/errorMiddleware'); 
const bookingController = require('./controllers/bookingController');
const connectDB = require('./config/database'); 


// Import routes for registration and login
const homeRoutes = require('./routes/index');
const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const contactRoutes = require('./routes/contactRoutes');
const roomRoutes = require('./routes/roomRoutes');

dotenv.config();

const app = express();

// Connect to MongoDB
connectDB();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(setSecurityHeaders()); 
app.use(cors());
app.use(morgan('dev'));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Admin registration and login routes
app.use('/', roomRoutes);
app.use('/', homeRoutes);
app.use('/auth', authRoutes);
app.use("/admin", adminRoutes)
app.use("/booking", bookingRoutes)
app.use('/', contactRoutes);

// Schedule tasks (Runs every day at midnight)
cron.schedule('0 0 * * *', async () => {
    console.log('Running scheduled booking reminders...');
    await bookingController.sendCheckInReminders();
    await bookingController.sendReviewRequests();
});

// Apply error handling middleware (last middleware)
app.use(errorMiddleware);

const port = process.env.PORT || 3000;

const server = app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});

// Graceful shutdown for server
const shutdown = () => {
    console.log("Closing HTTP server gracefully...");
    server.close(() => {
        console.log("Server shut down gracefully.");
        process.exit(0);
    });
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

module.exports = app;
