// backend/routes/attendanceRoutes.js
const express = require("express");
const router = express.Router();

const attendance = require("../controllers/attendanceController");
const { authMiddleware, isWarden } = require("../middleware/authMiddleware");

/* =====================================================
   🟢 Mark attendance (Warden)
===================================================== */
router.post("/", authMiddleware, isWarden, attendance.markAttendance);

/* =====================================================
   📋 Get all attendance (Warden)
===================================================== */
router.get("/", authMiddleware, isWarden, attendance.getAllAttendance);

/* =====================================================
   📊 Summary (Warden)
===================================================== */
router.get(
  "/summary",
  authMiddleware,
  isWarden,
  attendance.getAttendanceSummary
);

/* =====================================================
   📅 Get Attendance by Date (Warden)
===================================================== */
router.get(
  "/date/:date",
  authMiddleware,
  isWarden,
  attendance.getAttendanceByDate
);

/* =====================================================
   🔥 UNDO Today's Attendance (Warden)
   ⚠️ MUST come before /student/:studentId to avoid route collision
===================================================== */
router.delete(
  "/undo/:studentId",
  authMiddleware,
  isWarden,
  attendance.undoAttendance
);

/* =====================================================
   👨‍🎓 Get Attendance by Student (Warden or Student)
===================================================== */
router.get(
  "/student/:studentId",
  authMiddleware,
  attendance.getAttendanceByStudent
);

module.exports = router;
