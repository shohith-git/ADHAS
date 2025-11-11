// 📁 server.js
const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5000;

// 🧠 Middleware
app.use(cors());
app.use(express.json());

// 🔗 Import all routes
const userRoutes = require("./routes/userRoutes");
const studentRoutes = require("./routes/studentRoutes");
const roomRoutes = require("./routes/roomRoutes");
const attendanceRoutes = require("./routes/attendanceRoutes");
const complaintRoutes = require("./routes/complaintRoutes");
const authRoutes = require("./routes/authRoutes");
const adminRoutes = require("./routes/adminRoutes");
const profileRoutes = require("./routes/profileRoutes");
const remarkRoutes = require("./routes/remarkRoutes");

// 🛠️ Route mapping
app.use("/api/users", userRoutes);
app.use("/api/students", studentRoutes);
app.use("/api/rooms", roomRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/complaints", complaintRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/remarks", remarkRoutes);

// 🧪 Health Check
app.get("/", (req, res) => {
  res.send("ADHAS Backend Running ✅");
});

// 🚀 Start Server
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on http://10.69.232.21:${PORT}`);
});
