const jwt = require('jsonwebtoken');

const protectRoute = (req, res, next) => {
    const token = req.cookies.authToken;  // Look for the token in the cookies

    // Debugging: Check if the token is found
    console.log('Token:', token);

    if (!token) {
        return res.redirect('/auth/login');  // Redirect to login page if no token
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;  // Add user data to the request object for further use
        next();  // Proceed to the next middleware or route
    } catch (err) {
        // Debugging: Log any errors related to the token
        console.log('Error verifying token:', err);
        return res.status(401).json({ message: 'Invalid or expired token' });
    }
};

module.exports = protectRoute;
