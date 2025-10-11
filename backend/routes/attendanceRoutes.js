const express = require("express");
const {
  markAttendance,
  getAttendance,
} = require("../controllers/attendanceController");

const router = express.Router();

// POST /api/attendance → mark attendance
router.post("/", markAttendance);

// GET /api/attendance/:student_id → get attendance
router.get("/:student_id", getAttendance);

module.exports = router;
