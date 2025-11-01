// 📁 backend/routes/complaintRoutes.js
const express = require("express");
const router = express.Router();
const pool = require("../db");
const { authMiddleware, isWarden } = require("../middleware/authMiddleware");

/* ========================================================
   🧾 STUDENT — Submit a new complaint
   --------------------------------------------------------
   Endpoint: POST /api/complaints
   Role: Student (Authenticated)
======================================================== */
router.post("/", authMiddleware, async (req, res) => {
  try {
    const { title, description } = req.body;
    const userId = req.user.id;

    if (!title || !description) {
      return res
        .status(400)
        .json({ message: "Title and description required" });
    }

    const result = await pool.query(
      `INSERT INTO complaints (user_id, title, description, status, created_at)
       VALUES ($1, $2, $3, 'pending', CURRENT_TIMESTAMP)
       RETURNING *`,
      [userId, title, description]
    );

    res.status(201).json({
      message: "Complaint submitted successfully ✅",
      complaint: result.rows[0],
    });
  } catch (error) {
    console.error("❌ Error submitting complaint:", error);
    res
      .status(500)
      .json({ message: "Server error while submitting complaint" });
  }
});

/* ========================================================
   📋 WARDEN / ADMIN — View all complaints
   --------------------------------------------------------
   Endpoint: GET /api/complaints
   Role: Warden or Admin
======================================================== */
router.get("/", authMiddleware, isWarden, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT c.id, c.title, c.description, c.status, c.created_at,
              u.name AS student_name, u.email AS student_email
         FROM complaints c
         JOIN users u ON c.user_id = u.id
        ORDER BY c.created_at DESC`
    );

    res.json(result.rows);
  } catch (error) {
    console.error("❌ Error fetching complaints:", error);
    res.status(500).json({ message: "Error fetching complaints" });
  }
});

/* ========================================================
   🟡 WARDEN — Update complaint status
   --------------------------------------------------------
   Endpoint: PUT /api/complaints/:id/status
   Role: Warden only
   Status: pending | in-progress | resolved
======================================================== */
router.put("/:id/status", authMiddleware, isWarden, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ["pending", "in-progress", "resolved"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        message: "Invalid status. Use pending / in-progress / resolved.",
      });
    }

    const result = await pool.query(
      `UPDATE complaints
          SET status = $1
        WHERE id = $2
        RETURNING id, title, status`,
      [status, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Complaint not found" });
    }

    res.json({
      message: `Complaint status updated to '${status}' ✅`,
      complaint: result.rows[0],
    });
  } catch (error) {
    console.error("❌ Error updating complaint status:", error);
    res.status(500).json({ message: "Error updating complaint status" });
  }
});

/* ========================================================
   🟢 Optional: Allow POST as alias for PUT (if frontend limitation)
======================================================== */
router.post("/:id/status", (req, res, next) => {
  req.method = "PUT";
  next();
});

module.exports = router;
