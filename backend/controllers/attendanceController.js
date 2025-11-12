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

// GET /api/attendance/summary
// Returns array of { date, total_present, total_absent }
exports.getDailySummary = async (req, res) => {
  try {
    const q = `
      SELECT
        date::date AS date,
        COUNT(*) FILTER (WHERE LOWER(method) = 'present') AS total_present,
        COUNT(*) FILTER (WHERE LOWER(method) = 'absent') AS total_absent
      FROM attendance
      GROUP BY date::date
      ORDER BY date::date DESC;
    `;
    const result = await pool.query(q);
    res.json(result.rows);
  } catch (err) {
    console.error("❌ Error fetching attendance summary:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

// GET /api/attendance/date/:date  (date as YYYY-MM-DD)
exports.getAttendanceByDateFull = async (req, res) => {
  try {
    const { date } = req.params;
    // Basic validation
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res
        .status(400)
        .json({ message: "Invalid date format (YYYY-MM-DD)" });
    }

    const q = `
      SELECT
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
      WHERE a.date::date = $1::date
      ORDER BY a.time ASC;
    `;
    const result = await pool.query(q, [date]);
    res.json(result.rows);
  } catch (err) {
    console.error("❌ Error fetching attendance by date:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

// 🧾 Summary of attendance by date
exports.getAttendanceSummary = async (req, res) => {
  try {
    const query = `
      SELECT 
        date,
        COUNT(*) FILTER (WHERE method = 'Present') AS total_present,
        COUNT(*) FILTER (WHERE method = 'Absent') AS total_absent
      FROM attendance
      GROUP BY date
      ORDER BY date DESC;
    `;
    const result = await pool.query(query);
    res.status(200).json(result.rows);
  } catch (err) {
    console.error("❌ Error fetching attendance summary:", err.message);
    res.status(500).json({ message: "Error fetching attendance summary" });
  }
};

// 🧍‍♂️ Detailed student attendance by date
exports.getAttendanceByDate = async (req, res) => {
  try {
    const { date } = req.params;

    const query = `
      SELECT 
        a.student_id,
        u.name AS student_name,
        sp.hostel_id,
        sp.room_no,
        a.method
      FROM attendance a
      JOIN users u ON u.id = a.student_id
      LEFT JOIN student_profiles sp ON sp.user_id = a.student_id
      WHERE a.date = $1
      ORDER BY u.name ASC;
    `;
    const result = await pool.query(query, [date]);

    res.status(200).json(result.rows);
  } catch (err) {
    console.error("❌ Error fetching attendance by date:", err.message);
    res.status(500).json({ message: "Error fetching attendance by date" });
  }
};
