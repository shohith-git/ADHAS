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
      return res.status(401).json({ message: "No token provided" });
    }

    const token = authHeader.split(" ")[1];

    // Verify token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      if (err.name === "TokenExpiredError") {
        return res.status(401).json({ message: "Token expired, please login" });
      }
      return res.status(401).json({ message: "Invalid token" });
    }

    // Token payload uses "userId" (NOT "id")
    const userId = decoded.userId || decoded.id;

    if (!userId) {
      return res.status(401).json({ message: "Invalid token payload" });
    }

    // Fetch user with domain
    const userResult = await pool.query(
      `SELECT id, name, email, role, college_domain
       FROM users
       WHERE id = $1`,
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(401).json({ message: "User not found for token" });
    }

    req.user = userResult.rows[0];
    next();
  } catch (err) {
    console.error("❌ Auth middleware error:", err.message);
    res.status(500).json({ message: "Authentication error" });
  }
};

/* ==========================================================
   🛡️ ROLE MIDDLEWARES
========================================================== */

// Admin only
const isAdmin = (req, res, next) => {
  if (req.user?.role !== "admin") {
    return res.status(403).json({ message: "Admins only" });
  }
  next();
};

// Warden OR Admin
const isWarden = (req, res, next) => {
  if (req.user?.role === "warden" || req.user?.role === "admin") {
    return next();
  }
  return res.status(403).json({ message: "Wardens only" });
};

// Student OR Admin
const isStudent = (req, res, next) => {
  if (req.user?.role === "student" || req.user?.role === "admin") {
    return next();
  }
  return res.status(403).json({ message: "Students only" });
};

/* ==========================================================
   🎯 GENERIC AUTHORIZER
========================================================== */
const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!allowedRoles.includes(req.user?.role)) {
      return res.status(403).json({ message: "Access denied" });
    }
    next();
  };
};

module.exports = {
  authMiddleware,
  isAdmin,
  isWarden,
  isStudent,
  authorizeRoles,
};
