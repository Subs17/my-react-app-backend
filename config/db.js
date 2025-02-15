const mysql = require('mysql2');
require('dotenv').config();

//Create connection pool
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    connectionLimit: 10,
    waitForConnections: true,
    queueLimit: 0,
    connectTimeout: 10000, // 10s timeout
    debug: false,
});

//Export the pool
module.exports = pool.promise();
