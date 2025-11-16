const express = require("express");
const router = express.Router();

const attendance = require("../controllers/attendanceController");
const { authMiddleware, isWarden } = require("../middleware/authMiddleware");

// Mark attendance
router.post("/", authMiddleware, isWarden, attendance.markAttendance);

// Get all attendance
router.get("/", authMiddleware, isWarden, attendance.getAllAttendance);

// Summary
router.get(
  "/summary",
  authMiddleware,
  isWarden,
  attendance.getAttendanceSummary
);

// Get by date
router.get(
  "/date/:date",
  authMiddleware,
  isWarden,
  attendance.getAttendanceByDate
);

// Get student by ID
router.get(
  "/student/:studentId",
  authMiddleware,
  attendance.getAttendanceByStudent
);

// 🔥 UNDO today's attendance
router.delete(
  "/undo/:studentId",
  authMiddleware,
  isWarden,
  attendance.undoAttendance
);

module.exports = router;
