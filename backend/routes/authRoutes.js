// 📁 backend/routes/authRoutes.js
const express = require("express");
const router = express.Router();
const pool = require("../db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
require("dotenv").config();

// 🟢 Helper to extract domain from email
const extractDomain = (email) => email.split("@")[1];

/* =====================================================
   👤 REGISTER — Admin/Warden/First-time Admin
   -----------------------------------------------------
   Endpoint: POST /api/auth/register
   Role rules:
   - No creator → first Admin for domain
   - Admin → can register Warden
   - Warden → can register Student
===================================================== */
router.post("/register", async (req, res) => {
  try {
    const { email, password, role, created_by } = req.body; // created_by = id of who’s creating the user

    // 🟢 Basic validations
    if (!email || !password)
      return res.status(400).json({ message: "Email and password required" });

    const domain = extractDomain(email);
    const hashedPassword = await bcrypt.hash(password, 10);

    // 🟡 Check if user already exists
    const existingUser = await pool.query(
      "SELECT * FROM users WHERE email=$1",
      [email]
    );
    if (existingUser.rows.length > 0)
      return res.status(400).json({ message: "User already exists" });

    // 🟡 Check if an admin already exists for this domain
    const existingAdmin = await pool.query(
      "SELECT * FROM users WHERE role=$1 AND college_domain=$2",
      ["admin", domain]
    );

    let allowedRole = "student"; // default role
    let collegeDomain = domain;

    // 🟢 CASE 1: No creator (first-time registration → Admin)
    if (!created_by) {
      if (existingAdmin.rows.length > 0) {
        return res
          .status(403)
          .json({ message: "Admin already exists for this college" });
      }
      allowedRole = "admin";
    } else {
      // 🟢 CASE 2: Someone (creator) is creating a user
      const creator = await pool.query("SELECT * FROM users WHERE id=$1", [
        created_by,
      ]);
      if (creator.rows.length === 0)
        return res.status(403).json({ message: "Invalid creator" });

      const creatorRole = creator.rows[0].role;

      // 🟢 Role-based permissions
      if (creatorRole === "admin") allowedRole = "warden";
      else if (creatorRole === "warden") allowedRole = "student";
      else
        return res
          .status(403)
          .json({ message: "Students cannot register new users" });

      // 🟢 Verify domain consistency
      collegeDomain = creator.rows[0].college_domain;
      if (domain !== collegeDomain)
        return res
          .status(403)
          .json({ message: "Invalid college domain for this role" });
    }

    // 🟢 Insert the new user into DB
    const newUser = await pool.query(
      `INSERT INTO users (email, password, role, college_domain)
       VALUES ($1, $2, $3, $4)
       RETURNING id, email, role`,
      [email, hashedPassword, allowedRole, collegeDomain]
    );

    res.status(201).json({
      message: "User registered successfully ✅",
      user: newUser.rows[0],
    });
  } catch (err) {
    console.error("❌ Error in registration:", err);
    res.status(500).json({ message: "Server error during registration" });
  }
});

/* =====================================================
   🔐 LOGIN — All Roles
   -----------------------------------------------------
   Endpoint: POST /api/auth/login
   Role: Admin, Warden, Student
===================================================== */
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ message: "Email and password required" });

    // 🟢 Check if user exists
    const user = await pool.query("SELECT * FROM users WHERE email=$1", [
      email,
    ]);
    if (user.rows.length === 0)
      return res.status(400).json({ message: "User not found" });

    // 🟢 Verify password
    const validPassword = await bcrypt.compare(password, user.rows[0].password);
    if (!validPassword)
      return res.status(401).json({ message: "Invalid credentials" });

    // 🟢 Generate JWT (with correct secret from .env)
    const token = jwt.sign(
      {
        id: user.rows[0].id,
        role: user.rows[0].role,
        college: user.rows[0].college_domain,
      },
      process.env.JWT_SECRET, // ✅ using .env variable (not hardcoded)
      { expiresIn: "6h" }
    );

    // 🟢 Return token + user details
    res.json({
      message: "Login successful ✅",
      token,
      user: {
        id: user.rows[0].id,
        email: user.rows[0].email,
        role: user.rows[0].role,
        college: user.rows[0].college_domain,
      },
    });
  } catch (err) {
    console.error("❌ Error during login:", err);
    res.status(500).json({ message: "Server error during login" });
  }
});

module.exports = router;
