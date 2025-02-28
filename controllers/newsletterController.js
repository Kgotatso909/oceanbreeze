const Newsletter = require('../models/newsletter');
const nodemailer = require('nodemailer');

exports.renderNewsletterPage = (req, res) => {
    res.render('pages/admin/sendNewsletter');
};

// Subscribe a user
exports.subscribe = async (req, res) => {
    try {
        const { email } = req.body;

        // Check if the email already exists
        const existingSubscriber = await Newsletter.findOne({ email });
        if (existingSubscriber) {
            return res.status(400).send('This email is already subscribed.');
        }

        await Newsletter.create({ email });
        res.status(200).send('Successfully subscribed to the newsletter.');
    } catch (error) {
        console.error(error);
        res.status(500).send('Error subscribing to the newsletter.');
    }
};

// Send newsletter to all subscribers
exports.sendNewsletter = async (req, res) => {
    try {
        const { subject, message } = req.body;
        const subscribers = await Newsletter.find();

        if (subscribers.length === 0) {
            return res.status(400).send('No subscribers found.');
        }

        // Email configuration
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });

        // Sending emails to all subscribers
        for (let subscriber of subscribers) {
            await transporter.sendMail({
                from: process.env.EMAIL_USER,
                to: subscriber.email,
                subject,
                text: message
            });
        }

        res.status(200).send('Newsletter sent successfully.');
    } catch (error) {
        console.error(error);
        res.status(500).send('Error sending the newsletter.');
    }
};
