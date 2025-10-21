const express = require("express");
const router = express.Router();

const {
  registerUser,
  loginUser,
  registerWarden,
} = require("../controllers/userController");
const { authMiddleware, isAdmin } = require("../middleware/authMiddleware");

// Public registration and login routes
router.post("/register", registerUser);
router.post("/login", loginUser);

// Admin-only route to register a warden
router.post("/register-warden", authMiddleware, isAdmin, registerWarden);

module.exports = router;
