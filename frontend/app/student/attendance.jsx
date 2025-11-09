// adhas/frontend/app/student/attendance.jsx

import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
} from "react-native";
import axios from "axios";
import { useRouter } from "expo-router";

export default function StudentAttendance() {
  const router = useRouter();
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(false);

  const BACKEND = "http://10.69.232.21:5000";
  const student_id = 3; // ⚠️ Replace with logged-in student's ID from AsyncStorage

  const fetchAttendance = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${BACKEND}/api/attendance/${student_id}`);
      setAttendance(res.data);
    } catch (err) {
      console.error("❌ Error fetching attendance:", err);
      Alert.alert("Error", "Failed to load attendance records");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendance();
  }, []);

  return (
    <ScrollView style={styles.page} contentContainerStyle={{ padding: 20 }}>
      <Text style={styles.header}>📅 Attendance Records</Text>

      {loading ? (
        <ActivityIndicator size="large" color="#0b5cff" />
      ) : attendance.length === 0 ? (
        <Text style={{ textAlign: "center", color: "#64748b" }}>
          No attendance records found.
        </Text>
      ) : (
        attendance.map((a) => (
          <View key={a.id} style={styles.card}>
            <Text style={styles.date}>
              📆 {a.date?.split("T")[0]} — 🕒 {a.time?.split(".")[0]}
            </Text>
            <Text style={styles.meta}>📍 Location: {a.location}</Text>
            <Text style={styles.meta}>🧾 Method: {a.method}</Text>
          </View>
        ))
      )}

      <TouchableOpacity
        style={styles.backBtn}
        onPress={() => router.push("/student-dashboard")}
      >
        <Text style={styles.backBtnText}>← Back to Dashboard</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: "#f8fafc" },
  header: {
    fontSize: 22,
    fontWeight: "700",
    color: "#0f172a",
    marginBottom: 20,
    textAlign: "center",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 14,
    marginBottom: 12,
    shadowColor: "#00000022",
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 3,
  },
  date: {
    fontSize: 16,
    fontWeight: "600",
    color: "#0b5cff",
    marginBottom: 4,
  },
  meta: {
    color: "#334155",
    fontSize: 14,
    marginTop: 2,
  },
  backBtn: {
    marginTop: 20,
    backgroundColor: "#0b5cff",
    padding: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  backBtnText: { color: "#fff", fontWeight: "700" },
});
