// /middlewares/authMiddleware.js
const jwt = require('jsonwebtoken');

const protectRoute = (req, res, next) => {
    const token = req.cookies.authToken;  // Look for the token in the cookies

    if (!token) {
        return res.status(401).json({ message: 'No token provided' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;  // Add user data to the request object for further use
        next();  // Proceed to the next middleware or route
    } catch (err) {
        return res.status(401).json({ message: 'Invalid or expired token' });
    }
};

module.exports = protectRoute;
