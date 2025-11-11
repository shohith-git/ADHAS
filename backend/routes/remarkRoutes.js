const express = require("express");
const router = express.Router();
const { authMiddleware, isWarden } = require("../middleware/authMiddleware");
const pool = require("../db");

// 🟢 Get all remarks for a student
router.get("/:studentId", authMiddleware, async (req, res) => {
  try {
    const { studentId } = req.params;
    const result = await pool.query(
      `SELECT r.id, r.remark, r.created_at, u.name AS warden_name
       FROM remarks r
       LEFT JOIN users u ON u.id = r.warden_id
       WHERE r.student_id = $1
       ORDER BY r.created_at DESC`,
      [studentId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error("❌ Error fetching remarks:", err.message);
    res.status(500).json({ message: "Error fetching remarks" });
  }
});

// 🟠 Add a new remark
router.post("/:studentId", authMiddleware, isWarden, async (req, res) => {
  try {
    const { studentId } = req.params;
    const { remark } = req.body;
    const wardenId = req.user.id;

    if (!remark || !remark.trim()) {
      return res.status(400).json({ message: "Remark text is required" });
    }

    const result = await pool.query(
      `INSERT INTO remarks (student_id, warden_id, remark)
       VALUES ($1, $2, $3)
       RETURNING id, remark, created_at`,
      [studentId, wardenId, remark]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("❌ Error adding remark:", err.message);
    res.status(500).json({ message: "Error adding remark" });
  }
});

module.exports = router;
