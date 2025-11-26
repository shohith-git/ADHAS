// utils/recalculateOccupancy.js
const pool = require("../db");

async function recalcAllRooms() {
  try {
    await pool.query(`
      UPDATE rooms r SET
        occupied = COALESCE((
          SELECT COUNT(*) 
          FROM student_profiles sp 
          WHERE sp.room_no = r.room_number
        ),0),
        available = GREATEST(
          sharing - COALESCE((
            SELECT COUNT(*) FROM student_profiles sp WHERE sp.room_no = r.room_number
          ),0), 
        0
      );
    `);

    console.log("✔ All rooms recalculated");
  } catch (e) {
    console.error("recalc error:", e.message);
  }
}

module.exports = recalcAllRooms;
