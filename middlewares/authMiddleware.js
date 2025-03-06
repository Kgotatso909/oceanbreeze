const jwt = require('jsonwebtoken');

const protectRoute = (req, res, next) => {
    const token = req.cookies.authToken;  

   
    console.log('Token:', token);

    if (!token) {
        return res.redirect('/auth/login');  
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;  
        next();  
    } catch (err) {
        
        console.log('Error verifying token:', err);
        return res.status(401).json({ message: 'Invalid or expired token' });
    }
};

const setUserLocals = (req, res, next) => {
    res.locals.user = req.user; 
    next();
};


module.exports = { protectRoute, setUserLocals }
