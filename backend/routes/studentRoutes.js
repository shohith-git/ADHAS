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
   🧾 Get all past students (must come BEFORE /:id)
===================================================== */
router.get("/past", authMiddleware, isWarden, async (req, res) => {
  try {
    const colCheck = await pool.query(
      `SELECT column_name FROM information_schema.columns
       WHERE table_name = 'past_students'
         AND column_name IN ('left_at', 'left_on')`
    );

    const leftColumn =
      colCheck.rows.length > 0 ? colCheck.rows[0].column_name : "left_at";

    const result = await pool.query(
      `SELECT id, name, email, role, college_domain, ${leftColumn} AS left_at
       FROM past_students
       ORDER BY ${leftColumn} DESC`
    );

    console.log(`✅ Past students fetched: ${result.rows.length}`);
    res.json(result.rows);
  } catch (err) {
    console.error("❌ Error fetching past students:", err);
    res.status(500).json({ message: "Error fetching past students" });
  }
});

/* =====================================================
   🧍 Get all active students (Warden/Admin only)
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
   🧍 Get single student (with profile info)
===================================================== */
router.get("/:id", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const requester = req.user;

    if (!id || id === "null" || isNaN(Number(id))) {
      return res.status(400).json({ message: "Invalid student ID" });
    }

    if (requester.role === "student" && Number(requester.id) !== Number(id)) {
      return res.status(403).json({ message: "Unauthorized access" });
    }

    const student = await pool.query(
      `SELECT u.id, u.name, u.email, u.role,
              sp.usn, sp.dept_branch, sp.year, sp.batch, sp.room_no,
              sp.gender, sp.dob, sp.phone_number, sp.address,
              sp.father_name, sp.father_number, sp.mother_name, sp.mother_number,
              sp.profile_photo
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
===================================================== */
router.put("/:id/details", authMiddleware, isWarden, async (req, res) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;

    if (!id || id === "null" || isNaN(Number(id))) {
      return res.status(400).json({ message: "Invalid student ID" });
    }

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
    } = req.body;

    await client.query("BEGIN");

    const existing = await client.query(
      "SELECT id, room_no FROM student_profiles WHERE user_id = $1",
      [id]
    );

    if (existing.rows.length > 0) {
      await client.query(
        `UPDATE student_profiles
         SET usn=$1, dept_branch=$2, year=$3, batch=$4, room_no=$5, gender=$6, dob=$7,
             phone_number=$8, address=$9, father_name=$10, father_number=$11,
             mother_name=$12, mother_number=$13, profile_photo=$14, updated_at=NOW()
         WHERE user_id=$15`,
        [
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
          id,
        ]
      );
      console.log(`✅ Updated profile for user_id=${id}`);
    } else {
      await client.query(
        `INSERT INTO student_profiles
         (user_id, usn, dept_branch, year, batch, room_no, gender, dob,
          phone_number, address, father_name, father_number, mother_name,
          mother_number, profile_photo)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)`,
        [
          id,
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
        ]
      );
      console.log(`✅ Inserted profile for user_id=${id}`);
    }

    if (room_no) {
      const prevRoom =
        existing.rows.length > 0 ? existing.rows[0].room_no : null;

      if (prevRoom && prevRoom !== room_no) {
        await client.query(
          `UPDATE rooms
           SET occupied = GREATEST(COALESCE(occupied,0)-1,0),
               available = GREATEST(COALESCE(sharing,1)-GREATEST(COALESCE(occupied,0)-1,0),0)
           WHERE room_number=$1`,
          [prevRoom]
        );
      }

      const roomCheck = await client.query(
        "SELECT sharing, occupied FROM rooms WHERE room_number=$1 FOR UPDATE",
        [room_no]
      );

      if (roomCheck.rows.length > 0) {
        const { sharing, occupied } = roomCheck.rows[0];
        if (occupied < sharing) {
          await client.query(
            `UPDATE rooms
             SET occupied=$1, available=GREATEST($2-$1,0)
             WHERE room_number=$3`,
            [occupied + 1, sharing, room_no]
          );
        }
      }
    }

    await client.query("COMMIT");
    res.json({ message: "Student details saved successfully ✅" });
  } catch (err) {
    await client.query("ROLLBACK").catch(() => {});
    console.error("❌ Error updating student details:", err);
    res.status(500).json({ message: "Server error while saving student info" });
  } finally {
    client.release();
  }
});

/* =====================================================
   ❌ Delete student (Move to past_students first)
===================================================== */
router.delete("/:id", authMiddleware, isWarden, async (req, res) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;
    if (!id || id === "null" || isNaN(Number(id))) {
      return res.status(400).json({ message: "Invalid student ID" });
    }

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

    const colCheck = await client.query(
      `SELECT column_name FROM information_schema.columns
       WHERE table_name='past_students'
         AND column_name IN ('left_at','left_on')`
    );
    const leftColumn =
      colCheck.rows.length > 0 ? colCheck.rows[0].column_name : "left_at";

    await client.query(
      `INSERT INTO past_students (name,email,role,college_domain,${leftColumn})
       VALUES ($1,$2,$3,$4,NOW())
       ON CONFLICT (email) DO UPDATE
       SET name=EXCLUDED.name,
           role=EXCLUDED.role,
           college_domain=EXCLUDED.college_domain,
           ${leftColumn}=NOW()`,
      [student.name, student.email, student.role, student.college_domain]
    );

    const prof = await client.query(
      "SELECT room_no FROM student_profiles WHERE user_id=$1",
      [id]
    );
    if (prof.rows.length > 0 && prof.rows[0].room_no) {
      const r = prof.rows[0].room_no;
      await client.query(
        `UPDATE rooms
         SET occupied=GREATEST(COALESCE(occupied,0)-1,0),
             available=GREATEST(COALESCE(sharing,1)-GREATEST(COALESCE(occupied,0)-1,0),0)
         WHERE room_number=$1`,
        [r]
      );
    }

    await client.query("DELETE FROM student_profiles WHERE user_id=$1", [id]);
    await client.query("DELETE FROM users WHERE id=$1", [id]);

    await client.query("COMMIT");
    console.log(`✅ Moved ${student.email} to past_students`);
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
