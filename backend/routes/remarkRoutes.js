// backend/routes/remarkRoutes.js
const express = require("express");
const router = express.Router();
const pool = require("../db");
const { authMiddleware, isWarden } = require("../middleware/authMiddleware");

/* =====================================================
   🧾 Add a new remark (warden only)
   Works for active + past students because remarks are tied to user_id
===================================================== */
router.post("/:userId", authMiddleware, isWarden, async (req, res) => {
  try {
    const { userId } = req.params;
    const { remark } = req.body;
    const wardenId = req.user.id;

    if (!remark || remark.trim() === "") {
      return res.status(400).json({ message: "Remark cannot be empty" });
    }

    // Insert remark
    const result = await pool.query(
      `INSERT INTO student_remarks (student_id, warden_id, remark, created_at)
       VALUES ($1, $2, $3, NOW())
       RETURNING id, remark, created_at`,
      [userId, wardenId, remark.trim()]
    );

    console.log(`✅ Remark added for user_id ${userId} by warden ${wardenId}`);

    res.status(201).json({
      id: result.rows[0].id,
      remark: result.rows[0].remark,
      created_at: result.rows[0].created_at,
      warden_name: req.user.name || "Warden",
    });
  } catch (err) {
    console.error("❌ Error adding remark:", err.message);
    res.status(500).json({ message: "Error adding remark" });
  }
});

/* =====================================================
   📋 Get all remarks for a student (active or past)
   Uses user_id because past_students.id ≠ users.id
===================================================== */
router.get("/:userId", authMiddleware, async (req, res) => {
  try {
    const { userId } = req.params;

    const result = await pool.query(
      `SELECT 
          r.id, 
          r.remark, 
          r.created_at, 
          u.name AS warden_name
       FROM student_remarks r
       LEFT JOIN users u ON r.warden_id = u.id
       WHERE r.student_id = $1
       ORDER BY r.created_at DESC`,
      [userId]
    );

    console.log(
      `✅ Remarks fetched for user_id ${userId}: ${result.rows.length}`
    );

    res.json(result.rows);
  } catch (err) {
    console.error("❌ Error fetching remarks:", err.message);
    res.status(500).json({ message: "Error fetching remarks" });
  }
});

module.exports = router;
