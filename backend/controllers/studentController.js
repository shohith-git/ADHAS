// backend/controllers/studentController.js
const pool = require("../db");

// GET a single student by ID
const getStudentById = async (req, res) => {
  try {
    const { id } = req.params;
    const student = await pool.query(
      `SELECT u.id, u.name, u.email, sp.dept_branch, sp.year, sp.batch,
              sp.room_no, sp.gender, sp.dob, sp.phone_number, sp.address,
              sp.father_name, sp.father_number, sp.mother_name, sp.mother_number
       FROM users u
       LEFT JOIN student_profiles sp ON sp.user_id = u.id
       WHERE u.id = $1`,
      [id]
    );

    if (student.rows.length === 0)
      return res.status(404).json({ message: "Student not found" });

    res.json(student.rows[0]);
  } catch (err) {
    console.error("Error fetching student:", err.message);
    res.status(500).json({ message: "Server error" });
  }
};

// ADD or UPDATE student profile details
const updateStudentDetails = async (req, res) => {
  try {
    const { id } = req.params;
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
      "SELECT * FROM student_profiles WHERE user_id = $1",
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
      return res.json({ message: "Student details updated successfully" });
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
      return res.json({ message: "Student details added successfully" });
    }
  } catch (err) {
    console.error("Error updating student details:", err.message);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  getStudentById,
  updateStudentDetails,
};
