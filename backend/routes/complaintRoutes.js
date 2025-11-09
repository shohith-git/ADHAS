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

// 🟢 Student submits complaint
router.post("/", authMiddleware, addComplaint);

// 👨‍🏫 Warden views all complaints
router.get("/", authMiddleware, isWarden, getAllComplaints);

// 🧍‍♂️ Student views their own complaints
router.get("/:studentId", authMiddleware, getComplaintsByStudent);

// 🔄 Update status (Warden)
router.put("/status/:id", authMiddleware, isWarden, updateComplaintStatus);

module.exports = router;
