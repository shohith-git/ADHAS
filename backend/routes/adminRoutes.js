// adhas/backend/routes/adminRoutes.js

const express = require("express");
const router = express.Router();
const pool = require("../db");
const bcrypt = require("bcryptjs");

//
// ─────────────────────────────────────────────
// 🧩 ADMIN: MANAGE USERS (WARDENS + STUDENTS)
// ─────────────────────────────────────────────
//

// 🟢 Get ALL active wardens + students
router.get("/users", async (req, res) => {
  try {
    const activeQuery = `
      SELECT 
        id,
        name,
        email,
        role,
        false AS is_deleted,
        NULL AS left_at
      FROM users
      WHERE role IN ('warden', 'student')
      ORDER BY role, id ASC;
    `;

    const result = await pool.query(activeQuery);
    res.status(200).json(result.rows);
  } catch (err) {
    console.error("❌ Error fetching active users:", err.message);
    res.status(500).json({ message: "Internal server error" });
  }
});

//
// ─────────────────────────────────────────────
// 🧩 ADMIN: VIEW DELETED STUDENTS (student_history)
// ─────────────────────────────────────────────
//

router.get("/deleted-students", async (req, res) => {
  try {
    const deletedQuery = `
      SELECT 
        id,
        name,
        email,
        role,
        college_domain,
        left_at,
        true AS is_deleted
      FROM student_history
      ORDER BY left_at DESC;
    `;

    const result = await pool.query(deletedQuery);
    res.status(200).json(result.rows);
  } catch (err) {
    console.error("❌ Error fetching deleted students:", err.message);
    res.status(500).json({ message: "Internal server error" });
  }
});

//
// ─────────────────────────────────────────────
// 🧩 ADMIN: REGISTER NEW WARDEN
// ─────────────────────────────────────────────
//

router.post("/register-warden", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password)
      return res.status(400).json({ message: "All fields are required" });

    const check = await pool.query("SELECT * FROM users WHERE email=$1", [
      email,
    ]);

    if (check.rows.length > 0)
      return res.status(409).json({ message: "Warden already registered" });

    const hashed = await bcrypt.hash(password, 10);

    const query = `
      INSERT INTO users (name, email, password, role, college_domain)
      VALUES ($1, $2, $3, 'warden', 'cit_nc.edu.in')
      RETURNING id, name, email, role;
    `;

    const result = await pool.query(query, [name, email, hashed]);

    res.status(201).json({
      message: "Warden registered successfully",
      warden: result.rows[0],
    });
  } catch (err) {
    console.error("❌ Error registering warden:", err.message);
    res.status(500).json({ message: "Internal server error" });
  }
});

//
// ─────────────────────────────────────────────
// 🧩 ADMIN: COMPLAINTS OVERVIEW
// ─────────────────────────────────────────────
//

router.get("/complaints", async (req, res) => {
  try {
    const query = `
      SELECT 
        c.id,
        u.name AS student_name,
        u.email AS student_email,
        c.title,
        c.description,
        c.status,
        TO_CHAR(c.created_at, 'YYYY-MM-DD HH24:MI:SS') AS created_at
      FROM complaints c
      JOIN users u 
        ON u.id = c.user_id OR u.id = c.student_id
      WHERE u.role='student'
      ORDER BY c.created_at DESC;
    `;

    const result = await pool.query(query);
    res.status(200).json(result.rows);
  } catch (err) {
    console.error("❌ Error fetching complaints:", err.message);
    res.status(500).json({ message: "Internal server error" });
  }
});

//
// ─────────────────────────────────────────────
// 🧩 ADMIN: ATTENDANCE OVERVIEW
// ─────────────────────────────────────────────
//

router.get("/attendance", async (req, res) => {
  try {
    const query = `
      SELECT 
        a.id,
        u.name AS student_name,
        u.email AS student_email,
        a.date,
        a.time,
        a.method,
        a.location
      FROM attendance a
      JOIN users u ON u.id = a.student_id
      WHERE u.role='student'
      ORDER BY a.date DESC, a.time DESC;
    `;

    const result = await pool.query(query);
    res.status(200).json(result.rows);
  } catch (err) {
    console.error("❌ Error fetching attendance logs:", err.message);
    res.status(500).json({ message: "Internal server error" });
  }
});

//
// ─────────────────────────────────────────────
// 🧩 SAFETY: ADMIN CANNOT DELETE USERS
// ─────────────────────────────────────────────
//

router.delete("/users/:id", (req, res) => {
  return res.status(403).json({
    message: "Admin cannot delete users — only wardens manage students.",
  });
});

module.exports = router;
