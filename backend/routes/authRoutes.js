// 📁 backend/routes/authRoutes.js
const express = require("express");
const router = express.Router();
const pool = require("../db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
require("dotenv").config();

// Helper: extract domain
const extractDomain = (email) => email.split("@")[1];

/* =====================================================
   👤 REGISTER — Admin / Warden / First Admin
===================================================== */
router.post("/register", async (req, res) => {
  try {
    const { name, email, password, role, created_by } = req.body;

    if (!email || !password)
      return res.status(400).json({ message: "Email and password required" });

    if (!name && !created_by)
      return res.status(400).json({ message: "Name is required" });

    const domain = extractDomain(email);

    const existingUser = await pool.query(
      "SELECT * FROM users WHERE email=$1",
      [email]
    );
    if (existingUser.rows.length > 0)
      return res.status(400).json({ message: "User already exists" });

    const existingAdmin = await pool.query(
      "SELECT * FROM users WHERE role='admin' AND college_domain=$1",
      [domain]
    );

    let assignedRole = "student";
    let collegeDomain = domain;

    // CASE 1: First-ever admin
    if (!created_by) {
      if (existingAdmin.rows.length > 0) {
        return res
          .status(403)
          .json({ message: "Admin already exists for this college" });
      }
      assignedRole = "admin";
    } else {
      // CASE 2: Created by warden/admin
      const creator = await pool.query("SELECT * FROM users WHERE id=$1", [
        created_by,
      ]);

      if (creator.rows.length === 0)
        return res.status(403).json({ message: "Invalid creator" });

      const creatorRole = creator.rows[0].role;

      if (creatorRole === "admin") assignedRole = "warden";
      else if (creatorRole === "warden") assignedRole = "student";
      else
        return res
          .status(403)
          .json({ message: "Students cannot register users" });

      collegeDomain = creator.rows[0].college_domain;

      if (domain !== collegeDomain)
        return res
          .status(403)
          .json({ message: "Invalid college domain for this role" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // INSERT user
    const newUser = await pool.query(
      `INSERT INTO users (name, email, password, role, college_domain)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, name, email, role, college_domain`,
      [name, email, hashedPassword, assignedRole, collegeDomain]
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
   🔐 LOGIN — Admin, Warden, Student
===================================================== */
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password)
      return res.status(400).json({ message: "Email and password required" });

    const result = await pool.query("SELECT * FROM users WHERE email=$1", [
      email,
    ]);

    if (result.rows.length === 0)
      return res.status(400).json({ message: "User not found" });

    const user = result.rows[0];

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword)
      return res.status(401).json({ message: "Invalid credentials" });

    // Include name in JWT
    const token = jwt.sign(
      {
        id: user.id,
        name: user.name,
        role: user.role,
        college: user.college_domain,
      },
      process.env.JWT_SECRET,
      { expiresIn: "6h" }
    );

    res.json({
      message: "Login successful ✅",
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        college: user.college_domain,
      },
    });
  } catch (err) {
    console.error("❌ Error during login:", err);
    res.status(500).json({ message: "Server error during login" });
  }
});

module.exports = router;
