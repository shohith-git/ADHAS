const express = require("express");
const cors = require("cors");
require("dotenv").config();

// Import routes
const userRoutes = require("./routes/userRoutes"); // ✅ make sure the path is correct

const roomRoutes = require("./routes/roomRoutes");

const attendanceRoutes = require("./routes/attendanceRoutes");

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json()); // ✅ must be before routes

app.use("/api/rooms", roomRoutes);

app.use("/api/attendance", attendanceRoutes);
// Routes
app.use("/api/users", userRoutes); // ✅ make sure userRoutes exports router correctly

// Test route
app.get("/", (req, res) => {
  res.send("ADHAS Backend Running ✅");
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
