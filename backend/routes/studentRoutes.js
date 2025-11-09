// 📁 backend/routes/studentRoutes.js
const express = require("express");
const router = express.Router();
const pool = require("../db");
const bcrypt = require("bcrypt");
const { authMiddleware, isWarden } = require("../middleware/authMiddleware");

/* =====================================================
   👨‍🎓 Register a new student (Warden only)
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
    const existing = await pool.query("SELECT id FROM users WHERE email = $1", [
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

    console.log(`✅ Registered new student: ${email}`);
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
   GET /api/students
   Returns joined profile fields so frontend can classify
===================================================== */
router.get("/", authMiddleware, isWarden, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT 
          u.id,
          u.name,
          u.email,
          u.role,
          u.created_at,
          sp.dept_branch,
          sp.year,
          sp.batch,
          sp.room_no
       FROM users u
       LEFT JOIN student_profiles sp ON sp.user_id = u.id
       WHERE u.role = 'student'
       ORDER BY u.created_at DESC`
    );
    res.json(result.rows);
  } catch (err) {
    console.error("❌ Error fetching students:", err);
    res.status(500).json({ message: "Error fetching students" });
  }
});

/* =====================================================
   📜 Get all past students (Warden/Admin only)
   ⚠️ Must be placed BEFORE /:id to avoid route conflict
   GET /api/students/past
===================================================== */
router.get("/past", authMiddleware, isWarden, async (req, res) => {
  try {
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

/* =====================================================
   👤 Get single student (with profile info)
   GET /api/students/:id
===================================================== */
router.get("/:id", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const requester = req.user; // from authMiddleware

    // Validate ID
    if (!id || id === "null" || isNaN(Number(id))) {
      return res.status(400).json({ message: "Invalid student ID" });
    }

    // Student can only view own profile
    if (requester.role === "student" && Number(requester.id) !== Number(id)) {
      return res.status(403).json({ message: "Unauthorized access" });
    }

    const student = await pool.query(
      `SELECT u.id, u.name, u.email, u.role, sp.dept_branch, sp.year, sp.batch,
              sp.room_no, sp.gender, sp.dob, sp.phone_number, sp.address,
              sp.father_name, sp.father_number, sp.mother_name, sp.mother_number
       FROM users u
       LEFT JOIN student_profiles sp ON sp.user_id = u.id
       WHERE u.id = $1 AND u.role = 'student'`,
      [id]
    );

    if (student.rows.length === 0)
      return res.status(404).json({ message: "Student not found" });

    res.json(student.rows[0]);
  } catch (err) {
    console.error("❌ Error fetching student:", err);
    res.status(500).json({ message: "Error fetching student" });
  }
});

/* =====================================================
   📝 Add or update student profile details
   PUT /api/students/:id/details
===================================================== */
router.put("/:id/details", authMiddleware, isWarden, async (req, res) => {
  try {
    const { id } = req.params;

    if (!id || id === "null" || isNaN(Number(id))) {
      return res.status(400).json({ message: "Invalid student ID" });
    }

    const {
      dept_branch,
      year,
      batch,
      room_no,
      gender,
      dob,
      phone_number,
      address,
      father_name,
      father_number,
      mother_name,
      mother_number,
    } = req.body;

    const existing = await pool.query(
      "SELECT id FROM student_profiles WHERE user_id = $1",
      [id]
    );

    if (existing.rows.length > 0) {
      await pool.query(
        `UPDATE student_profiles
         SET dept_branch=$1, year=$2, batch=$3, room_no=$4, gender=$5, dob=$6,
             phone_number=$7, address=$8, father_name=$9, father_number=$10,
             mother_name=$11, mother_number=$12, updated_at=NOW()
         WHERE user_id=$13`,
        [
          dept_branch,
          year,
          batch,
          room_no,
          gender,
          dob,
          phone_number,
          address,
          father_name,
          father_number,
          mother_name,
          mother_number,
          id,
        ]
      );
      console.log(`✅ Updated profile for user_id=${id}`);
      return res.json({ message: "Student details updated successfully ✅" });
    } else {
      await pool.query(
        `INSERT INTO student_profiles
          (user_id, dept_branch, year, batch, room_no, gender, dob,
           phone_number, address, father_name, father_number,
           mother_name, mother_number)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)`,
        [
          id,
          dept_branch,
          year,
          batch,
          room_no,
          gender,
          dob,
          phone_number,
          address,
          father_name,
          father_number,
          mother_name,
          mother_number,
        ]
      );
      console.log(`✅ Inserted profile for user_id=${id}`);
      return res.json({ message: "Student details added successfully ✅" });
    }
  } catch (err) {
    console.error("❌ Error updating student details:", err);
    res.status(500).json({ message: "Server error while saving student info" });
  }
});

/* =====================================================
   ❌ Delete student (move to past_students first)
   DELETE /api/students/:id
===================================================== */
router.delete("/:id", authMiddleware, isWarden, async (req, res) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;

    if (!id || id === "null" || isNaN(Number(id))) {
      return res.status(400).json({ message: "Invalid student ID" });
    }

    console.log("🔹 DELETE /api/students/:id called:", id);
    await client.query("BEGIN");

    const result = await client.query(
      "SELECT * FROM users WHERE id=$1 AND role='student'",
      [id]
    );
    if (result.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ message: "Student not found" });
    }

    const student = result.rows[0];

    // Detect correct column (left_at / left_on)
    const colCheck = await client.query(`
      SELECT column_name FROM information_schema.columns
      WHERE table_name = 'past_students' 
        AND column_name IN ('left_at', 'left_on')
    `);
    const leftColumn =
      colCheck.rows.length > 0 ? colCheck.rows[0].column_name : "left_at";

    // Move to past_students table
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

module.exports = router;
