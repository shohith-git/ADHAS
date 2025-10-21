const express = require("express");
const router = express.Router();
const pool = require("../db"); // adjust path if needed

// POST: Add a new complaint
router.post("/", async (req, res) => {
  try {
    const { user_id, title, description } = req.body;
    const result = await pool.query(
      `INSERT INTO complaints (user_id, title, description)
       VALUES ($1, $2, $3) RETURNING *`,
      [user_id, title, description]
    );
    res.status(201).json({
      message: "Complaint submitted successfully",
      complaint: result.rows[0],
    });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "Server error while submitting complaint" });
  }
});

// GET: Fetch all complaints
router.get("/", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM complaints ORDER BY created_at DESC"
    );
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching complaints" });
  }
});

module.exports = router;
