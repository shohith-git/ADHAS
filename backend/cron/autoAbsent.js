const cron = require("node-cron");
const attendance = require("../controllers/attendanceController");

// 🕒 Runs EVERY DAY at 11:59 PM
cron.schedule("59 23 * * *", async () => {
  try {
    console.log("⏳ Auto-Absent Job Running...");

    await attendance.autoMarkAbsent();

    console.log("✅ Auto-Absent Job Completed Successfully.");
  } catch (err) {
    console.error("❌ Auto-Absent Job Failed:", err.message);
  }
});
