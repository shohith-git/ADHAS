// backend/middleware/authMiddleware.js
const jwt = require("jsonwebtoken");
const pool = require("../db"); // PostgreSQL connection

// Authenticate JWT Token
const authMiddleware = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "No token, authorization denied" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const userResult = await pool.query(
      "SELECT id, email, role FROM users WHERE id = $1",
      [decoded.id]
    );

    if (userResult.rows.length === 0) {
      return res.status(401).json({ message: "Invalid token user" });
    }

    req.user = userResult.rows[0];
    next();
  } catch (err) {
    console.error("JWT verification error:", err);
    res.status(401).json({ message: "Token is invalid or expired" });
  }
};

// Allow only Admins
const isAdmin = (req, res, next) => {
  if (req.user?.role !== "admin") {
    return res.status(403).json({ message: "Access denied: Admins only" });
  }
  next();
};

// Allow only Wardens (or Admins)
const isWarden = (req, res, next) => {
  if (req.user?.role === "warden" || req.user?.role === "admin") {
    next();
  } else {
    return res.status(403).json({ message: "Access denied: Warden only" });
  }
};

// Allow only Students (or Admins) — NEW
const isStudent = (req, res, next) => {
  if (req.user?.role === "student" || req.user?.role === "admin") {
    next();
  } else {
    return res.status(403).json({ message: "Access denied: Student only" });
  }
};

// Allow roles dynamically (optional helper)
const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!allowedRoles.includes(req.user.role)) {
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
