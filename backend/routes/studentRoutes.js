const express = require("express");
const router = express.Router();
const pool = require("../db");
const bcrypt = require("bcrypt");
const { authMiddleware, isWarden } = require("../middleware/authMiddleware");

/* =====================================================
   👨‍🎓 Register a new student (Warden only)
   -----------------------------------------------------
   POST /api/students/register
===================================================== */
router.post("/register", authMiddleware, isWarden, async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password)
      return res.status(400).json({ message: "All fields are required" });

    if (!email.endsWith("@cit_nc.edu.in"))
      return res.status(400).json({ message: "Invalid college email" });

    // Check if already exists
    const existing = await pool.query("SELECT * FROM users WHERE email = $1", [
      email,
    ]);
    if (existing.rows.length > 0)
      return res.status(400).json({ message: "Email already registered" });

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert new student
    const result = await pool.query(
      `INSERT INTO users (name, email, password, role, college_domain)
       VALUES ($1, $2, $3, 'student', 'cit_nc.edu.in')
       RETURNING id, name, email, role`,
      [name, email, hashedPassword]
    );

    res.status(201).json({
      message: "Student registered successfully ✅",
      student: result.rows[0],
    });
  } catch (err) {
    console.error("❌ Error registering student:", err);
    res.status(500).json({ message: "Server error while registering student" });
  }
});

/* =====================================================
   📋 Get all active students (Warden/Admin only)
   -----------------------------------------------------
   GET /api/students
===================================================== */
router.get("/", authMiddleware, isWarden, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, name, email, role, created_at
         FROM users
        WHERE role = 'student'
        ORDER BY created_at DESC`
    );
    res.json(result.rows);
  } catch (err) {
    console.error("❌ Error fetching students:", err);
    res.status(500).json({ message: "Error fetching students" });
  }
});

/* =====================================================
   ❌ Delete student (move to past_students first)
   -----------------------------------------------------
   DELETE /api/students/:id
===================================================== */
router.delete("/:id", authMiddleware, isWarden, async (req, res) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;
    console.log("🔹 DELETE /api/students/:id called:", id);

    await client.query("BEGIN");

    // Fetch student
    const result = await client.query(
      "SELECT * FROM users WHERE id=$1 AND role='student'",
      [id]
    );
    if (result.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ message: "Student not found" });
    }

    const student = result.rows[0];

    // ✅ Check which column exists (left_at or left_on)
    const colCheck = await client.query(`
      SELECT column_name FROM information_schema.columns
      WHERE table_name = 'past_students' 
      AND column_name IN ('left_at', 'left_on')
    `);
    const leftColumn =
      colCheck.rows.length > 0 ? colCheck.rows[0].column_name : "left_at";

    // Move to past_students (avoid duplicates)
    await client.query(
      `INSERT INTO past_students (name, email, role, college_domain, ${leftColumn})
       VALUES ($1, $2, $3, $4, NOW())
       ON CONFLICT (email) DO UPDATE
       SET name = EXCLUDED.name,
           role = EXCLUDED.role,
           college_domain = EXCLUDED.college_domain,
           ${leftColumn} = NOW()`,
      [student.name, student.email, student.role, student.college_domain]
    );

    // Delete from users
    await client.query("DELETE FROM users WHERE id=$1", [id]);
    await client.query("COMMIT");

    console.log(`✅ Student ${student.email} moved to past_students`);
    res.json({ message: `${student.name} moved to past student list ✅` });
  } catch (err) {
    await client.query("ROLLBACK").catch(() => {});
    console.error("❌ Error deleting student:", err);
    res.status(500).json({ message: "Error deleting student" });
  } finally {
    client.release();
  }
});

/* =====================================================
   📜 Get all past students (Warden/Admin only)
   -----------------------------------------------------
   GET /api/students/past
===================================================== */
router.get("/past", authMiddleware, isWarden, async (req, res) => {
  try {
    // Detect column name dynamically
    const colCheck = await pool.query(`
      SELECT column_name FROM information_schema.columns
      WHERE table_name = 'past_students'
      AND column_name IN ('left_at', 'left_on')
    `);
    const leftColumn =
      colCheck.rows.length > 0 ? colCheck.rows[0].column_name : "left_at";

    const result = await pool.query(
      `SELECT id, name, email, role, college_domain, ${leftColumn} AS left_at
       FROM past_students
       ORDER BY ${leftColumn} DESC`
    );

    res.json(result.rows);
  } catch (err) {
    console.error("❌ Error fetching past students:", err);
    res.status(500).json({ message: "Error fetching past students" });
  }
});

module.exports = router;
