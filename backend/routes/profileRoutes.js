const express = require("express");
const router = express.Router();
const pool = require("../db");
const {
  authMiddleware,
  isWarden,
  isStudent,
} = require("../middleware/authMiddleware");

/* =====================================================
   🟢 CREATE or UPDATE Student Profile (Warden only)
   -----------------------------------------------------
   POST /api/profile/create
===================================================== */
router.post("/create", authMiddleware, isWarden, async (req, res) => {
  try {
    const {
      user_id,
      id_type,
      id_number,
      dept_branch,
      year,
      batch, // 🆕 Added
      room_no,
      phone_number,
      gender,
      dob,
      address,
      father_name,
      father_number,
      mother_name,
      mother_number,
      profile_photo,
    } = req.body;

    if (!user_id || !id_type || !id_number || !dept_branch || !year || !batch) {
      return res.status(400).json({ message: "Required fields are missing" });
    }

    // Check if profile exists
    const check = await pool.query(
      "SELECT * FROM student_profiles WHERE user_id = $1",
      [user_id]
    );

    if (check.rows.length > 0) {
      // Update existing profile
      const updateQuery = `
        UPDATE student_profiles SET
          id_type=$2, id_number=$3, dept_branch=$4, year=$5, batch=$6, room_no=$7,
          phone_number=$8, gender=$9, dob=$10, address=$11,
          father_name=$12, father_number=$13, mother_name=$14, mother_number=$15,
          profile_photo=$16, updated_at=NOW()
        WHERE user_id=$1
        RETURNING *;
      `;
      const result = await pool.query(updateQuery, [
        user_id,
        id_type,
        id_number,
        dept_branch,
        year,
        batch,
        room_no,
        phone_number,
        gender,
        dob,
        address,
        father_name,
        father_number,
        mother_name,
        mother_number,
        profile_photo,
      ]);

      return res.status(200).json({
        message: "Profile updated successfully ✅",
        profile: result.rows[0],
      });
    } else {
      // Insert new profile
      const insertQuery = `
        INSERT INTO student_profiles (
          user_id, id_type, id_number, dept_branch, year, batch, room_no,
          phone_number, gender, dob, address,
          father_name, father_number, mother_name, mother_number, profile_photo
        )
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
        RETURNING *;
      `;
      const result = await pool.query(insertQuery, [
        user_id,
        id_type,
        id_number,
        dept_branch,
        year,
        batch,
        room_no,
        phone_number,
        gender,
        dob,
        address,
        father_name,
        father_number,
        mother_name,
        mother_number,
        profile_photo,
      ]);

      return res.status(201).json({
        message: "Profile created successfully ✅",
        profile: result.rows[0],
      });
    }
  } catch (err) {
    console.error("❌ Error creating profile:", err.message);
    res.status(500).json({ message: "Internal server error" });
  }
});

/* =====================================================
   🟠 GET Student Profile (Student View Only)
   -----------------------------------------------------
   GET /api/profile/:user_id
===================================================== */
router.get("/:user_id", authMiddleware, isStudent, async (req, res) => {
  try {
    const { user_id } = req.params;

    const result = await pool.query(
      "SELECT * FROM student_profiles WHERE user_id = $1",
      [user_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Profile not found" });
    }

    res.status(200).json(result.rows[0]);
  } catch (err) {
    console.error("❌ Error fetching profile:", err.message);
    res.status(500).json({ message: "Internal server error" });
  }
});

/* =====================================================
   🟢 GET All Student Profiles (Warden View)
   -----------------------------------------------------
   GET /api/profile/all
===================================================== */
router.get("/all", authMiddleware, isWarden, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        u.id AS user_id,
        u.name AS student_name,
        u.email,
        p.id_type,
        p.id_number,
        p.dept_branch,
        p.year,
        p.batch,
        p.room_no,
        p.phone_number,
        p.gender,
        p.father_name,
        p.mother_name
      FROM student_profiles p
      JOIN users u ON u.id = p.user_id
      WHERE u.role = 'student'
      ORDER BY u.id ASC;
    `);
    res.status(200).json(result.rows);
  } catch (err) {
    console.error("❌ Error fetching all student profiles:", err.message);
    res.status(500).json({ message: "Internal server error" });
  }
});

module.exports = router;
