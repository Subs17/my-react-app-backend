const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const pool = require('../config/db');
const multer = require('multer');
const nodemailer = require('nodemailer');
// const path = require('path');


// Login Logic 
const loginUser = async (req, res) => {
    const { email, password } = req.body;

    // Check if email and password are provided
    if(!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
    }

    try {
        // Retrieve user from database
        const [ user ] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);

        if (user.length === 0) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        const userData = user[0];

        // Compare the password
        const isPasswordValid = await bcrypt.compare(password, userData.password_hash);

        if(!isPasswordValid) {
            return res.status(401).json({ error: 'Invalid password' });
        }

        const token = jwt.sign(
            { id: userData.id, email: userData.email }, //Payload 
            process.env.JWT_SECRET, 
            { expiresIn: '1h' } // Token expiration
        );

        // User authenticated successfully
        res.cookie('access_token', token, {
            httpOnly: true,
            signed: true,
            secure: false,
            sameSite: 'Lax',
            maxAge: 60 * 60 * 1000, // 1 hour
        });

        //console.log("🔹 Setting Cookie: access_token = ", token); // ✅ Debugging cookie setting
        res.status(200).json({ message: 'Login Successful', userId: userData.id });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
}; // End of login user function



// Register Logic
const registerUser = async (req, res) => {
    console.log('Request received:', req.body);

    const {
        firstName, 
        lastName, 
        email,
        altemail,
        dob,
        gender,
        phone,
        altPhone, 
        password 
    } = req.body;

    // Defined required fields
    const requiredFields = {
      firstName: 'First Name',
      lastName: 'Last Name',
      email: 'Email',
      dob: 'Date of Birth',
      gender: 'Gender',
      phone: 'Phone Number',
      password: 'Password',
    };

    // Identify missing required fields
    const missingFields = Object.keys(requiredFields).filter(
        (field) => !req.body[field]
    );

    if (missingFields.length > 0) {
        const missingFieldNames = missingFields
          .map((key) => requiredFields[key])
          .join(', ');
        return res.status(400).json({
          error: `Missing required fields: ${missingFieldNames}`
        });
    }

    try {
        // 1) Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // 2) Insert user into the database
        const [result] = await pool.query(
            `INSERT INTO users 
             (first_name, last_name, email, alt_email, dob, gender, phone_number, alt_number, password_hash)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`, 
            [
                firstName, 
                lastName, 
                email, 
                altemail || null, // Default to NULL if empty
                dob,
                gender,
                phone,
                altPhone || null, // Default to NULL if empty
                hashedPassword
            ]
        );

        // 3) Send welcome email
        // Create a Nodemailer transporter
        const transporter = nodemailer.createTransport({
          host: 'smtp.gmail.com',   // e.g. 'smtp.gmail.com' for Gmail
          port: 587,                  // or 465 if using SSL
          secure: false,              // true if port 465, false if 587
          auth: {
            user: 'elderlycareportal@gmail.com',
            pass: 'dzcaxuvjnnyujwgu'
          },
          tls: {
            rejectUnauthorized: false
          }
        });

        // Build mail options
        const mailOptions = {
          from: '"Elderly Care Portal" <no-reply@elderlycare.com>',
          to: email,
          subject: 'Welcome to Elderly Care Portal!',
          text: `Hello ${firstName}, welcome to our portal!`,
          html: `
            <h1>Welcome, ${firstName}!</h1>
            <p>Thank you for joining the Elderly Care Portal.</p>
            <p>We hope you have a great experience!</p>
          `
        };

        // Send the email
        await transporter.sendMail(mailOptions);

        // 4) Return success
        res.status(201).json({
          message: 'User created successfully',
          userId: result.insertId
        });

    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ message: 'Email already exists' });
        } else {
            console.error(error);
            return res.status(500).json({ message: 'Internal server error' });
        }
    }
}; // End of register user function

const getUserDetails = async (req, res) => {
    // console.log("Cookies received in /api/v1/user: ", req.signedCookies);
    try{
       // Check for valid session cookies
        if(!req.signedCookies || !req.signedCookies.access_token){
            return res.status(401).json({ error: "Unauthorized: No valid session" });
        }
        // Decode JWT from cookies
        const decoded = jwt.verify(req.signedCookies.access_token, process.env.JWT_SECRET);
        
        const [rows] = await pool.query(
            'SELECT first_name, last_name, profile_picture FROM users WHERE id = ?',
            [decoded.id]
        );

        if(rows.length === 0) {
            return res.status(404).json({ error: 'User not found'});
        }

        const user = rows[0];
        res.json({
            name: `${user.first_name} ${user.last_name}`,
            profilePicture: user.profile_picture || null
        });
    } catch (error){
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

const updateProfilePicture = async (req, res) => {
      try {
        // 1) Verify user
        if (!req.signedCookies || !req.signedCookies.access_token) {
          return res.status(401).json({ error: "Unauthorized: No valid session" });
        }
        const decoded = jwt.verify(req.signedCookies.access_token, process.env.JWT_SECRET);
        const userId = decoded.id;
  
        // 2) Verify file
        if (!req.file) {
          return res.status(400).json({ error: "No file uploaded" });
        }
  
        // 3) Build file path
        const filePath = '/uploads/profilepictures/' + req.file.filename;
  
        // 4) Update DB
        await pool.query(
          'UPDATE users SET profile_picture = ? WHERE id = ?',
          [filePath, userId]
        );
  
        // 5) Now fetch the updated row so we can return the entire user object
        const [rows] = await pool.query(
          'SELECT first_name, last_name, profile_picture FROM users WHERE id = ?',
          [userId]
        );
  
        if (!rows.length) {
          return res.status(404).json({ error: 'User not found' });
        }
  
        // 6) Return the updated user in the response
        const updatedUser = rows[0];
        res.json({
          name: `${updatedUser.first_name} ${updatedUser.last_name}`,
          profilePicture: updatedUser.profile_picture || null
        });
      } catch (error) {
        console.error("Error uploading profile picture:", error);
        res.status(500).json({ error: "Internal server error" });
      }
};


module.exports = { loginUser, registerUser, getUserDetails, updateProfilePicture };
