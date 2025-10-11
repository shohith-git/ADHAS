const pool = require("../db");

// Mark attendance
const markAttendance = async (req, res) => {
  const { student_id, method, location } = req.body;

  try {
    const newEntry = await pool.query(
      "INSERT INTO attendance (student_id, method, location) VALUES ($1, $2, $3) RETURNING *",
      [student_id, method, location]
    );
    res.status(201).json(newEntry.rows[0]);
  } catch (err) {
    console.error(err.message);
    res
      .status(500)
      .json({ message: "Internal server error", error: err.message });
  }
};

// Get attendance for a student
const getAttendance = async (req, res) => {
  const { student_id } = req.params;

  try {
    const records = await pool.query(
      "SELECT * FROM attendance WHERE student_id = $1 ORDER BY date DESC",
      [student_id]
    );
    res.json(records.rows);
  } catch (err) {
    console.error(err.message);
    res
      .status(500)
      .json({ message: "Internal server error", error: err.message });
  }
};

module.exports = { markAttendance, getAttendance };
