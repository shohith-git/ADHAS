const express = require("express");
const router = express.Router();
const pool = require("../db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
require("dotenv").config();

// Helper to extract domain from email
const extractDomain = (email) => email.split("@")[1];

// ✅ REGISTER API
router.post("/register", async (req, res) => {
  try {
    const { email, password, role, created_by } = req.body; // created_by will store the user_id of who’s creating

    // Basic validations
    if (!email || !password)
      return res.status(400).json({ message: "Email and password required" });

    const domain = extractDomain(email);
    const hashedPassword = await bcrypt.hash(password, 10);

    // Check if user already exists
    const existingUser = await pool.query(
      "SELECT * FROM users WHERE email=$1",
      [email]
    );
    if (existingUser.rows.length > 0)
      return res.status(400).json({ message: "User already exists" });

    // Find if there’s already an admin for this domain
    const existingAdmin = await pool.query(
      "SELECT * FROM users WHERE role=$1 AND college_domain=$2",
      ["admin", domain]
    );

    let allowedRole = "student"; // default
    let collegeDomain = domain;

    // Logic for who can register whom
    if (!created_by) {
      // No creator → first admin of this domain
      if (existingAdmin.rows.length > 0)
        return res
          .status(403)
          .json({ message: "Admin already exists for this college" });
      allowedRole = "admin";
    } else {
      // If someone (creator) is registering others
      const creator = await pool.query("SELECT * FROM users WHERE id=$1", [
        created_by,
      ]);
      if (creator.rows.length === 0)
        return res.status(403).json({ message: "Invalid creator" });
      const creatorRole = creator.rows[0].role;

      if (creatorRole === "admin") {
        allowedRole = "warden";
      } else if (creatorRole === "warden") {
        allowedRole = "student";
      } else {
        return res
          .status(403)
          .json({ message: "Students cannot register new users" });
      }

      collegeDomain = creator.rows[0].college_domain;
      if (domain !== collegeDomain)
        return res
          .status(403)
          .json({ message: "Invalid college domain for this role" });
    }

    const newUser = await pool.query(
      "INSERT INTO users (email, password, role, college_domain) VALUES ($1, $2, $3, $4) RETURNING id, email, role",
      [email, hashedPassword, allowedRole, collegeDomain]
    );

    res
      .status(201)
      .json({ message: "User registered successfully", user: newUser.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error during registration" });
  }
});

// ✅ LOGIN API
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ message: "Email and password required" });

    const user = await pool.query("SELECT * FROM users WHERE email=$1", [
      email,
    ]);
    if (user.rows.length === 0)
      return res.status(400).json({ message: "User not found" });

    const validPassword = await bcrypt.compare(password, user.rows[0].password);
    if (!validPassword)
      return res.status(401).json({ message: "Invalid credentials" });

    const token = jwt.sign(
      {
        id: user.rows[0].id,
        role: user.rows[0].role,
        college: user.rows[0].college_domain,
      },
      process.env.JWT_SECRET,
      { expiresIn: "6h" }
    );

    res.json({ message: "Login successful", token, user: user.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error during login" });
  }
});

module.exports = router;
