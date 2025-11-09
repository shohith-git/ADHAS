import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import axios from "axios";
import { useRouter } from "expo-router";

export default function AttendanceAbsent() {
  const router = useRouter();
  const [students, setStudents] = useState([]);
  const [attendanceList, setAttendanceList] = useState([]);
  const [loading, setLoading] = useState(true);

  const BACKEND = "http://10.69.232.21:5000";
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;

  // 🔹 Fetch all students + attendance
  const fetchData = async () => {
    try {
      const [studentsRes, attendanceRes] = await Promise.all([
        axios.get(`${BACKEND}/api/students`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get(`${BACKEND}/api/attendance`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);
      setStudents(studentsRes.data);
      setAttendanceList(attendanceRes.data);
    } catch (err) {
      console.error("❌ Error loading attendance data:", err);
      Alert.alert("Error", "Unable to fetch attendance data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Normalize DB date to local yyyy-mm-dd for comparison
  const normalizeDate = (dateStr) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
    return local.toISOString().split("T")[0];
  };

  const today = new Date().toLocaleDateString("en-CA"); // yyyy-mm-dd
  const presentIds = attendanceList
    .filter((a) => normalizeDate(a.date) === today)
    .map((a) => a.student_id);

  // 🔹 Sort Absent students by room number
  const absentStudents = students
    .filter((s) => !presentIds.includes(s.id))
    .sort((a, b) => (a.room_no || "").localeCompare(b.room_no || ""));

  // ✅ Mark Attendance + Redirect
  const markAttendance = async (id) => {
    try {
      // Mark present in backend
      const res = await axios.post(
        `${BACKEND}/api/attendance`,
        {
          student_id: id,
          method: "Manual",
          location: "Hostel Block",
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      console.log("✅ Attendance saved:", res.data);
      Alert.alert("✅ Marked", "Student marked as present");

      // ⚡ Immediately refresh state locally
      setAttendanceList((prev) => [
        ...prev,
        {
          student_id: id,
          date: new Date().toISOString(),
          method: "Manual",
          location: "Hostel Block",
        },
      ]);

      // ⚡ Remove student from absent instantly (no refetch needed)
      setStudents((prev) => prev.filter((s) => s.id !== id));
    } catch (err) {
      console.error("❌ Error marking attendance:", err);
      Alert.alert("Error", "Unable to mark attendance");
    }
  };

  if (loading)
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text>Loading...</Text>
      </View>
    );

  return (
    <ScrollView style={styles.page} contentContainerStyle={{ padding: 20 }}>
      <Text style={styles.header}>❌ Absent Students</Text>

      {absentStudents.length === 0 ? (
        <Text style={styles.empty}>All students are present today 🎉</Text>
      ) : (
        absentStudents.map((s) => (
          <View key={s.id} style={styles.card}>
            <Text style={styles.name}>{s.name}</Text>
            <Text style={styles.meta}>USN: {s.usn || "—"}</Text>
            <Text style={styles.meta}>Dept: {s.dept_branch || "—"}</Text>
            <Text style={styles.meta}>Room: {s.room_no || "—"}</Text>
            <TouchableOpacity
              style={styles.btn}
              onPress={() => markAttendance(s.id)}
            >
              <Text style={styles.btnText}>✅ Mark Present</Text>
            </TouchableOpacity>
          </View>
        ))
      )}

      <TouchableOpacity
        style={styles.navBtn}
        onPress={() => router.push("/warden/attendance")}
      >
        <Text style={styles.navBtnText}>📋 Go to Attendance Dashboard</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: "#f8fafc" },
  header: {
    fontSize: 22,
    fontWeight: "700",
    color: "#dc2626",
    marginBottom: 20,
  },
  card: {
    backgroundColor: "#fee2e2",
    borderColor: "#ef4444",
    borderWidth: 1.5,
    borderRadius: 10,
    padding: 14,
    marginBottom: 12,
    shadowColor: "#00000011",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
  },
  name: { fontWeight: "700", fontSize: 16, color: "#0f172a" },
  meta: { color: "#475569", fontSize: 13, marginTop: 3 },
  btn: {
    backgroundColor: "#16a34a",
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 10,
  },
  btnText: { color: "#fff", fontWeight: "700" },
  backBtn: {
    marginTop: 20,
    backgroundColor: "#2563eb",
    padding: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  backBtnText: { color: "#fff", fontWeight: "700" },
  empty: { color: "#64748b", textAlign: "center" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  navBtn: {
    marginTop: 20,
    backgroundColor: "#0b5cff",
    padding: 12,
    borderRadius: 10,
    alignItems: "center",
    elevation: 2,
  },
  navBtnText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 15,
  },
});
