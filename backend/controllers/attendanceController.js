const pool = require("../db");

/* ---------------------------------------------------------
   MARK ATTENDANCE (Final Version)
---------------------------------------------------------- */
exports.markAttendance = async (req, res) => {
  try {
    const student_id = req.body.student_id ?? req.body.studentId;
    const method = (req.body.method || "").trim();

    if (!student_id || !["Present", "Absent"].includes(method)) {
      return res.status(400).json({ message: "Invalid student_id or method" });
    }

    // Check student exists
    const student = await pool.query(
      `SELECT u.id, sp.hostel_id
       FROM users u
       LEFT JOIN student_profiles sp ON sp.user_id = u.id
       WHERE u.id = $1 AND u.role = 'student'`,
      [student_id]
    );

    if (student.rows.length === 0) {
      return res.status(404).json({ message: "Student not found" });
    }

    // Insert attendance with UNIQUE constraint
    const query = `
      INSERT INTO attendance (student_id, date, time, method)
      VALUES ($1, CURRENT_DATE, CURRENT_TIME, $2)
      ON CONFLICT (student_id, date) DO NOTHING
      RETURNING 
        student_id,
        TO_CHAR(date, 'YYYY-MM-DD') AS date,
        TO_CHAR(time, 'HH24:MI') AS time,
        method;
    `;

    const result = await pool.query(query, [student_id, method]);

    if (result.rows.length === 0) {
      return res.status(200).json({ message: "Already marked today" });
    }

    return res.status(201).json({
      message: "Attendance marked successfully",
      data: result.rows[0],
    });
  } catch (err) {
    console.error("❌ markAttendance error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

/* ---------------------------------------------------------
   GET ALL ATTENDANCE (For table)
---------------------------------------------------------- */
exports.getAllAttendance = async (req, res) => {
  try {
    const query = `
      SELECT 
        a.id,
        a.student_id,
        u.name AS student_name,
        u.email AS student_email,
        sp.usn,
        sp.room_no,
        sp.hostel_id,
        sp.dept_branch,
        TO_CHAR(a.date, 'YYYY-MM-DD') AS date,
        TO_CHAR(a.time, 'HH24:MI') AS time,
        a.method
      FROM attendance a
      JOIN users u ON a.student_id = u.id
      LEFT JOIN student_profiles sp ON sp.user_id = u.id
      ORDER BY a.date DESC, a.time DESC;
    `;

    const result = await pool.query(query);
    res.status(200).json(result.rows);
  } catch (err) {
    console.error("❌ getAllAttendance error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

/* ---------------------------------------------------------
   GET ONE STUDENT ATTENDANCE
---------------------------------------------------------- */
exports.getAttendanceByStudent = async (req, res) => {
  try {
    const { studentId } = req.params;

    const query = `
      SELECT 
        TO_CHAR(date, 'YYYY-MM-DD') AS date,
        TO_CHAR(time, 'HH24:MI') AS time,
        method
      FROM attendance
      WHERE student_id = $1
      ORDER BY date DESC, time DESC;
    `;

    const result = await pool.query(query, [studentId]);
    res.status(200).json(result.rows);
  } catch (err) {
    console.error("❌ getAttendanceByStudent error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

/* ---------------------------------------------------------
   SUMMARY
---------------------------------------------------------- */
exports.getAttendanceSummary = async (req, res) => {
  try {
    const query = `
      SELECT
        TO_CHAR(date, 'YYYY-MM-DD') AS date,
        COUNT(*) FILTER (WHERE method = 'Present') AS total_present,
        COUNT(*) FILTER (WHERE method = 'Absent') AS total_absent
      FROM attendance
      GROUP BY date
      ORDER BY date DESC;
    `;

    const result = await pool.query(query);
    res.status(200).json(result.rows);
  } catch (err) {
    console.error("❌ getAttendanceSummary error:", err);
    res.status(500).json({ message: "Error fetching summary" });
  }
};

/* ---------------------------------------------------------
   GET DATE DETAILS
---------------------------------------------------------- */
exports.getAttendanceByDate = async (req, res) => {
  try {
    const { date } = req.params;

    const query = `
      SELECT
        a.student_id,
        u.name AS student_name,
        sp.usn,
        sp.room_no,
        sp.hostel_id,
        sp.dept_branch,
        a.method,
        TO_CHAR(a.time, 'HH24:MI') AS time,
        TO_CHAR(a.date, 'YYYY-MM-DD') AS date
      FROM attendance a
      JOIN users u ON u.id = a.student_id
      LEFT JOIN student_profiles sp ON sp.user_id = a.student_id
      WHERE a.date = $1
      ORDER BY u.name ASC;
    `;

    const result = await pool.query(query, [date]);
    res.status(200).json(result.rows);
  } catch (err) {
    console.error("❌ getAttendanceByDate error:", err);
    res.status(500).json({ message: "Error fetching day attendance" });
  }
};

/* ---------------------------------------------------------
   UNDO TODAY'S ATTENDANCE (Final Version)
---------------------------------------------------------- */
exports.undoAttendance = async (req, res) => {
  try {
    const { studentId } = req.params;

    if (!studentId) {
      return res.status(400).json({ message: "Invalid student ID" });
    }

    const deleteQuery = `
      DELETE FROM attendance
      WHERE student_id = $1 AND date = CURRENT_DATE
      RETURNING student_id;
    `;

    const result = await pool.query(deleteQuery, [studentId]);

    // If no record found for today
    if (result.rowCount === 0) {
      return res.status(404).json({
        message: "No attendance found to undo for today",
      });
    }

    return res.status(200).json({
      message: "Undo successful",
    });
  } catch (err) {
    console.error("❌ Undo attendance error:", err);
    return res.status(500).json({
      message: "Error undoing attendance",
    });
  }
};
