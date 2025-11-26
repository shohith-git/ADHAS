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
   🧾 Get students history (UNIFIED VERSION)
   → Supports BOTH past_students (your working UI)
   → AND student_history table (new system)
===================================================== */
router.get("/history", authMiddleware, isWarden, async (req, res) => {
  try {
    // Prefer new table if exists
    const historyCheck = await pool.query(
      `SELECT to_regclass('student_history') AS exists`
    );

    const hasHistory = historyCheck.rows[0]?.exists !== null;

    let result;

    if (hasHistory) {
      // NEW SYSTEM: student_history
      result = await pool.query(
        `SELECT 
          id, user_id, name, email, college_domain, role,
          usn, dept_branch, year, batch,
          room_no, hostel_id, phone_number,
          gender, dob, address,
          father_name, father_number,
          mother_name, mother_number,
          profile_photo,
          remarks,
          complaints,
          created_at,
          left_at
        FROM student_history
        ORDER BY left_at DESC NULLS LAST`
      );
    } else {
      // OLD SYSTEM: past_students + compute all complaints + remarks
      result = await pool.query(`
        SELECT 
          ps.*,

          (
            SELECT COALESCE(
              json_agg(
                json_build_object(
                  'id', c.id,
                  'title', c.title,
                  'description', c.description,
                  'status', c.status,
                  'created_at', c.created_at,
                  'updated_at', c.updated_at
                )
              ), '[]'
            )
            FROM complaints c
            WHERE c.user_id = ps.user_id
          ) AS complaints,

          (
            SELECT COUNT(*)
            FROM complaints c
            WHERE c.user_id = ps.user_id
          ) AS complaint_count,

          (
            SELECT COALESCE(
              json_agg(
                json_build_object(
                  'id', sr.id,
                  'remark', sr.remark,
                  'warden_id', sr.warden_id,
                  'created_at', sr.created_at
                )
              ), '[]'
            )
            FROM student_remarks sr
            WHERE sr.student_id = ps.user_id
          ) AS student_remarks,

          (
            SELECT COUNT(*)
            FROM student_remarks sr
            WHERE sr.student_id = ps.user_id
          ) AS remark_count,

          (
            SELECT TRIM(
              BOTH ' | ' FROM
              CONCAT(
                COALESCE(ps.warden_remarks, ''),
                ' | ',
                COALESCE(
                  (
                    SELECT string_agg(sr.remark, ' | ')
                    FROM student_remarks sr
                    WHERE sr.student_id = ps.user_id
                  ), ''
                )
              )
            )
          ) AS all_remarks

        FROM past_students ps
        ORDER BY ps.left_at DESC NULLS LAST
      `);
    }

    console.log(`✅ students history fetched: ${result.rows.length}`);
    res.json(result.rows);
  } catch (err) {
    console.error("❌ Error fetching students history:", err);
    res.status(500).json({ message: "Error fetching students history" });
  }
});

/* =====================================================
   🧍 Get ACTIVE students list
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
   🧍 Get single ACTIVE student profile
===================================================== */
router.get("/:id", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const requester = req.user;

    if (!id || isNaN(Number(id))) {
      return res.status(400).json({ message: "Invalid student ID" });
    }

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
   📝 Add or update student profile + room sync
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

    const prevRoom = existing.rows[0]?.room_no || null;

    // -------------------------
    // 1) UPDATE OR INSERT PROFILE
    // -------------------------
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
      await client.query(
        `INSERT INTO student_profiles (
          user_id, usn, dept_branch, year, batch, room_no,
          gender, dob, hostel_id, phone_number, address,
          father_name, father_number, mother_name, mother_number, profile_photo
        )
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

    // -------------------------
    // 2) ROOM CHANGE HANDLING
    // -------------------------
    if (room_no) {
      if (prevRoom && prevRoom !== room_no) {
        await client.query(
          `UPDATE rooms
           SET occupied = GREATEST(occupied - 1, 0)
           WHERE room_number=$1`,
          [prevRoom]
        );
      }

      await client.query(
        `UPDATE rooms
         SET occupied = LEAST(occupied + 1, sharing)
         WHERE room_number=$1`,
        [room_no]
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
   🧾 ARCHIVE + DELETE Student
   (Moves to student_history table)
===================================================== */
router.delete("/:id", authMiddleware, isWarden, async (req, res) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;

    if (!id || isNaN(Number(id)))
      return res.status(400).json({ message: "Invalid student ID" });

    await client.query("BEGIN");

    // Fetch full student data
    const studentRes = await client.query(
      `SELECT 
         u.id AS user_id, u.name, u.email, u.role,
         u.college_domain, u.created_at,
         sp.usn, sp.dept_branch, sp.year, sp.batch,
         sp.room_no, sp.hostel_id, sp.phone_number,
         sp.gender, sp.dob, sp.address,
         sp.father_name, sp.father_number,
         sp.mother_name, sp.mother_number,
         sp.profile_photo
       FROM users u
       LEFT JOIN student_profiles sp ON sp.user_id=u.id
       WHERE u.id=$1 AND u.role='student'`,
      [id]
    );

    if (studentRes.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ message: "Student not found" });
    }

    const s = studentRes.rows[0];

    // Fetch remarks
    const remarksRes = await client.query(
      `SELECT id, student_id, warden_id, remark, created_at
       FROM student_remarks
       WHERE student_id=$1
       ORDER BY created_at ASC`,
      [id]
    );

    const remarks = remarksRes.rows;

    // Fetch complaints
    const complaintsRes = await client.query(
      `SELECT id, title, description, status, created_at, updated_at
       FROM complaints WHERE user_id=$1
       ORDER BY created_at ASC`,
      [id]
    );

    const complaints = complaintsRes.rows;

    // Free room
    if (s.room_no) {
      await client.query(
        `UPDATE rooms
         SET occupied = GREATEST(occupied - 1, 0)
         WHERE room_number=$1`,
        [s.room_no]
      );
    }

    // Insert into student_history
    await client.query(
      `INSERT INTO student_history (
        user_id, name, email, college_domain, role,
        usn, dept_branch, year, batch, room_no, hostel_id,
        phone_number, gender, dob, address,
        father_name, father_number, mother_name, mother_number,
        profile_photo,
        remarks, complaints,
        created_at, left_at
      )
      VALUES (
        $1,$2,$3,$4,$5,
        $6,$7,$8,$9,$10,$11,
        $12,$13,$14,$15,
        $16,$17,$18,$19,
        $20,
        $21,$22,
        $23,
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
        JSON.stringify(remarks),
        JSON.stringify(complaints),
        s.created_at,
      ]
    );

    // Delete dependent data
    await client.query("DELETE FROM student_remarks WHERE student_id=$1", [id]);
    await client.query("DELETE FROM complaints WHERE user_id=$1", [id]);

    // Delete profile and user
    await client.query("DELETE FROM student_profiles WHERE user_id=$1", [id]);
    await client.query("DELETE FROM users WHERE id=$1", [id]);

    await client.query("COMMIT");

    res.json({
      message: "Student archived and deleted successfully ✅",
      archived: {
        complaints: complaints.length,
        remarks: remarks.length,
      },
    });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("❌ Error deleting student:", err);
    res.status(500).json({ message: "Error deleting student" });
  } finally {
    client.release();
  }
});

module.exports = router;
