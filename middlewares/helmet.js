const helmet = require('helmet');
const crypto = require('crypto');

const generateNonce = () => {
    return crypto.randomBytes(16).toString('base64');
};

const setSecurityHeaders = () => {
    return (req, res, next) => {
        const nonce = generateNonce(); // Generate nonce for this request

        // Set the nonce for use in the CSP header and in the templates
        res.locals.nonce = nonce;

        helmet({
            contentSecurityPolicy: {
                directives: {
                    defaultSrc: ["'self'"], // Only allow resources from the same origin
                    scriptSrc: [
                        "'self'", 
                        'https://cdnjs.cloudflare.com', // Allow external scripts from CDN
                        'https://cdn.jsdelivr.net', // Allow external scripts from jsDelivr CDN
                        `'nonce-${nonce}'` 
                        
                    ],
                    styleSrc: [
                        "'self'", 
                        'https://cdnjs.cloudflare.com', // Allow external styles from CDN
                        'https://cdn.jsdelivr.net', // Allow external styles from jsDelivr CDN
                        `'nonce-${nonce}'` // Allow inline styles that match this nonce
                    ],
                    imgSrc: ["'self'", 'data:'], // Allow images from the same origin and inline images
                    connectSrc: ["'self'"], // Allow XMLHttpRequest (AJAX) from the same origin
                    fontSrc: [
                       "'self'",  // Allow system fonts (built-in fonts from the local device)
                        'https://cdnjs.cloudflare.com', // Allow fonts from CDN
                        'https://cdn.jsdelivr.net', // Allow fonts from jsDelivr CDN
                         'data:',  // Allow base64-encoded fonts (data URIs)
                        `'nonce-${nonce}'`
                    ],
                    objectSrc: ["'none'"], // Disallow <object> elements
                    upgradeInsecureRequests: [] // Automatically upgrade HTTP requests to HTTPS
                },
            },
        })(req, res, next); // Invoke helmet with the nonce for each request
    };
};

module.exports = setSecurityHeaders;
