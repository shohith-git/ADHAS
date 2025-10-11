const pool = require("../db");

// Get all rooms
const getRooms = async (req, res) => {
  try {
    const rooms = await pool.query("SELECT * FROM rooms");
    res.json(rooms.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
};

// Add a new room
const addRoom = async (req, res) => {
  const { room_number, type, capacity, status } = req.body;
  try {
    const newRoom = await pool.query(
      "INSERT INTO rooms (room_number, type, capacity, status) VALUES ($1,$2,$3,$4) RETURNING *",
      [room_number, type, capacity, status]
    );
    res.status(201).json(newRoom.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
};

// Update a room
const updateRoom = async (req, res) => {
  const { id } = req.params;
  const { room_number, type, capacity, status } = req.body;
  try {
    const updatedRoom = await pool.query(
      "UPDATE rooms SET room_number=$1, type=$2, capacity=$3, status=$4 WHERE id=$5 RETURNING *",
      [room_number, type, capacity, status, id]
    );
    res.json(updatedRoom.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
};

// Delete a room
const deleteRoom = async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query("DELETE FROM rooms WHERE id=$1", [id]);
    res.json({ message: "Room deleted successfully" });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
};

module.exports = { getRooms, addRoom, updateRoom, deleteRoom };
