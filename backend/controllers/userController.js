// backend/controllers/authController.js
const pool = require("../db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// ------------------------------------------------------------------
// 🔵 Extract domain helper
// ------------------------------------------------------------------
const getDomain = (email) => email.split("@")[1];

// ------------------------------------------------------------------
// 🟢 REGISTER USER  (Default: student)
// ⚠ NOTE: This is PUBLIC. Use carefully.
// ------------------------------------------------------------------
const registerUser = async (req, res) => {
  const { name, email, password, role = "student" } = req.body;

  try {
    if (!name || !email || !password) {
      return res.status(400).json({ message: "All fields required" });
    }

    const domain = getDomain(email);

    const exists = await pool.query("SELECT id FROM users WHERE email=$1", [
      email,
    ]);

    if (exists.rows.length > 0) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashed = await bcrypt.hash(password, 10);

    const newUser = await pool.query(
      `
      INSERT INTO users (name, email, password, role, college_domain)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, name, email, role, college_domain
      `,
      [name, email, hashed, role, domain]
    );

    res.status(201).json({
      message: "User registered successfully",
      user: newUser.rows[0],
    });
  } catch (err) {
    console.error("❌ registerUser error:", err.message);
    res.status(500).json({ message: "Server error" });
  }
};

// ------------------------------------------------------------------
// 🔵 LOGIN for all roles
// ------------------------------------------------------------------
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const result = await pool.query("SELECT * FROM users WHERE email=$1", [
      email,
    ]);

    if (result.rows.length === 0) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const user = result.rows[0];

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(400).json({ message: "Invalid credentials" });

    // Must match authMiddleware (req.user.id)
    const token = jwt.sign(
      {
        id: user.id,
        role: user.role,
        email: user.email,
        college: user.college_domain,
      },
      process.env.JWT_SECRET,
      { expiresIn: "6h" }
    );

    res.json({
      message: "Login successful",
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        college: user.college_domain,
      },
    });
  } catch (err) {
    console.error("❌ loginUser error:", err.message);
    res.status(500).json({ message: "Server error" });
  }
};

// ------------------------------------------------------------------
// 🟣 REGISTER WARDEN (Admin Only)
// ------------------------------------------------------------------
const registerWarden = async (req, res) => {
  const { name, email, password } = req.body;

  try {
    if (!name || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Correct domain
    if (!email.endsWith("@cit_nc.edu.in")) {
      return res.status(400).json({
        message: "Warden email must be a cit_nc.edu.in domain",
      });
    }

    const exists = await pool.query("SELECT * FROM users WHERE email=$1", [
      email,
    ]);

    if (exists.rows.length > 0) {
      return res.status(400).json({ message: "Warden already exists" });
    }

    const hashed = await bcrypt.hash(password, 10);

    const result = await pool.query(
      `
      INSERT INTO users (name, email, password, role, college_domain)
      VALUES ($1,$2,$3,'warden','cit_nc.edu.in')
      RETURNING id, name, email, role
      `,
      [name, email, hashed]
    );

    res.status(201).json({
      message: "Warden registered successfully",
      user: result.rows[0],
    });
  } catch (err) {
    console.error("❌ registerWarden error:", err.message);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  registerUser,
  loginUser,
  registerWarden,
};
