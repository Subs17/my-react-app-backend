const mysql = require('mysql2');
require('dotenv').config();

//Create connection pool
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    connectionLimit: 10,
});

//Export the pool
module.exports = pool.promise();