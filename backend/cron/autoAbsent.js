const cron = require("node-cron");
const attendance = require("../controllers/attendanceController");

// Runs EVERY DAY at 11:59 PM
cron.schedule("59 23 * * *", () => {
  console.log("⏳ Auto-Absent Job Running...");
  attendance.autoMarkAbsent();
});
