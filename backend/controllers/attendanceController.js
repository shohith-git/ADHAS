// adhas/backend/controllers/attendanceController.js
const pool = require("../db");

// 🟢 Mark attendance (fixed version)
exports.markAttendance = async (req, res) => {
  try {
    console.log("📩 Incoming body:", req.body);

    // Destructure safely
    const student_id = req.body.student_id ?? req.body.studentId;
    const method = req.body.method;
    const location = req.body.location;

    console.log("✅ Parsed values:", { student_id, method, location });

    // Check for missing fields (stringified and trimmed)
    if (
      !student_id ||
      String(student_id).trim() === "" ||
      !method ||
      String(method).trim() === "" ||
      !location ||
      String(location).trim() === ""
    ) {
      return res.status(400).json({
        message: "All fields are required (student_id, method, location)",
      });
    }

    const query = `
      INSERT INTO attendance (student_id, date, time, method, location)
      VALUES ($1, CURRENT_DATE, CURRENT_TIME, $2, $3)
      RETURNING *;
    `;
    const values = [student_id, method, location];
    console.log("🧠 Executing query:", query, values);

    const result = await pool.query(query, values);

    console.log("✅ Attendance inserted:", result.rows[0]);

    res.status(201).json({
      message: "Attendance marked successfully ✅",
      data: result.rows[0],
    });
  } catch (err) {
    console.error("❌ Error in markAttendance");
    console.error("Message:", err.message);
    console.error("Stack:", err.stack);
    res.status(500).json({ message: err.message });
  }
};

// 🟡 Get all attendance (for warden/admin)
exports.getAllAttendance = async (req, res) => {
  try {
    const query = `
      SELECT 
        a.id,
        u.name AS student_name,
        u.email AS student_email,
        a.date,
        a.time,
        a.method,
        a.location
      FROM attendance a
      JOIN users u ON a.student_id = u.id
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
      SELECT date, time, method, location
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
