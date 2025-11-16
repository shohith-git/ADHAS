// backend/middleware/authMiddleware.js
const jwt = require("jsonwebtoken");
const pool = require("../db");

/* ==========================================================
   🔐 AUTH MIDDLEWARE
   - Validates JWT
   - Loads user from database
========================================================== */
const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res
        .status(401)
        .json({ message: "No token, authorization denied" });
    }

    const token = authHeader.split(" ")[1];

    // Verify JWT signature
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      console.error("❌ JWT verify error:", err.message);
      return res.status(401).json({ message: "Token is invalid or expired" });
    }

    // Load user from DB
    const userResult = await pool.query(
      "SELECT id, name, email, role FROM users WHERE id = $1",
      [decoded.id]
    );

    if (userResult.rows.length === 0) {
      return res.status(401).json({ message: "Invalid token user" });
    }

    req.user = userResult.rows[0];
    next();
  } catch (err) {
    console.error("❌ Auth middleware error:", err.message);
    res.status(500).json({ message: "Server auth error" });
  }
};

/* ==========================================================
   🛡️ ROLE MIDDLEWARES
========================================================== */

// Admin only
const isAdmin = (req, res, next) => {
  if (req.user?.role !== "admin") {
    return res.status(403).json({ message: "Access denied: Admins only" });
  }
  next();
};

// Warden (or admin)
const isWarden = (req, res, next) => {
  if (req.user?.role === "warden" || req.user?.role === "admin") {
    return next();
  }
  return res.status(403).json({ message: "Access denied: Warden only" });
};

// Student (or admin)
const isStudent = (req, res, next) => {
  if (req.user?.role === "student" || req.user?.role === "admin") {
    return next();
  }
  return res.status(403).json({ message: "Access denied: Students only" });
};

/* ==========================================================
   🎯 DYNAMIC ROLE AUTHORIZER
   Usage:
   router.get("/route", authMiddleware, authorizeRoles("warden","admin"));
========================================================== */
const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!allowedRoles.includes(req.user?.role)) {
      return res.status(403).json({ message: "Access denied" });
    }
    next();
  };
};

/* ========================================================== */

module.exports = {
  authMiddleware,
  isAdmin,
  isWarden,
  isStudent,
  authorizeRoles,
};
