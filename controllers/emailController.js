const nodemailer = require('nodemailer');
const ejs = require('ejs');
const path = require('path');

// Configure nodemailer transport (replace with actual SMTP details)
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// Function to send an email
exports.sendEmail = async (req, res) => {
    const { recipientEmail, subject, template, message, name, discount, promoCode } = req.body;

    try {
        // Determine the correct template file
        const templatePath = path.join(__dirname, '../views/emails', `${template}.ejs`);
        
        // Render the EJS template with dynamic data
        const emailContent = await ejs.renderFile(templatePath, { 
            name, 
            message, 
            subject, 
            discount, 
            promoCode 
        });

        // Configure the email options
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: recipientEmail,
            subject: subject || 'Guesthouse Notification',
            html: emailContent
        };

        // Send the email
        await transporter.sendMail(mailOptions);
        res.redirect('/admin/send-email?success=Email sent successfully');
    } catch (error) {
        console.error('Error sending email:', error);
        res.redirect('/admin/send-email?error=Failed to send email');
    }
};
