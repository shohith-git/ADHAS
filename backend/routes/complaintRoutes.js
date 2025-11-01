// adhas/backend/routes/complaintRoutes.js
const express = require("express");
const router = express.Router();
const complaintController = require("../controllers/complaintController");

// Add new complaint
router.post("/add", complaintController.addComplaint);

// Get all complaints (warden/admin)
router.get("/", complaintController.getAllComplaints);

// Get complaints by student
router.get("/:studentId", complaintController.getComplaintsByStudent);

// Update complaint status (warden)
router.put("/status/:id", complaintController.updateComplaintStatus);

module.exports = router;
