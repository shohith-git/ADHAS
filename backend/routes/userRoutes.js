const express = require("express");
const router = express.Router();
const { registerUser, loginUser } = require("../controllers/userController");

// Routes
router.post("/register", registerUser);
router.post("/login", loginUser);

module.exports = router; // ✅ must export the router
