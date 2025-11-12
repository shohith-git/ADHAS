const express = require("express");
const router = express.Router();
const attendanceController = require("../controllers/attendanceController");
const { authMiddleware, isWarden } = require("../middleware/authMiddleware");

router.get(
  "/summary",
  authMiddleware,
  isWarden,
  attendanceController.getDailySummary
);
router.get(
  "/date/:date",
  authMiddleware,
  isWarden,
  attendanceController.getAttendanceByDateFull
);

// Mark attendance
router.post("/", attendanceController.markAttendance);

// Get all attendance (warden/admin)
router.get("/", attendanceController.getAllAttendance);

// Get attendance by student
router.get("/:studentId", attendanceController.getAttendanceByStudent);

module.exports = router;
