// backend/controllers/complaintController.js
const pool = require("../db");

// 🟢 Student submits complaint
exports.addComplaint = async (req, res) => {
  try {
    const user = req.user; // comes from authMiddleware
    const { title, description } = req.body;

    if (!title || !description) {
      return res
        .status(400)
        .json({ message: "Title and description are required" });
    }

    // Get student room_no
    const prof = await pool.query(
      "SELECT room_no FROM student_profiles WHERE user_id = $1",
      [user.id]
    );
    const room_no = prof.rows[0]?.room_no || null;

    // Insert complaint
    const result = await pool.query(
      `INSERT INTO complaints (user_id, student_id, room_no, title, description, status, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, 'pending', NOW(), NOW())
       RETURNING *`,
      [user.id, user.id, room_no, title, description]
    );

    res.status(201).json({
      message: "Complaint submitted successfully ✅",
      complaint: result.rows[0],
    });
  } catch (err) {
    console.error("❌ Error submitting complaint:", err.message);
    res.status(500).json({ message: "Error submitting complaint" });
  }
};

// 🟣 Warden/Admin view all complaints with student name, email, room, dept, year, usn
exports.getAllComplaints = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT 
          c.id,
          c.title,
          c.description,
          c.status,
          c.room_no,
          c.created_at,
          c.updated_at,
          u.id AS user_id,
          u.name AS student_name,
          u.email,
          sp.hostel_id,
          sp.dept_branch,
          sp.year,
          sp.usn
       FROM complaints c
       LEFT JOIN users u ON u.id = c.student_id
       LEFT JOIN student_profiles sp ON sp.user_id = c.student_id
       ORDER BY c.created_at DESC`
    );

    res.status(200).json(result.rows);
  } catch (err) {
    console.error("❌ Error fetching complaints:", err.message);
    res.status(500).json({ message: "Error fetching complaints" });
  }
};

// 🔵 Fetch complaints for a specific student
exports.getComplaintsByStudent = async (req, res) => {
  try {
    // Works for both /:studentId and /student/:id
    const studentId = req.params.id || req.params.studentId;

    if (!studentId || isNaN(Number(studentId))) {
      return res.status(400).json({ message: "Invalid student ID" });
    }

    const result = await pool.query(
      `SELECT id, title, description, status, room_no, created_at, updated_at
       FROM complaints
       WHERE student_id = $1
       ORDER BY created_at DESC`,
      [studentId]
    );

    res.status(200).json(result.rows);
  } catch (err) {
    console.error("❌ Error fetching student complaints:", err.message);
    res.status(500).json({ message: "Error fetching student complaints" });
  }
};

// 🟠 Update complaint status (Warden)
exports.updateComplaintStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const allowedStatuses = ["pending", "in-progress", "resolved", "denied"];
    if (!allowedStatuses.includes(status.toLowerCase())) {
      return res.status(400).json({
        message: `Invalid status. Must be one of: ${allowedStatuses.join(
          ", "
        )}`,
      });
    }

    // ✅ ensure updated_at is refreshed on every change
    const result = await pool.query(
      `UPDATE complaints
         SET status = $1,
             updated_at = NOW()
       WHERE id = $2
       RETURNING id, title, status, created_at, updated_at`,
      [status, id]
    );

    if (result.rows.length === 0)
      return res.status(404).json({ message: "Complaint not found" });

    console.log(
      `✅ Complaint ${id} status changed to '${status}', updated_at refreshed.`
    );

    res.status(200).json({
      message: `Complaint marked as '${status}' successfully`,
      complaint: result.rows[0],
    });
  } catch (err) {
    console.error("❌ Error updating complaint status:", err.message);
    res.status(500).json({ message: "Error updating complaint status" });
  }
};
