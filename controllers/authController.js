// /controllers/authController.js
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Admin = require('../models/admin');
const nodemailer = require('nodemailer');

// Admin Registration Handler
exports.adminRegister = async (req, res) => {
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
        text: `Please verify your email by clicking the following link: ${process.env.BASE_URL}/auth/verify/${verificationToken}`
    };

    transporter.sendMail(mailOptions, (err, info) => {
        if (err) {
            return res.status(500).send('Error sending email');
        }
        res.send('Registration successful. Please check your email for verification.');
    });
};

// Admin Login Handler
exports.adminLogin = async (req, res) => {
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
exports.verifyAdmin = async (req, res) => {
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

exports.adminLogout = (req, res) => {
    res.clearCookie('authToken');  // Remove the auth token from cookies
    res.redirect('/auth/login');  // Redirect to login page
};

exports.forgotPassword = async (req, res) => {
    const { email } = req.body;

    // Check if the email exists
    const admin = await Admin.findOne({ email });
    if (!admin) {
        return res.status(400).json({ message: 'Email not found' });
    }

    // Generate a reset token
    const resetToken = jwt.sign({ id: admin._id }, process.env.JWT_SECRET, { expiresIn: '15m' });

    // Create email transporter
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
    });

    // Email options
    const resetLink = `${process.env.BASE_URL}/auth/reset-password/${resetToken}`;
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: admin.email,
        subject: 'Password Reset Request',
        text: `Click the link to reset your password: ${resetLink}`,
    };

    // Send the email
    transporter.sendMail(mailOptions, (err, info) => {
        if (err) {
            return res.status(500).json({ message: 'Error sending email' });
        }
        res.json({ message: 'Password reset link sent to email' });
    });
};

exports.resetPassword = async (req, res) => {
    const { token } = req.params;
    const { password } = req.body;

    try {
        // Verify the token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const admin = await Admin.findById(decoded.id);

        if (!admin) {
            return res.status(400).json({ message: 'Invalid or expired token' });
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(password, 10);
        admin.password = hashedPassword;
        await admin.save();

       res.render("pages/login")
    } catch (err) {
        res.status(400).json({ message: 'Invalid or expired token' });
    }
};

