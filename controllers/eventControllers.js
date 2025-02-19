const { strictTransportSecurity } = require("helmet");
const pool = require("../config/db");
const jwt = require('jsonwebtoken');

// Create Events
const createEvent = async (req, res) => {
    const { title, date, time, description } = req.body;
    
    if(!req.signedCookies.access_token){
        return res.status(401).json({ error: 'Unauthorized: No valid session' });
    }

    try{
        const decoded = jwt.verify(req.signedCookies.access_token, process.env.JWT_SECRET);
        const userId = decoded.id;

        const [result] = await pool.query(
            "INSERT INTO calendarevents (user_id, title, event_date, event_time, eventDescr) VALUES (?, ?, ?, ?, ?)", [
                userId, 
                title, 
                date,
                time, 
                description || null
            ]
        );

        console.log("Event created with ID: ", result.insertId);
        res.status(201).json({
            message: "Event added successfully",
            eventId: result.insertId, // <-- The actual new record ID
          });
    } catch(error){
        console.error("Error inserting event: ", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

const getEventById = async (req, res) => {
    const { id } = req.params;

    try{
        console.log(`Fetching event with ID: ${id}`);

        const [rows] = await pool.query(
            "SELECT * FROM calendarevents WHERE eventId = ?",
            [id]
        );

        console.log("Database result: ", rows); 

        if(rows.length === 0){
            return res.status(404).json({ error: "Event not found" });
        }

        res.status(200).json(rows[0]);
    } catch(error){
        console.error("Error fetching event: ", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

const getUserEvents = async (req, res) => {
    try {
        // ✅ Step 1: Check if the user is authenticated via signed cookies
        if (!req.signedCookies.access_token) {
            return res.status(401).json({ error: "Unauthorized: No valid session" });
        }

        // ✅ Step 2: Decode the JWT and extract the user ID
        const decoded = jwt.verify(req.signedCookies.access_token, process.env.JWT_SECRET);
        const userId = decoded.id;

        console.log("🔹 Fetching events for user ID:", userId);

        // ✅ Step 3: Fetch events from database
        const [rows] = await pool.query(
            "SELECT eventId, title, DATE_FORMAT(event_date, '%Y-%m-%d') AS date, TIME_FORMAT(event_time, '%H:%i:%s') AS time, eventDescr AS description FROM calendarEvents WHERE user_id = ?",
            [userId]
        );

        console.log("✅ Sending formatted events to frontend:", rows); // Debug response
        res.json(rows);
    } catch (error) {
        console.error("❌ Error fetching events:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};


const deleteEvent = async (req, res) => {
    const { id } = req.params;

    if(!req.signedCookies.access_token) {
        return res.status(401).json({ error: "Unauthorized: No valid session" });
    }

    try {
        const decoded = jwt.verify(req.signedCookies.access_token, process.env.JWT_SECRET);
        const userId = decoded.id;

        const [result] = await pool.query(
            "DELETE FROM calendarevents WHERE eventId = ? AND user_id = ?",
            [id, userId]
        );

        if(result.affectedRows === 0){
            return res.status(404).json({ error: "Event not found or unauthorized" });
        }

        console.log(`Event deleted: ${id}`);
        res.status(200).json({ message: "Event deleted successfully" });
    } catch(error) {
        console.error("Error deleting event: ", error);
        res.status(500).json({ error: "Internal server error" });
    }
}

// PUT /api/v1/events/:id
const updateEvent = async (req, res) => {
    const { id } = req.params;
    const { title, date, time, description } = req.body;
  
    // Verify user is logged in
    if (!req.signedCookies.access_token) {
      return res.status(401).json({ error: "Unauthorized: No valid session" });
    }
  
    try {
      const decoded = jwt.verify(req.signedCookies.access_token, process.env.JWT_SECRET);
      const userId = decoded.id;
  
      // Perform the update in the database
      const [result] = await pool.query(
        "UPDATE calendarevents SET title = ?, event_date = ?, event_time = ?, eventDescr = ? WHERE eventId = ? AND user_id = ?",
        [title, date, time, description || null, id, userId]
      );
  
      if (result.affectedRows === 0) {
        return res.status(404).json({ error: "Event not found or unauthorized" });
      }
  
      // Optionally fetch the updated row to return updated data
      const [updatedRows] = await pool.query(
        "SELECT eventId, title, DATE_FORMAT(event_date, '%Y-%m-%d') AS date, TIME_FORMAT(event_time, '%H:%i:%s') AS time, eventDescr AS description FROM calendarevents WHERE eventId = ? AND user_id = ?",
        [id, userId]
      );
  
      const updatedEvent = updatedRows[0];
      res.status(200).json(updatedEvent);
    } catch (error) {
      console.error("Error updating event:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  };
  

module.exports = { createEvent, getEventById, getUserEvents, deleteEvent, updateEvent };
