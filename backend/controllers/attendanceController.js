const pool = require("../db");

// 🟢 Mark attendance (duplicate-safe + clean timestamps)
exports.markAttendance = async (req, res) => {
  try {
    console.log("📩 Incoming body:", req.body);

    const student_id = req.body.student_id ?? req.body.studentId;
    const method = req.body.method || "";

    if (!student_id || !method) {
      return res.status(400).json({
        message: "student_id and method are required",
      });
    }

    // Check if student exists
    const checkStudent = await pool.query(
      "SELECT id FROM users WHERE id = $1 AND role = 'student'",
      [student_id]
    );
    if (checkStudent.rows.length === 0) {
      return res.status(404).json({ message: "Student not found" });
    }

    // Prevent duplicate marking for same date
    const existing = await pool.query(
      "SELECT id FROM attendance WHERE student_id = $1 AND date = CURRENT_DATE",
      [student_id]
    );
    if (existing.rows.length > 0) {
      return res
        .status(200)
        .json({ message: "Already marked today", data: existing.rows[0] });
    }

    // Insert new attendance safely (no location)
    const query = `
      INSERT INTO attendance (student_id, date, time, method)
      VALUES ($1, CURRENT_DATE, CURRENT_TIME, $2)
      RETURNING student_id, date, time, method;
    `;
    const result = await pool.query(query, [student_id, method]);

    if (!result.rows || result.rows.length === 0) {
      return res.status(500).json({ message: "Insert failed unexpectedly" });
    }

    console.log("✅ Attendance inserted:", result.rows[0]);
    res.status(201).json({
      message: "Attendance marked successfully",
      data: result.rows[0],
    });
  } catch (err) {
    console.error("❌ Error in markAttendance:", err);
    res.status(500).json({ message: err.message });
  }
};

// 🟡 Get all attendance (for warden/admin)
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
        a.date,
        a.time,
        a.method
      FROM attendance a
      JOIN users u ON a.student_id = u.id
      LEFT JOIN student_profiles sp ON sp.user_id = u.id
      WHERE u.role = 'student'
      ORDER BY a.date DESC, a.time DESC;
    `;
    const result = await pool.query(query);
    res.status(200).json(result.rows);
  } catch (err) {
    console.error("❌ Error fetching attendance:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

// 🔵 Get attendance by student ID
exports.getAttendanceByStudent = async (req, res) => {
  try {
    const { studentId } = req.params;
    const query = `
      SELECT date, time, method
      FROM attendance
      WHERE student_id = $1
      ORDER BY date DESC, time DESC;
    `;
    const result = await pool.query(query, [studentId]);
    res.status(200).json(result.rows);
  } catch (err) {
    console.error("❌ Error fetching student attendance:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};
