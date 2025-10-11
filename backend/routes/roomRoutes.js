const express = require("express");
const router = express.Router();
const {
  getRooms,
  addRoom,
  updateRoom,
  deleteRoom,
} = require("../controllers/roomController");
const { protect, authorizeRoles } = require("../middleware/authMiddleware");

// Students can only GET rooms
router.get(
  "/",
  protect,
  authorizeRoles("student", "warden", "admin"),
  getRooms
);

// Admin/Warden can create, update, delete
router.post("/", protect, authorizeRoles("warden", "admin"), addRoom);
router.put("/:id", protect, authorizeRoles("warden", "admin"), updateRoom);
router.delete("/:id", protect, authorizeRoles("warden", "admin"), deleteRoom);

module.exports = router;
