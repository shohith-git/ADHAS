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
   🧾 Get all past students WITH their complaints
===================================================== */
router.get("/past", authMiddleware, isWarden, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        ps.*,

        -- All complaints made by this student
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

        -- Total number of complaints
        (
          SELECT COUNT(*)
          FROM complaints c
          WHERE c.user_id = ps.user_id
        ) AS complaint_count

      FROM past_students ps
      ORDER BY ps.left_at DESC NULLS LAST
    `);

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
   🧍 Get single student (with full profile info)
   NOTE: removed sp.warden_remarks (column didn't exist)
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

    console.log(`✅ Student fetched for ID ${id}`);
    res.json(student.rows[0]);
  } catch (err) {
    console.error("❌ Error fetching student:", err);
    res.status(500).json({ message: "Error fetching student" });
  }
});

/* =====================================================
   📝 Add or update student profile (Warden only)
   (keeps hostel_id handling and room occupancy logic)
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

    // 🔹 Update or insert profile
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

    // 🔹 Safe room occupancy update (unchanged)
    if (room_no) {
      const prevRoom = existing.rows[0]?.room_no || null;
      if (prevRoom && prevRoom !== room_no) {
        const prevRoomRes = await client.query(
          "SELECT sharing, occupied FROM rooms WHERE room_number = $1 FOR UPDATE",
          [String(prevRoom)]
        );

        if (prevRoomRes.rows.length > 0) {
          const sharingPrev = Number(prevRoomRes.rows[0].sharing) || 1;
          const occupiedPrev = Number(prevRoomRes.rows[0].occupied) || 0;

          const newOccupiedPrev = Math.max(occupiedPrev - 1, 0);
          const newAvailablePrev = Math.max(sharingPrev - newOccupiedPrev, 0);

          await client.query(
            `UPDATE rooms SET occupied=$1, available=$2 WHERE room_number=$3`,
            [newOccupiedPrev, newAvailablePrev, String(prevRoom)]
          );
        }
      }

      const roomCheck = await client.query(
        "SELECT sharing, occupied FROM rooms WHERE room_number=$1 FOR UPDATE",
        [room_no]
      );

      if (roomCheck.rows.length > 0) {
        const sharing = Number(roomCheck.rows[0].sharing) || 1;
        const occupied = Number(roomCheck.rows[0].occupied) || 0;

        if (occupied < sharing) {
          const newOccupied = occupied + 1;
          const newAvailable = Math.max(sharing - newOccupied, 0);

          await client.query(
            `UPDATE rooms SET occupied=$1, available=$2 WHERE room_number=$3`,
            [newOccupied, newAvailable, room_no]
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
   🧾 Get all past students WITH complaints + remarks
===================================================== */
router.get("/past", authMiddleware, isWarden, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        ps.*,

        /* ----------------------------------------------
           Complaints array for this student
        ---------------------------------------------- */
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

        /* ----------------------------------------------
           Count of complaints
        ---------------------------------------------- */
        (
          SELECT COUNT(*)
          FROM complaints c
          WHERE c.user_id = ps.user_id
        ) AS complaint_count,

        /* ----------------------------------------------
           Student remarks (table: student_remarks)
        ---------------------------------------------- */
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

        /* ----------------------------------------------
           Count of individual remarks from table
        ---------------------------------------------- */
        (
          SELECT COUNT(*)
          FROM student_remarks sr
          WHERE sr.student_id = ps.user_id
        ) AS remark_count,

        /* ----------------------------------------------
           Combined all remarks (from past_students + remark table)
        ---------------------------------------------- */
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

    res.json(result.rows);
  } catch (err) {
    console.error("❌ Error fetching past students:", err);
    res.status(500).json({ message: "Error fetching past students" });
  }
});

module.exports = router;
