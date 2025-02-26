// /controllers/authController.js
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Admin = require('../models/admin');
const nodemailer = require('nodemailer');

// Admin Registration Handler
const adminRegister = async (req, res) => {
    const { username, email, password } = req.body;

    // Simple validation
    if (!username || !email || !password) {
        return res.status(400).send('Please provide all fields');
    }

    // Check if email already exists
    const existingAdmin = await Admin.findOne({ email });
    if (existingAdmin) {
        return res.status(400).send('Email is already in use');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new admin user
    const newAdmin = new Admin({
        username,
        email,
        password: hashedPassword,
        role: 'admin',
        isVerified: false, // Initially not verified
    });

    await newAdmin.save();

    // Send verification email
    const verificationToken = jwt.sign({ email: newAdmin.email }, process.env.JWT_SECRET, { expiresIn: '1h' });

    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    });

    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: newAdmin.email,
        subject: 'Verify your email',
        text: `Please verify your email by clicking the following link: ${process.env.BASE_URL}/admin/verify/${verificationToken}`
    };

    transporter.sendMail(mailOptions, (err, info) => {
        if (err) {
            return res.status(500).send('Error sending email');
        }
        res.send('Registration successful. Please check your email for verification.');
    });
};

// Admin Login Handler
const adminLogin = async (req, res) => {
    const { email, password } = req.body;

    // Check if the admin exists
    const admin = await Admin.findOne({ email: new RegExp('^' + email + '$', 'i') });  // Case-insensitive search
    if (!admin) {
        return res.status(400).json({ message: 'Admin not found' });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
        return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Generate JWT
    const token = jwt.sign({ id: admin._id, role: admin.role }, process.env.JWT_SECRET, { expiresIn: '1h' });

    // Set the token in the cookies
    res.cookie('authToken', token, { 
        httpOnly: true, 
        secure: process.env.NODE_ENV === 'production',  // Set to false for non-HTTPS in development
        maxAge: 60 * 60 * 1000  // Optional: Set cookie expiration time (1 hour)
    }); 
    

    // Redirect to dashboard
    res.redirect('/admin/dashboard');
};


// Admin Email Verification Handler
const verifyAdmin = async (req, res) => {
    const { token } = req.params;

    try {
        // Verify the token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Find the admin by email
        const admin = await Admin.findOne({ email: decoded.email });

        if (!admin) {
            return res.status(400).send('Admin not found');
        }

        // Update the admin's verification status
        admin.isVerified = true;
        await admin.save();

        res.send('Admin account verified successfully!');
    } catch (error) {
        res.status(400).send('Invalid or expired verification token');
    }
};

module.exports = { adminRegister, adminLogin, verifyAdmin };
