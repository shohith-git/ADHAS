const express = require("express");
const router = express.Router();
const pool = require("../db");
const { authMiddleware, isWarden } = require("../middleware/authMiddleware");

/* ==========================================================
   🏗️ AUTO-GENERATE ROOMS (Flexible by Floor & Sharing)
   ----------------------------------------------------------
   POST /api/rooms/auto-generate
   Body:
   {
     "fromRoom": 101,
     "toRoom": 120,
     "floor": 2,
     "eastSharing": 2,
     "westSharing": 3
   }
========================================================== */
// ✅ Auto-generate rooms (Admin/Warden)
// ✅ Auto-generate rooms (Admin/Warden)
router.post("/auto-generate", authMiddleware, isWarden, async (req, res) => {
  try {
    const { fromRoom, toRoom, floor, eastSharing, westSharing } = req.body;
    console.log("🔹 /auto-generate body:", req.body);

    // Validate inputs
    if (!fromRoom || !toRoom || !floor || !eastSharing || !westSharing) {
      return res.status(400).json({
        message:
          "Missing fields. Please provide fromRoom, toRoom, floor, eastSharing, and westSharing.",
      });
    }

    const start = parseInt(fromRoom);
    const end = parseInt(toRoom);
    if (isNaN(start) || isNaN(end) || start > end) {
      return res.status(400).json({ message: "Invalid room range" });
    }

    // ✅ Generate room numbers
    const values = [];
    for (let i = start; i <= end; i++) {
      const eastRoom = [`E${i}`, floor, "East", eastSharing, 0];
      const westRoom = [`W${i}`, floor, "West", westSharing, 0];
      values.push(eastRoom, westRoom);
    }

    // ✅ Insert rooms
    for (const v of values) {
      await pool.query(
        `INSERT INTO rooms (room_number, floor, side, sharing, occupied)
   VALUES ($1, $2, $3, $4, $5)
   ON CONFLICT (room_number) DO NOTHING`,
        v
      );
    }

    res.json({
      message: `✅ Auto-generated ${values.length} rooms successfully for Floor ${floor}!`,
    });
  } catch (error) {
    console.error("❌ Error auto-generating rooms:", error);
    res.status(500).json({ message: "Error auto-generating rooms" });
  }
});

/* ==========================================================
   🏠 ADD MANUAL ROOM
   POST /api/rooms
========================================================== */
router.post("/", authMiddleware, isWarden, async (req, res) => {
  try {
    const { room_number, floor, side, sharing, occupied } = req.body;

    const result = await pool.query(
      `INSERT INTO rooms (room_number, floor, side, sharing, occupied)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [room_number, floor, side, sharing, occupied || 0]
    );

    res.status(201).json({
      message: "Room added successfully ✅",
      room: result.rows[0],
    });
  } catch (error) {
    console.error("Error adding room:", error);
    res.status(500).json({ message: "Error adding room" });
  }
});

/* ==========================================================
   📋 FETCH ALL ROOMS
   GET /api/rooms
========================================================== */
router.get("/", authMiddleware, isWarden, async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM rooms ORDER BY floor, side, room_number"
    );
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching rooms:", error);
    res.status(500).json({ message: "Error fetching rooms" });
  }
});

/* ==========================================================
   ✏️ EDIT ROOM
   PUT /api/rooms/:id
========================================================== */
// ✅ Edit room details (Warden/Admin)
router.put("/:id", authMiddleware, isWarden, async (req, res) => {
  try {
    const { id } = req.params;
    const { room_number, floor, side, sharing, occupied } = req.body;

    console.log("🛠️ Edit request for room:", id, req.body);

    // Basic validations
    if (!room_number || !floor || !side || !sharing) {
      return res.status(400).json({
        message:
          "Missing required fields. Please include room_number, floor, side, and sharing.",
      });
    }

    // Check if room exists
    const existing = await pool.query("SELECT * FROM rooms WHERE id = $1", [
      id,
    ]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ message: "Room not found" });
    }

    // Update room details
    const result = await pool.query(
      `UPDATE rooms
       SET room_number = $1,
           floor = $2,
           side = $3,
           sharing = $4,
           occupied = COALESCE($5, occupied)
       WHERE id = $6
       RETURNING *`,
      [room_number, floor, side, sharing, occupied, id]
    );

    res.json({
      message: "✅ Room updated successfully!",
      updatedRoom: result.rows[0],
    });
  } catch (error) {
    console.error("❌ Error updating room:", error);
    res.status(500).json({ message: "Error updating room" });
  }
});

/* ==========================================================
   ❌ DELETE SINGLE ROOM
   DELETE /api/rooms/:id
========================================================== */
router.delete("/:id", authMiddleware, isWarden, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      "DELETE FROM rooms WHERE id=$1 RETURNING *",
      [id]
    );

    if (result.rows.length === 0)
      return res.status(404).json({ message: "Room not found" });

    res.json({ message: "Room deleted successfully ✅" });
  } catch (error) {
    console.error("Error deleting room:", error);
    res.status(500).json({ message: "Error deleting room" });
  }
});

/* ==========================================================
   🧹 DELETE ALL ROOMS
   DELETE /api/rooms
========================================================== */
router.delete("/", authMiddleware, isWarden, async (req, res) => {
  try {
    await pool.query("DELETE FROM rooms");
    res.json({ message: "All rooms deleted successfully 🧹" });
  } catch (error) {
    console.error("Error deleting all rooms:", error);
    res.status(500).json({ message: "Error deleting all rooms" });
  }
});

module.exports = router;
