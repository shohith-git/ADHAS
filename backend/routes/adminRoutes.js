const express = require("express");
const router = express.Router();
const pool = require("../db");
const bcrypt = require("bcryptjs");

const { deleteWarden } = require("../controllers/wardenController");

//
// ─────────────────────────────────────────────
// 🧩 ADMIN: MANAGE USERS (WARDENS + STUDENTS)
// ─────────────────────────────────────────────
//

// 🟢 Get ALL active wardens + students (now includes USN + Room)
router.get("/users", async (req, res) => {
  try {
    const query = `
      SELECT 
        u.id,
        u.name,
        u.email,
        u.role,
        false AS is_deleted,
        NULL AS left_at,

        -- FIX ADDED BELOW
        sp.usn,
        sp.room_no

      FROM users u
      LEFT JOIN student_profiles sp 
        ON sp.user_id = u.id

      WHERE u.role IN ('warden', 'student')
      ORDER BY u.role, u.id;
    `;

    const result = await pool.query(query);
    return res.status(200).json(result.rows);
  } catch (err) {
    console.error("❌ Error fetching active users:", err.message);
    return res.status(500).json({ message: "Internal server error" });
  }
});

//
// ─────────────────────────────────────────────
// 🧩 ADMIN: VIEW DELETED STUDENTS
// ─────────────────────────────────────────────
//

router.get("/deleted-students", async (req, res) => {
  try {
    const query = `
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

    const result = await pool.query(query);
    return res.status(200).json(result.rows);
  } catch (err) {
    console.error("❌ Error fetching deleted students:", err.message);
    return res.status(500).json({ message: "Internal server error" });
  }
});

//
// ─────────────────────────────────────────────
// 🧩 REGISTER NEW WARDEN
// ─────────────────────────────────────────────
//

router.post("/register-warden", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password)
      return res.status(400).json({ message: "All fields are required" });

    const exists = await pool.query("SELECT id FROM users WHERE email=$1", [
      email,
    ]);

    if (exists.rows.length > 0)
      return res.status(409).json({ message: "Warden already registered" });

    const hashed = await bcrypt.hash(password, 10);

    const result = await pool.query(
      `
      INSERT INTO users (name, email, password, role, college_domain)
      VALUES ($1, $2, $3, 'warden', 'cit_nc.edu.in')
      RETURNING id, name, email, role;
      `,
      [name, email, hashed]
    );

    return res.status(201).json({
      message: "Warden registered successfully",
      warden: result.rows[0],
    });
  } catch (err) {
    console.error("❌ Error registering warden:", err.message);
    return res.status(500).json({ message: "Internal server error" });
  }
});

// 🟢 COMPLAINTS OVERVIEW (now includes USN + room_no)
router.get("/complaints", async (req, res) => {
  try {
    const query = `
      SELECT 
        c.id,
        u.name AS student_name,
        u.email AS student_email,

        -- FIX ADDED BELOW
        sp.usn,
        sp.room_no,

        c.title,
        c.description,
        c.status,

        TO_CHAR(c.created_at, 'YYYY-MM-DD HH24:MI:SS') AS created_at,
        TO_CHAR(c.updated_at, 'YYYY-MM-DD HH24:MI:SS') AS updated_at

      FROM complaints c
      JOIN users u 
        ON u.id = c.student_id
      LEFT JOIN student_profiles sp 
        ON sp.user_id = c.student_id

      ORDER BY c.created_at DESC;
    `;

    const result = await pool.query(query);
    return res.status(200).json(result.rows);
  } catch (err) {
    console.error("❌ Error fetching complaints:", err.message);
    return res.status(500).json({ message: "Internal server error" });
  }
});

//
// ─────────────────────────────────────────────
// 🧩 ATTENDANCE OVERVIEW
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
      ORDER BY a.date DESC, a.time DESC;
    `;

    const result = await pool.query(query);
    return res.status(200).json(result.rows);
  } catch (err) {
    console.error("❌ Error fetching attendance logs:", err.message);
    return res.status(500).json({ message: "Internal server error" });
  }
});

//
// ─────────────────────────────────────────────
// 🧩 UPDATE WARDEN
// ─────────────────────────────────────────────
//

router.put("/warden/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, password } = req.body;

    if (!name || !email)
      return res.status(400).json({ message: "Name and email required" });

    const check = await pool.query(`SELECT role FROM users WHERE id=$1`, [id]);

    if (check.rows.length === 0 || check.rows[0].role !== "warden")
      return res
        .status(404)
        .json({ message: "Warden not found or invalid role" });

    if (password && password.trim() !== "") {
      const hashed = await bcrypt.hash(password, 10);
      await pool.query(
        `UPDATE users SET name=$1, email=$2, password=$3 WHERE id=$4`,
        [name, email, hashed, id]
      );
    } else {
      await pool.query(`UPDATE users SET name=$1, email=$2 WHERE id=$3`, [
        name,
        email,
        id,
      ]);
    }

    return res.json({ message: "Warden updated successfully" });
  } catch (err) {
    console.error("❌ Error updating warden:", err.message);
    return res.status(500).json({ message: "Internal server error" });
  }
});

//
// ─────────────────────────────────────────────
// 🧩 DELETE WARDEN (SOFT DELETE)
// ─────────────────────────────────────────────
//

router.delete("/warden/:id", deleteWarden);

//
// ─────────────────────────────────────────────
// ❌ SAFETY: ADMIN CANNOT DELETE STUDENTS
// ─────────────────────────────────────────────
//

router.delete("/users/:id", (req, res) => {
  return res.status(403).json({
    message: "Admin cannot delete students — only wardens manage students.",
  });
});

//
// ─────────────────────────────────────────────
// 🧩 VIEW DELETED WARDENS
// ─────────────────────────────────────────────
//

router.get("/deleted-wardens", async (req, res) => {
  try {
    const query = `
      SELECT 
        id,
        warden_id,
        name,
        email,
        deleted_at
      FROM warden_history
      ORDER BY deleted_at DESC;
    `;

    const result = await pool.query(query);
    return res.status(200).json(result.rows);
  } catch (err) {
    console.error("❌ Error fetching deleted wardens:", err.message);
    return res.status(500).json({ message: "Internal server error" });
  }
});

module.exports = router;
