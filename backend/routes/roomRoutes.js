const express = require("express");
const router = express.Router();
const pool = require("../db");

// 🏠 Simple route to test if room routes are working
router.get("/", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM rooms ORDER BY id ASC");
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error fetching rooms" });
  }
});

// 🏗️ Add new room (for now simple; later we can protect by role)
router.post("/", async (req, res) => {
  try {
    const { room_number, capacity, block } = req.body;
    if (!room_number || !capacity || !block) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const newRoom = await pool.query(
      "INSERT INTO rooms (room_number, capacity, block) VALUES ($1, $2, $3) RETURNING *",
      [room_number, capacity, block]
    );

    res
      .status(201)
      .json({ message: "Room added successfully", room: newRoom.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error adding room" });
  }
});

// 🧹 Delete room (later we’ll add admin/warden restriction)
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query("DELETE FROM rooms WHERE id=$1", [id]);
    res.json({ message: "Room deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error deleting room" });
  }
});

module.exports = router;
