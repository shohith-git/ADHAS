// backend/routes/studentRoutes.js
const express = require("express");
const router = express.Router();
const pool = require("../db");
const bcrypt = require("bcrypt");
const { authMiddleware, isWarden } = require("../middleware/authMiddleware");

/* =====================================================
   🧾 Register new student (Warden only)
===================================================== */
router.post("/register", authMiddleware, isWarden, async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password)
      return res.status(400).json({ message: "All fields are required" });

    if (!email.endsWith("@cit_nc.edu.in"))
      return res.status(400).json({ message: "Invalid college email" });

    const existing = await pool.query("SELECT id FROM users WHERE email=$1", [
      email,
    ]);
    if (existing.rows.length > 0)
      return res.status(400).json({ message: "Email already registered" });

    const hashedPassword = await bcrypt.hash(password, 10);

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
   🧾 Get all students history
   (From table: student_history)
===================================================== */
router.get("/history", authMiddleware, isWarden, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT 
          id,
          user_id,
          name,
          email,
          college_domain,
          role,
          usn,
          dept_branch,
          year,
          batch,
          room_no,
          hostel_id,
          phone_number,
          gender,
          dob,
          address,
          father_name,
          father_number,
          mother_name,
          mother_number,
          profile_photo,
          remarks,
          complaints,
          created_at,
          left_at
       FROM student_history
       ORDER BY left_at DESC NULLS LAST`
    );

    console.log(`✅ students history fetched: ${result.rows.length}`);
    res.json(result.rows);
  } catch (err) {
    console.error("❌ Error fetching students history:", err);
    res.status(500).json({ message: "Error fetching students history" });
  }
});

/* =====================================================
   🧍 Get all ACTIVE students (Warden/Admin only)
===================================================== */
router.get("/", authMiddleware, isWarden, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT 
        u.id, u.name, u.email, u.role, u.created_at,
        sp.usn, sp.dept_branch, sp.year, sp.batch,
        sp.room_no, sp.profile_photo, sp.hostel_id
       FROM users u
       LEFT JOIN student_profiles sp ON sp.user_id = u.id
       WHERE u.role = 'student'
       ORDER BY u.created_at DESC`
    );

    console.log(`✅ Active students fetched: ${result.rows.length}`);
    res.json(result.rows);
  } catch (err) {
    console.error("❌ Error fetching students:", err);
    res.status(500).json({ message: "Error fetching students" });
  }
});

/* =====================================================
   🧍 Get single ACTIVE student (full profile)
===================================================== */
router.get("/:id", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const requester = req.user;

    if (!id || isNaN(Number(id))) {
      return res.status(400).json({ message: "Invalid student ID" });
    }

    // Students can only fetch themselves
    if (requester.role === "student" && Number(requester.id) !== Number(id)) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    const student = await pool.query(
      `SELECT 
          u.id, u.name, u.email, u.role,
          sp.usn, sp.dept_branch, sp.year, sp.batch,
          sp.room_no, sp.hostel_id,
          sp.phone_number, sp.gender, sp.dob, sp.address,
          sp.father_name, sp.father_number, sp.mother_name, sp.mother_number,
          sp.profile_photo, sp.created_at, sp.updated_at
       FROM users u
       LEFT JOIN student_profiles sp ON sp.user_id = u.id
       WHERE u.id=$1 AND u.role='student'`,
      [id]
    );

    if (student.rows.length === 0)
      return res.status(404).json({ message: "Student not found" });

    console.log(`✅ Student fetched for ID ${id}`);
    res.json(student.rows[0]);
  } catch (err) {
    console.error("❌ Error fetching student:", err);
    res.status(500).json({ message: "Error fetching student" });
  }
});

/* =====================================================
   📝 Add or update student profile
===================================================== */
router.put("/:id/details", authMiddleware, isWarden, async (req, res) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;
    const {
      usn,
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
      profile_photo,
      hostel_id,
    } = req.body;

    await client.query("BEGIN");

    const existing = await client.query(
      "SELECT id, room_no FROM student_profiles WHERE user_id=$1",
      [id]
    );

    // Update
    if (existing.rows.length > 0) {
      await client.query(
        `UPDATE student_profiles
         SET usn=$1, dept_branch=$2, year=$3, batch=$4, room_no=$5,
             gender=$6, dob=$7, hostel_id=$8, phone_number=$9, address=$10,
             father_name=$11, father_number=$12, mother_name=$13, mother_number=$14,
             profile_photo=$15, updated_at=NOW()
         WHERE user_id=$16`,
        [
          usn,
          dept_branch,
          year,
          batch,
          room_no,
          gender,
          dob,
          hostel_id,
          phone_number,
          address,
          father_name,
          father_number,
          mother_name,
          mother_number,
          profile_photo,
          id,
        ]
      );
    } else {
      // Insert
      await client.query(
        `INSERT INTO student_profiles 
         (user_id, usn, dept_branch, year, batch, room_no, gender, dob, hostel_id,
          phone_number, address, father_name, father_number, mother_name,
          mother_number, profile_photo)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)`,
        [
          id,
          usn,
          dept_branch,
          year,
          batch,
          room_no,
          gender,
          dob,
          hostel_id,
          phone_number,
          address,
          father_name,
          father_number,
          mother_name,
          mother_number,
          profile_photo,
        ]
      );
    }

    await client.query("COMMIT");
    res.json({ message: "Student details saved successfully ✅" });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("❌ Error updating student details:", err);
    res.status(500).json({ message: "Error updating student details" });
  } finally {
    client.release();
  }
});

/* =====================================================
   ❌ Delete student → Move to student_history
===================================================== */
router.delete("/:id", authMiddleware, isWarden, async (req, res) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;

    if (!id || isNaN(Number(id))) {
      return res.status(400).json({ message: "Invalid student ID" });
    }

    await client.query("BEGIN");

    // Fetch entire student record
    const result = await client.query(
      `SELECT 
         u.id AS user_id, u.name, u.email, u.role, u.college_domain, u.created_at,
         sp.usn, sp.dept_branch, sp.year, sp.batch,
         sp.room_no, sp.hostel_id, sp.phone_number,
         sp.gender, sp.dob, sp.address,
         sp.father_name, sp.father_number,
         sp.mother_name, sp.mother_number,
         sp.profile_photo
       FROM users u
       LEFT JOIN student_profiles sp ON sp.user_id = u.id
       WHERE u.id=$1 AND u.role='student'`,
      [id]
    );

    if (result.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ message: "Student not found" });
    }

    const s = result.rows[0];

    // Insert into student_history
    await client.query(
      `INSERT INTO student_history (
        user_id, name, email, college_domain, role,
        usn, dept_branch, year, batch, room_no, hostel_id,
        phone_number, gender, dob, address,
        father_name, father_number, mother_name, mother_number,
        profile_photo,
        remarks,
        complaints,
        created_at,
        left_at
      )
      VALUES (
        $1,$2,$3,$4,$5,
        $6,$7,$8,$9,$10,$11,
        $12,$13,$14,$15,
        $16,$17,$18,$19,
        $20,
        '[]',
        '[]',
        $21,
        NOW()
      )`,
      [
        s.user_id,
        s.name,
        s.email,
        s.college_domain,
        s.role,
        s.usn,
        s.dept_branch,
        s.year,
        s.batch,
        s.room_no,
        s.hostel_id,
        s.phone_number,
        s.gender,
        s.dob,
        s.address,
        s.father_name,
        s.father_number,
        s.mother_name,
        s.mother_number,
        s.profile_photo,
        s.created_at,
      ]
    );

    await client.query("DELETE FROM student_profiles WHERE user_id=$1", [id]);
    await client.query("DELETE FROM users WHERE id=$1", [id]);

    await client.query("COMMIT");
    res.json({ message: "Student moved to student_history ✅" });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("❌ Error deleting student:", err);
    res.status(500).json({ message: "Error deleting student" });
  } finally {
    client.release();
  }
});

module.exports = router;
