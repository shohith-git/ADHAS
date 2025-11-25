// backend/routes/roomRoutes.js
const express = require("express");
const router = express.Router();
const pool = require("../db");
const { authMiddleware, isWarden } = require("../middleware/authMiddleware");

/* ==========================================================
   🏗️ AUTO-GENERATE ROOMS
========================================================== */
router.post("/auto-generate", authMiddleware, isWarden, async (req, res) => {
  try {
    const { fromRoom, toRoom, floor, eastSharing, westSharing } = req.body;
    console.log("🔹 /auto-generate called:", req.body);

    if (
      fromRoom === undefined ||
      toRoom === undefined ||
      floor === undefined ||
      eastSharing === undefined ||
      westSharing === undefined
    ) {
      return res.status(400).json({
        message:
          "⚠️ Missing required fields. Please provide fromRoom, toRoom, floor, eastSharing, and westSharing.",
      });
    }

    const start = parseInt(fromRoom, 10);
    const end = parseInt(toRoom, 10);
    if (isNaN(start) || isNaN(end) || start > end)
      return res.status(400).json({ message: "⚠️ Invalid room range." });

    const values = [];
    for (let i = start; i <= end; i++) {
      values.push([`E${i}`, parseInt(floor), "East", parseInt(eastSharing), 0]);
      values.push([`W${i}`, parseInt(floor), "West", parseInt(westSharing), 0]);
    }

    for (const v of values) {
      await pool.query(
        `INSERT INTO rooms (room_number, floor, side, sharing, occupied)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (room_number, floor, side) DO NOTHING`,
        v
      );
    }

    console.log(`✅ Auto-generated ${values.length} rooms on floor ${floor}`);
    res.json({
      message: `✅ Successfully generated rooms from ${fromRoom} to ${toRoom} for floor ${floor}`,
    });
  } catch (error) {
    console.error("❌ Error auto-generating rooms:", error);
    res.status(500).json({
      message: "❌ Server error while auto-generating rooms. Please try again.",
    });
  }
});

/* ==========================================================
   🏠 ADD MANUAL ROOM
========================================================== */
router.post("/", authMiddleware, isWarden, async (req, res) => {
  try {
    const { room_number, floor, side, sharing, occupied } = req.body;

    if (!room_number || !floor || !side || !sharing) {
      return res
        .status(400)
        .json({ message: "⚠️ Missing required fields for adding a room." });
    }

    const result = await pool.query(
      `INSERT INTO rooms (room_number, floor, side, sharing, occupied)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (room_number, floor, side) DO NOTHING
       RETURNING *`,
      [
        room_number,
        parseInt(floor),
        side,
        parseInt(sharing),
        parseInt(occupied || 0),
      ]
    );

    if (result.rows.length === 0) {
      return res.status(409).json({
        message: `⚠️ Room ${room_number} already exists for Floor ${floor} (${side} side).`,
      });
    }

    console.log(`✅ Added room ${room_number} (Floor ${floor}, ${side})`);
    res.status(201).json({
      message: `✅ Room ${room_number} added successfully.`,
      room: result.rows[0],
    });
  } catch (error) {
    console.error("❌ Error adding room:", error);
    res.status(500).json({
      message: "❌ Failed to add room. Please try again later.",
    });
  }
});

/* ==========================================================
   📋 FETCH ALL ROOMS
========================================================== */
router.get("/", authMiddleware, isWarden, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, room_number, floor, side, sharing, occupied,
              GREATEST(COALESCE(sharing, 1) - COALESCE(occupied, 0), 0) AS available
       FROM rooms
       ORDER BY floor, side, room_number`
    );
    console.log(`📦 Rooms fetched: ${result.rows.length}`);
    res.json(result.rows);
  } catch (error) {
    console.error("❌ Error fetching rooms:", error);
    res.status(500).json({ message: "❌ Failed to fetch room list." });
  }
});

/* ==========================================================
   ✏️ EDIT ROOM
========================================================== */
router.put("/:id", authMiddleware, isWarden, async (req, res) => {
  try {
    const { id } = req.params;
    const { room_number, floor, side, sharing, occupied } = req.body;

    if (!room_number || !floor || !side || !sharing) {
      return res.status(400).json({
        message:
          "⚠️ Missing fields. Provide room_number, floor, side, and sharing.",
      });
    }

    const existing = await pool.query("SELECT * FROM rooms WHERE id = $1", [
      id,
    ]);
    if (existing.rows.length === 0)
      return res.status(404).json({ message: "⚠️ Room not found." });

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

    console.log(`✅ Updated room ${room_number} (ID ${id})`);
    res.json({
      message: `✅ Room ${room_number} updated successfully.`,
      updatedRoom: result.rows[0],
    });
  } catch (error) {
    console.error("❌ Error updating room:", error);
    res.status(500).json({ message: "❌ Server error while updating room." });
  }
});

/* ==========================================================
   ❌ DELETE SINGLE ROOM (NOW SAFE)
========================================================== */
router.delete("/:id", authMiddleware, isWarden, async (req, res) => {
  console.log("🔍 DELETE /api/rooms/:id HIT");
  console.log("➡ Params:", req.params);

  try {
    const { id } = req.params;

    // Check room exists
    const exists = await pool.query("SELECT * FROM rooms WHERE id=$1", [id]);

    if (exists.rows.length === 0) {
      return res.status(404).json({ message: "Room not found" });
    }

    const room = exists.rows[0];

    // 🔥 Important Fix:
    // Clear this room assignment from student_profiles before deleting
    await pool.query(
      `UPDATE student_profiles SET room_no = NULL WHERE room_no = $1`,
      [room.room_number]
    );

    // Delete room
    const result = await pool.query(
      "DELETE FROM rooms WHERE id=$1 RETURNING *",
      [id]
    );

    res.json({
      message: `Room ${result.rows[0].room_number} deleted successfully`,
    });
  } catch (error) {
    res.status(500).json({
      message: "Server error while deleting room",
      error: error.message,
    });
  }
});

module.exports = router;
