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

    const existing = await pool.query("SELECT id FROM users WHERE email = $1", [
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

    res.status(201).json({
      message: "Student registered successfully",
      student: result.rows[0],
    });
  } catch (err) {
    console.error("❌ Error registering student:", err);
    res.status(500).json({ message: "Server error while registering student" });
  }
});

/* =====================================================
   🧾 Get all past students from student_history
   NOTE: stores remarks & complaints as structured JSON arrays
===================================================== */
router.get("/history", authMiddleware, isWarden, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        id,
        user_id,
        name,
        email,
        dept_branch,
        year,
        usn,
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
        -- remarks and complaints are already stored as jsonb in student_history,
        -- return them as-is (they should be arrays or empty arrays)
        COALESCE(remarks, '[]'::jsonb) AS remarks,
        COALESCE(complaints, '[]'::jsonb) AS complaints,
        created_at,
        left_at
      FROM student_history
      ORDER BY left_at DESC NULLS LAST;
    `);

    res.status(200).json(result.rows);
  } catch (err) {
    console.error("❌ Error fetching student history:", err);
    res.status(500).json({ message: "Error fetching student history" });
  }
});

/* =====================================================
   🧍 Get all active students (Warden/Admin only)
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
    res.json(result.rows);
  } catch (err) {
    console.error("❌ Error fetching students:", err);
    res.status(500).json({ message: "Error fetching students" });
  }
});

/* =====================================================
   🧍 Get single student (with full profile info)
   - Works for active users only (data lives in users + student_profiles)
===================================================== */
router.get("/:id", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const requester = req.user;

    if (!id || id === "null" || isNaN(Number(id))) {
      return res.status(400).json({ message: "Invalid student ID" });
    }

    // students can only fetch their own profile
    if (requester.role === "student" && Number(requester.id) !== Number(id)) {
      return res.status(403).json({ message: "Unauthorized access" });
    }

    const student = await pool.query(
      `SELECT 
          u.id, u.name, u.email, u.role,
          sp.usn, sp.dept_branch, sp.year, sp.batch, sp.room_no, sp.hostel_id,
          sp.phone_number, sp.gender, sp.dob, sp.address,
          sp.father_name, sp.father_number, sp.mother_name, sp.mother_number,
          sp.profile_photo, sp.created_at, sp.updated_at
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
   📝 Add or update student profile (Warden only)
   - Keeps room occupancy logic minimal here (if you want advanced locking, add FOR UPDATE in room ops)
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
      "SELECT id, room_no FROM student_profiles WHERE user_id = $1",
      [id]
    );

    // Update or insert profile
    if (existing.rows.length > 0) {
      await client.query(
        `UPDATE student_profiles
         SET usn=$1, dept_branch=$2, year=$3, batch=$4, room_no=$5, gender=$6, dob=$7,
             hostel_id=$8, phone_number=$9, address=$10, father_name=$11, father_number=$12,
             mother_name=$13, mother_number=$14, profile_photo=$15, updated_at=NOW()
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
      console.log(`✅ Updated profile for user_id=${id}`);
    } else {
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
      console.log(`✅ Inserted profile for user_id=${id}`);
    }

    // NOTE: room occupancy adjustments were in older code.
    // If you maintain rooms table occupancy, do that here with FOR UPDATE locks,
    // as shown previously in your history code. (Left out to keep this route focused.)
    await client.query("COMMIT");
    res.json({ message: "Student details saved successfully" });
  } catch (err) {
    await client.query("ROLLBACK").catch(() => {});
    console.error("❌ Error updating student details:", err);
    res.status(500).json({ message: "Server error while saving student info" });
  } finally {
    client.release();
  }
});

/* =====================================================
   ❌ Delete student (Move to student_history then delete)
   - Store structured remarks & complaints JSON arrays inside student_history
   - Transactional and safe
   - Attendance NOT moved (preserved design decision)
===================================================== */
router.delete("/:id", authMiddleware, isWarden, async (req, res) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;

    if (!id || isNaN(Number(id))) {
      return res.status(400).json({ message: "Invalid student ID" });
    }

    await client.query("BEGIN");

    // Verify student exists and grab combined profile
    const chk = await client.query(
      `SELECT u.id, u.name, u.email, u.role, u.college_domain, u.created_at,
              sp.usn, sp.dept_branch, sp.year, sp.batch, sp.room_no, sp.hostel_id,
              sp.phone_number, sp.gender, sp.dob, sp.address,
              sp.father_name, sp.father_number, sp.mother_name, sp.mother_number,
              sp.profile_photo
       FROM users u
       LEFT JOIN student_profiles sp ON sp.user_id = u.id
       WHERE u.id = $1 AND u.role = 'student'`,
      [id]
    );

    if (chk.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ message: "Student not found" });
    }

    // Insert into student_history with structured JSONB remarks & complaints.
    // We build compact JSON objects (select only the fields the frontend needs)
    await client.query(
      `INSERT INTO student_history (
         user_id, name, email, usn, dept_branch, year, batch, room_no, hostel_id,
         phone_number, gender, dob, address, father_name, father_number,
         mother_name, mother_number, profile_photo, remarks, complaints,
         role, college_domain, created_at, left_at
       )
       SELECT
         u.id,
         u.name,
         u.email,
         sp.usn,
         sp.dept_branch,
         sp.year,
         sp.batch,
         sp.room_no,
         sp.hostel_id,
         sp.phone_number,
         sp.gender,
         sp.dob,
         sp.address,
         sp.father_name,
         sp.father_number,
         sp.mother_name,
         sp.mother_number,
         sp.profile_photo,
         COALESCE((
           SELECT jsonb_agg(jsonb_build_object(
             'id', r.id,
             'remark', r.remark,
             'created_at', r.created_at,
             'warden_id', r.warden_id,
             'warden_name', wr.name
           ) ORDER BY r.created_at)
           FROM student_remarks r
           LEFT JOIN users wr ON wr.id = r.warden_id
           WHERE r.student_id = u.id
         ), '[]'::jsonb) AS remarks,
         COALESCE((
           SELECT jsonb_agg(jsonb_build_object(
             'id', c.id,
             'title', c.title,
             'description', c.description,
             'status', c.status,
             'room_no', c.room_no,
             'created_at', c.created_at,
             'updated_at', c.updated_at,
             'user_id', c.user_id,
             'student_id', c.student_id
           ) ORDER BY c.created_at)
           FROM complaints c
           WHERE c.student_id = u.id OR c.user_id = u.id
         ), '[]'::jsonb) AS complaints,
         u.role,
         u.college_domain,
         u.created_at,
         NOW()
       FROM users u
       LEFT JOIN student_profiles sp ON sp.user_id = u.id
       WHERE u.id = $1 AND u.role = 'student'`,
      [id]
    );

    // Delete remarks & complaints (both schemas) after archiving
    await client.query(`DELETE FROM student_remarks WHERE student_id = $1`, [
      id,
    ]);

    await client.query(
      `DELETE FROM complaints WHERE student_id = $1 OR user_id = $1`,
      [id]
    );

    // Remove profile and user
    await client.query("DELETE FROM student_profiles WHERE user_id = $1", [id]);
    await client.query("DELETE FROM users WHERE id = $1", [id]);

    await client.query("COMMIT");

    res.json({
      message: "Student archived into student_history and deleted successfully",
    });
  } catch (err) {
    await client.query("ROLLBACK").catch(() => {});
    console.error("❌ Error deleting student:", err);
    res.status(500).json({ message: "Error deleting student" });
  } finally {
    client.release();
  }
});

module.exports = router;
