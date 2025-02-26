// /server.js
const express = require('express');
const path = require('path');
const dotenv = require('dotenv');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const protectRoute = require('./middlewares/authMiddleware');
const errorMiddleware = require('./middlewares/errorMiddleware'); // Import error middleware
const connectDB = require('./config/database'); // Import DB connection

// Import routes for registration and login
const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');

dotenv.config();

const app = express();

// Connect to MongoDB
connectDB();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(cors());
app.use(helmet());
app.use(morgan('dev'));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Admin registration and login routes
app.use('/auth', authRoutes);
app.use("/admin", adminRoutes)

// Example route (Home)
app.get('/', (req, res) => {
    res.render('pages/index');
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
