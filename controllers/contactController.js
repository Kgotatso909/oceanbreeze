const Contact = require('../models/contact');
const nodemailer = require('nodemailer');

// Setup email transporter
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER, // Set in your .env file
        pass: process.env.EMAIL_PASS  // Set in your .env file
    }
});

exports.submitContactForm = async (req, res) => {
    try {
        const { username, email, subject, message } = req.body;

        // Save contact details in the database
        const contact = new Contact({ username, email, subject, message });
        await contact.save();

        // Send auto-reply email to the user
        const userMailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: "Thank you for reaching out!",
            text: `Hi ${username},\n\nThank you for contacting us! Our team will get back to you as soon as possible.\n\nBest regards,\n[Guesthouse Name]`
        };
        await transporter.sendMail(userMailOptions);

        // Send email to admin
        const adminMailOptions = {
            from: process.env.EMAIL_USER,
            to: process.env.ADMIN_EMAIL, // Set admin email in .env file
            subject: `New Contact Form Submission: ${subject}`,
            text: `New message from ${username} (${email}):\n\n${message}`
        };
        await transporter.sendMail(adminMailOptions);

        res.redirect('/contact?success=true');
    } catch (err) {
        console.error(err);
        res.status(500).send('Error submitting the contact form');
    }
};

exports.contactPage = async (req, res) => {
    res.render("pages/contact")
}

// Get all messages, with optional filter (pending or replied)
exports.getMessages = async (req, res) => {
    try {
        const { filter } = req.query; // Get filter from query (optional)
        let query = {};

        if (filter === 'pending' || filter === 'replied') {
            query.respond = filter;
        }

        const messages = await Contact.find(query).sort({ createdAt: -1 });
        res.render('pages/admin/manageMessages', { messages, filter });
    } catch (err) {
        console.error(err);
        res.status(500).send("Error fetching messages");
    }
};

// Mark a message as "replied"
exports.markAsReplied = async (req, res) => {
    try {
        const { messageId } = req.body;
        await Contact.findByIdAndUpdate(messageId, { respond: 'replied' });
        res.redirect('/admin/messages'); // Refresh the page after update
    } catch (err) {
        console.error(err);
        res.status(500).send("Error updating message status");
    }
};