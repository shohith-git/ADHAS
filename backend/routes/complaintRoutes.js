// backend/routes/complaintRoutes.js
const express = require("express");
const router = express.Router();

const {
  addComplaint,
  getAllComplaints,
  getComplaintsByStudent,
  updateComplaintStatus,
} = require("../controllers/complaintController");

const { authMiddleware, isWarden } = require("../middleware/authMiddleware");

/* =====================================================
   🟢 Student submits complaint
===================================================== */
router.post("/", authMiddleware, addComplaint);

/* =====================================================
   👨‍🏫 Warden: View ALL complaints
===================================================== */
router.get("/", authMiddleware, isWarden, getAllComplaints);

/* =====================================================
   🟡 Warden OR Student: View complaints for a student
   (static route MUST come before "/:studentId")
===================================================== */
router.get("/student/:id", authMiddleware, getComplaintsByStudent);

/* =====================================================
   🔵 Student: View their own complaints (legacy support)
===================================================== */
router.get("/:studentId", authMiddleware, getComplaintsByStudent);

/* =====================================================
   🔄 Update complaint status (warden only)
===================================================== */
router.put("/status/:id", authMiddleware, isWarden, updateComplaintStatus);

module.exports = router;
