const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const userRoutes = require('./routes/userRoutes'); // Import user routes
const pool = require('./config/db');
require('dotenv').config();

const app = express();

// Enable CORS
const corsOptions ={
    origin: process.env.FRONTEND_URL || 'http://localhost:5173', // Allow only the frontend to access this API
    methods: ['GET','POST'],
    allowedHeaders: ['Content-Type', 'Authorization'], // Restrict allowed headers
    credentials: true,
};

// Middleware to parse incoming requests
app.use(cors(corsOptions)); // Enable All CORS Requests

app.use(helmet());
app.use(morgan('dev'));
app.use(bodyParser.json()); // Parse JSON bodies (as sent by API clients)

app.use(cookieParser(process.env.COOKIE_SECRET));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
});
app.use(limiter);

app.use('/api/v1', userRoutes); // Use user routes


// Start server 
pool.query('SELECT 1')
    .then(() => {
        console.log('Database connection successful');
        const port = process.env.PORT || 3000;
        app.listen(port, () => {
            console.log(`Server is running on http://localhost:${port}`);
        });
    })
    .catch(err => {
        console.error('Failed to connect to database: ', err.message);
        process.exit(1);
});
