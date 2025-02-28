// middlewares/helmet.js
const helmet = require('helmet');

const setSecurityHeaders = () => {
    return helmet({
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"], // Only allow resources from the same origin
                scriptSrc: [
                    "'self'", 
                    'https://cdnjs.cloudflare.com', // Allow external scripts from CDN
                    "'unsafe-inline'" // Allow inline scripts (can be risky, optional)
                ],
                styleSrc: [
                    "'self'", 
                    'https://cdnjs.cloudflare.com' // Allow external styles from CDN
                ],
                imgSrc: ["'self'", 'data:'], // Allow images from the same origin and inline images
                connectSrc: ["'self'"], // Allow XMLHttpRequest (AJAX) from the same origin
                fontSrc: ["'self'", 'https://cdnjs.cloudflare.com'], // Allow fonts from CDN
                objectSrc: ["'none'"], // Disallow <object> elements
                upgradeInsecureRequests: [] // Automatically upgrade HTTP requests to HTTPS
            },
        },
    });
};

module.exports = setSecurityHeaders;
