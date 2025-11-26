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

    if (!fromRoom || !toRoom || !floor || !eastSharing || !westSharing) {
      return res.status(400).json({
        message: "⚠️ Provide fromRoom, toRoom, floor, eastSharing, westSharing",
      });
    }

    const start = parseInt(fromRoom);
    const end = parseInt(toRoom);

    if (isNaN(start) || isNaN(end) || start > end) {
      return res.status(400).json({ message: "⚠️ Invalid room range" });
    }

    const values = [];
    for (let i = start; i <= end; i++) {
      values.push([`E${i}`, floor, "East", eastSharing, 0]);
      values.push([`W${i}`, floor, "West", westSharing, 0]);
    }

    for (const v of values) {
      await pool.query(
        `INSERT INTO rooms (room_number, floor, side, sharing, occupied)
         VALUES ($1,$2,$3,$4,$5)
         ON CONFLICT (room_number, floor, side) DO NOTHING`,
        v
      );
    }

    res.json({
      message: `Rooms ${fromRoom}–${toRoom} created for floor ${floor}`,
    });
  } catch (err) {
    console.error("❌ Auto-generate error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/* ==========================================================
   🏠 ADD MANUAL ROOM
========================================================== */
router.post("/", authMiddleware, isWarden, async (req, res) => {
  try {
    const { room_number, floor, side, sharing } = req.body;

    if (!room_number || !floor || !side || !sharing) {
      return res.status(400).json({ message: "Fill all fields" });
    }

    const room = await pool.query(
      `INSERT INTO rooms (room_number, floor, side, sharing, occupied)
       VALUES ($1,$2,$3,$4,0)
       ON CONFLICT (room_number, floor, side) DO NOTHING
       RETURNING *`,
      [room_number, floor, side, sharing]
    );

    if (room.rows.length === 0) {
      return res.status(409).json({ message: "Room already exists" });
    }

    res.json({
      message: `Room ${room_number} added`,
      room: room.rows[0],
    });
  } catch (err) {
    console.error("❌ Add room error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/* ==========================================================
   📋 FETCH ROOMS (Auto-sync occupancy)
========================================================== */
router.get("/", authMiddleware, isWarden, async (req, res) => {
  try {
    // Step 1: Sync occupancy for EACH unique (room_number,floor,side)
    await pool.query(`
      UPDATE rooms r
      SET occupied = COALESCE(sp.count,0)
      FROM (
        SELECT room_no, COUNT(*) AS count 
        FROM student_profiles
        WHERE room_no IS NOT NULL
        GROUP BY room_no
      ) sp
      WHERE r.room_number = sp.room_no
    `);

    // Step 2: Rooms not used get occupied = 0
    await pool.query(`
      UPDATE rooms
      SET occupied = 0
      WHERE room_number NOT IN (
        SELECT DISTINCT room_no FROM student_profiles WHERE room_no IS NOT NULL
      )
    `);

    // Step 3: Return rooms
    const rooms = await pool.query(`
      SELECT 
        id, room_number, floor, side, sharing, occupied,
        GREATEST(sharing - occupied,0) AS available
      FROM rooms
      ORDER BY floor, side, room_number
    `);

    res.json(rooms.rows);
  } catch (err) {
    console.error("❌ Fetch rooms error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/* ==========================================================
   ✏️ EDIT ROOM (Safe version)
========================================================== */
router.put("/:id", authMiddleware, isWarden, async (req, res) => {
  try {
    const { id } = req.params;
    const { room_number, floor, side, sharing } = req.body;

    if (!room_number || !floor || !side || !sharing) {
      return res.status(400).json({ message: "Fill all fields" });
    }

    // 1. Get old room details
    const oldRoom = await pool.query(`SELECT * FROM rooms WHERE id=$1`, [id]);
    if (oldRoom.rows.length === 0) {
      return res.status(404).json({ message: "Room not found" });
    }

    const oldRoomNo = oldRoom.rows[0].room_number;

    // 2. Update the room
    const updated = await pool.query(
      `UPDATE rooms
       SET room_number=$1, floor=$2, side=$3, sharing=$4
       WHERE id=$5
       RETURNING *`,
      [room_number, floor, side, sharing, id]
    );

    // 3. Update students → if room renamed
    if (oldRoomNo !== room_number) {
      await pool.query(
        `UPDATE student_profiles 
         SET room_no=$1 
         WHERE room_no=$2`,
        [room_number, oldRoomNo]
      );
    }

    res.json({
      message: `Room updated successfully`,
      updatedRoom: updated.rows[0],
    });
  } catch (err) {
    console.error("❌ Update room error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/* ==========================================================
   ❌ DELETE ROOM (Unassign students)
========================================================== */
router.delete("/:id", authMiddleware, isWarden, async (req, res) => {
  try {
    const { id } = req.params;

    const room = await pool.query(`SELECT room_number FROM rooms WHERE id=$1`, [
      id,
    ]);
    if (room.rows.length === 0)
      return res.status(404).json({ message: "Room not found" });

    const roomNo = room.rows[0].room_number;

    // Step 1: Unassign students in this room
    await pool.query(
      `UPDATE student_profiles SET room_no=NULL WHERE room_no=$1`,
      [roomNo]
    );

    // Step 2: Delete the room
    await pool.query(`DELETE FROM rooms WHERE id=$1`, [id]);

    res.json({
      message: `Room ${roomNo} deleted, students unallocated`,
    });
  } catch (err) {
    console.error("❌ Delete room error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/* ==========================================================
   ❌ DELETE ALL ROOMS
========================================================== */
router.delete("/", authMiddleware, isWarden, async (req, res) => {
  try {
    await pool.query(`UPDATE student_profiles SET room_no=NULL`);
    const del = await pool.query(`DELETE FROM rooms RETURNING *`);

    res.json({
      message: "All rooms deleted",
      deletedCount: del.rows.length,
    });
  } catch (err) {
    console.error("❌ Delete all rooms error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
