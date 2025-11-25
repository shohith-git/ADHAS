// backend/routes/authRoutes.js
const express = require("express");
const router = express.Router();

const {
  registerUser,
  loginUser,
  registerWarden,
} = require("../controllers/userController");

const { authMiddleware, isAdmin } = require("../middleware/authMiddleware");

/* ----------------------------------------------------
   ❌ REMOVE PUBLIC USER REGISTRATION (NOT SAFE)
   ✔ Instead, only allow Admin → Warden
      and Warden → Student inside userController
---------------------------------------------------- */

// ❌ Old (unsafe):
// router.post("/register", registerUser);

// ❌ COMPLETELY REMOVE PUBLIC SIGNUP
// Students must be created only by warden inside studentRoutes

/* ----------------------------------------------------
   🔐 LOGIN (public)
---------------------------------------------------- */
router.post("/login", loginUser);

/* ----------------------------------------------------
   🛡 ADMIN → REGISTER WARDEN (protected)
---------------------------------------------------- */
router.post("/register-warden", authMiddleware, isAdmin, registerWarden);

module.exports = router;
