const jwt = require('jsonwebtoken');

exports.cookieJwtAuth = (req, res, next) => {

    const token = req.signedCookies.access_token;

    if(!token){
        return res.status(401).json({ error: 'Access denied, token missing!' });
    }

    try{
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch(error){
        console.error('Invalid token: ', error);
        res.clearCookie('token');
        return res.redirect('/');
    }
};
