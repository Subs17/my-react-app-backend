const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const userRoutes = require('./routes/userRoutes'); // Import user routes
require('dotenv').config();

const app = express();

// Enable CORS
const corsOptions ={
    origin: 'http://localhost:5173', // Allow only the frontend to access this API
    methods: ['GET','POST'],
    allowedHeaders: ['Content-Type', 'Authorization'], // Restrict allowed headers
};

// Middleware to parse incoming requests
app.use(cors(corsOptions)); // Enable All CORS Requests
app.use(bodyParser.json()); // Parse JSON bodies (as sent by API clients)

app.use('/api/v1', userRoutes); // Use user routes

const port = process.env.PORT || 3000;
// Start server 
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});