import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
} from "react-native";
import axios from "axios";
import { useRouter } from "expo-router";

export default function AttendancePresent() {
  const router = useRouter();
  const [students, setStudents] = useState([]);
  const [attendanceList, setAttendanceList] = useState([]);
  const [loading, setLoading] = useState(true);

  const BACKEND = "http://10.69.232.21:5000";
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;

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
    console.log("Fetched attendance:", attendanceList);
    console.log("Today local date:", today);
  }, [attendanceList]);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    const unsubscribe = router?.addListener?.("focus", fetchData);
    return unsubscribe;
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

  const presentStudents = students
    .filter((s) => presentIds.includes(s.id))
    .sort((a, b) => (a.room_no || "").localeCompare(b.room_no || ""));

  if (loading)
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text>Loading...</Text>
      </View>
    );

  return (
    <ScrollView style={styles.page} contentContainerStyle={{ padding: 20 }}>
      <Text style={styles.header}>✅ Present Students</Text>

      {presentStudents.length === 0 ? (
        <Text style={styles.empty}>No students marked present yet.</Text>
      ) : (
        presentStudents.map((s) => {
          const att = attendanceList.find((a) => a.student_id === s.id);
          return (
            <View key={s.id} style={styles.card}>
              <Text style={styles.name}>{s.name}</Text>
              <Text style={styles.meta}>USN: {s.usn || "—"}</Text>
              <Text style={styles.meta}>Dept: {s.dept_branch || "—"}</Text>
              <Text style={styles.meta}>Room: {s.room_no || "—"}</Text>
              <Text style={styles.meta}>
                Date: {att?.date?.split("T")[0]} | Time:{" "}
                {att?.time?.split(".")[0] || "--:--"}
              </Text>
              <Text style={styles.meta}>Location: {att?.location || "—"}</Text>
            </View>
          );
        })
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
    color: "#16a34a",
    marginBottom: 20,
  },
  card: {
    backgroundColor: "#dcfce7",
    borderColor: "#22c55e",
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
