const bcrypt = require('bcrypt');
const pool = require('../config/db');

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
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        // User authenticated successfully
        res.status(200).json({ message: 'Login successful', userId: userData.id });
    } catch (error) {
        console.error('An error occurred:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Register Logic
const registerUser = async (req, res) => {
    console.log('Request received:', req.body);
    //res.send('Request received!');

    const { firstName, 
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

    if(missingFields.length > 0) {
        const missingFieldNames = missingFields.map((key) => requiredFields[key]).join(', ');
        return res.status(400).json({ error: `Missing required fields: ${missingFieldNames}` });
    }

    try {

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Insert user into the database
        const [result] = await pool.query(
            'INSERT INTO users (first_name, last_name, email, alt_email, dob, gender, phone_number, alt_number, password_hash) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', 
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

        res.status(201).json({ message: 'User created successfully', userId: result.insertId });
    } catch (error) {
        if(error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ message: 'Email already exists' });
        } else {
            console.error(error);
            return res.status(500).json({ message: 'Internal server error' });
        }
    }
}

module.exports = { loginUser, registerUser };