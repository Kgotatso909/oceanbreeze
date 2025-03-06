const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Admin = require('../models/admin');
const nodemailer = require('nodemailer');

// Admin Registration
exports.adminRegister = async (req, res) => {
    const { username, email, password, role } = req.body;

    if (!username || !email || !password) {
        return res.status(400).send('Please provide all fields');
    }

    try {
        // Ensure the first admin is an 'admin'
        const adminCount = await Admin.countDocuments({});
        const adminRole = adminCount === 0 ? 'admin' : (role === 'admin' ? 'admin' : 'monitor');

        if (adminCount === 0 && adminRole !== 'admin') {
            return res.status(400).send('The first admin must be an admin.');
        }

        // Check if email already exists
        const existingAdmin = await Admin.findOne({ email });
        if (existingAdmin) return res.status(400).send('Email is already in use');

        // Hash password and create new admin
        const hashedPassword = await bcrypt.hash(password, 10);
        const newAdmin = new Admin({
            username,
            email,
            password: hashedPassword,
            role: adminRole,
            isVerified: false, 
        });

        await newAdmin.save();

        // Send verification email
        const verificationToken = jwt.sign({ email: newAdmin.email }, process.env.JWT_SECRET, { expiresIn: '1h' });
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
        });

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: newAdmin.email,
            subject: 'Verify your email',
            text: `Please verify your email by clicking the following link: ${process.env.BASE_URL}/auth/verify/${verificationToken}`
        };

        transporter.sendMail(mailOptions, (err) => {
            if (err) return res.status(500).send('Error sending email');
            res.send('Registration successful. Please check your email for verification.');
        });

    } catch (error) {
        console.error(error);
        res.status(500).send('Error during registration');
    }
};

// Admin Login
exports.adminLogin = async (req, res) => {
    const { email, password } = req.body;

    try {
        const admin = await Admin.findOne({ email: new RegExp('^' + email + '$', 'i') });
        if (!admin) return res.status(400).json({ message: 'Admin not found' });

        const isMatch = await bcrypt.compare(password, admin.password);
        if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

        // Generate JWT and set in cookies
        const token = jwt.sign({ id: admin._id, role: admin.role, username: admin.username }, process.env.JWT_SECRET, { expiresIn: '1h' });
        res.cookie('authToken', token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', maxAge: 60 * 60 * 1000 });

        res.redirect('/admin/dashboard');
    } catch (error) {
        console.error(error);
        res.status(500).send('Error during login');
    }
};

// Admin Email Verification
exports.verifyAdmin = async (req, res) => {
    const { token } = req.params;

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const admin = await Admin.findOne({ email: decoded.email });
        if (!admin) return res.status(400).send('Admin not found');

        admin.isVerified = true;
        await admin.save();

        res.send('Admin account verified successfully!');
    } catch (error) {
        console.error(error);
        res.status(400).send('Invalid or expired verification token');
    }
};

// Admin Logout
exports.adminLogout = (req, res) => {
    res.clearCookie('authToken');
    res.redirect('/auth/login');
};

// Forgot Password (Send Reset Email)
exports.forgotPassword = async (req, res) => {
    const { email } = req.body;

    try {
        const admin = await Admin.findOne({ email });
        if (!admin) return res.status(400).json({ message: 'Email not found' });

        const resetToken = jwt.sign({ id: admin._id }, process.env.JWT_SECRET, { expiresIn: '15m' });
        const resetLink = `${process.env.BASE_URL}/auth/reset-password/${resetToken}`;
        
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
        });

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: admin.email,
            subject: 'Password Reset Request',
            text: `Click the link to reset your password: ${resetLink}`
        };

        transporter.sendMail(mailOptions, (err) => {
            if (err) return res.status(500).json({ message: 'Error sending email' });
            res.json({ message: 'Password reset link sent to email' });
        });
    } catch (error) {
        console.error(error);
        res.status(500).send('Error during password reset request');
    }
};

// Reset Password (Update password)
exports.resetPassword = async (req, res) => {
    const { token } = req.params;
    const { password } = req.body;

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const admin = await Admin.findById(decoded.id);
        if (!admin) return res.status(400).json({ message: 'Invalid or expired token' });

        const hashedPassword = await bcrypt.hash(password, 10);
        admin.password = hashedPassword;
        await admin.save();

        res.render("pages/login");
    } catch (err) {
        console.error(err);
        res.status(400).json({ message: 'Invalid or expired token' });
    }
};
