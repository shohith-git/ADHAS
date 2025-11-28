const pool = require("../db");

// ========================= SOFT DELETE WARDEN =========================
exports.deleteWarden = async (req, res) => {
  const { id } = req.params;

  try {
    // 1️⃣ Check if warden exists
    const find = await pool.query(
      `SELECT * FROM users WHERE id = $1 AND role = 'warden'`,
      [id]
    );

    if (find.rows.length === 0) {
      return res.status(404).json({ message: "Warden not found" });
    }

    const w = find.rows[0];

    // 2️⃣ Move to warden_history
    await pool.query(
      `INSERT INTO warden_history (warden_id, name, email)
       VALUES ($1, $2, $3)`,
      [id, w.name, w.email]
    );

    // 3️⃣ Delete from users
    await pool.query(`DELETE FROM users WHERE id = $1 AND role = 'warden'`, [
      id,
    ]);

    res.json({ message: "Warden deleted successfully (soft delete)." });
  } catch (err) {
    console.error("❌ Soft delete warden error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};
