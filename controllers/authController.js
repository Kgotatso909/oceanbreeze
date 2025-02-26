// /controllers/authController.js
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const Admin = require('../models/admin');

// Set up email transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Registration Controller
const registerAdmin = async (req, res) => {
  const { email, password, username } = req.body;

  // Validate email format, strong password, and check uniqueness
  if (!email || !password || !username) {
    return res.status(400).json({ message: 'All fields are required.' });
  }

  if (!/\S+@\S+\.\S+/.test(email)) {
    return res.status(400).json({ message: 'Invalid email format.' });
  }

  if (password.length < 6) {
    return res.status(400).json({ message: 'Password must be at least 6 characters.' });
  }

  try {
    // Check if email or username exists
    const existingAdmin = await Admin.findOne({ $or: [{ email }, { username }] });
    if (existingAdmin) {
      return res.status(400).json({ message: 'Email or username already exists.' });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new admin
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const newAdmin = new Admin({ email, password: hashedPassword, username, verificationToken });

    // Save admin to database
    await newAdmin.save();

    // Send verification email
    const verificationUrl = `${process.env.FRONTEND_URL}/verify/${verificationToken}`;
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Verify your Admin Account',
      text: `Please verify your account by clicking the link: ${verificationUrl}`,
    });

    res.status(201).json({ message: 'Admin registered. Please check your email for verification.' });
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

// Login Controller
const loginAdmin = async (req, res) => {
  const { email, password } = req.body;

  try {
    const admin = await Admin.findOne({ email });
    if (!admin) {
      return res.status(400).json({ message: 'Invalid credentials.' });
    }

    // Check if the admin is verified
    if (!admin.isVerified) {
      return res.status(400).json({ message: 'Account is not verified.' });
    }

    const isMatch = await admin.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials.' });
    }

    // Create JWT token
    const token = jwt.sign({ id: admin._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    const refreshToken = jwt.sign({ id: admin._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

    // Log login attempt (activity tracking)
    console.log(`Admin login attempt: ${admin.username}, IP: ${req.ip}, Time: ${new Date()}`);

    res.status(200).json({ token, refreshToken, message: 'Login successful.' });
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

// Verify Admin Controller (verification after registration)
const verifyAdmin = async (req, res) => {
  const { token } = req.params;

  try {
    const admin = await Admin.findOne({ verificationToken: token });
    if (!admin) {
      return res.status(400).json({ message: 'Invalid verification token.' });
    }

    admin.isVerified = true;
    admin.verificationToken = null;
    await admin.save();

    res.status(200).json({ message: 'Account verified successfully. You can now log in.' });
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

module.exports = { registerAdmin, loginAdmin, verifyAdmin };
