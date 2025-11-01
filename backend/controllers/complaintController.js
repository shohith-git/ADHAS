// adhas/backend/controllers/complaintController.js
const pool = require("../db");

// 🟢 Add a new complaint (Student)
exports.addComplaint = async (req, res) => {
  try {
    const { user_id, title, description } = req.body;

    if (!user_id || !title || !description) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const query = `
      INSERT INTO complaints (user_id, title, description, status, created_at, updated_at)
      VALUES ($1, $2, $3, 'pending', NOW(), NOW())
      RETURNING *;
    `;
    const values = [user_id, title, description];
    const result = await pool.query(query, values);

    res.status(201).json({
      message: "Complaint added successfully",
      complaint: result.rows[0],
    });
  } catch (err) {
    console.error("❌ Error adding complaint:");
    console.error("Message:", err.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

// 🟡 Get all complaints (Warden/Admin)
exports.getAllComplaints = async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM complaints ORDER BY created_at DESC"
    );
    res.status(200).json(result.rows);
  } catch (err) {
    console.error("❌ Error fetching all complaints:", err.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

// 🔵 Get complaints by user ID (Student)
exports.getComplaintsByStudent = async (req, res) => {
  try {
    const { studentId } = req.params;

    const result = await pool.query(
      "SELECT * FROM complaints WHERE user_id = $1 ORDER BY created_at DESC",
      [studentId]
    );

    res.status(200).json(result.rows);
  } catch (err) {
    console.error("❌ Error fetching complaints by student:", err.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

// 🟠 Update complaint status (Warden)
exports.updateComplaintStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const query = `
      UPDATE complaints
      SET status = $1, updated_at = NOW()
      WHERE id = $2
      RETURNING *;
    `;
    const values = [status, id];
    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Complaint not found" });
    }

    res.status(200).json({
      message: "Status updated successfully",
      complaint: result.rows[0],
    });
  } catch (err) {
    console.error("❌ Error updating complaint status:", err.message);
    res.status(500).json({ message: "Internal server error" });
  }
};
