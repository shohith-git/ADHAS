import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import axios from "axios";
import { useRouter } from "expo-router";

export default function AdminAttendance() {
  const router = useRouter();
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(false);

  const BACKEND = "http://172.29.206.21:5000";

  // 🟢 Fetch attendance logs
  const fetchAttendance = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${BACKEND}/api/admin/attendance`);
      setAttendance(res.data);
    } catch (err) {
      console.error("❌ Error fetching attendance logs:", err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendance();
  }, []);

  return (
    <ScrollView style={styles.page} contentContainerStyle={{ padding: 20 }}>
      <Text style={styles.header}>📅 Attendance Logs</Text>

      {loading ? (
        <ActivityIndicator size="large" color="#0b5cff" />
      ) : attendance.length === 0 ? (
        <Text style={{ textAlign: "center", color: "#64748b" }}>
          No attendance records found.
        </Text>
      ) : (
        attendance.map((record) => (
          <View key={record.id} style={styles.card}>
            <Text style={styles.name}>
              {record.student_name || "Unknown Student"}
            </Text>
            <Text style={styles.email}>{record.student_email}</Text>

            <View style={styles.row}>
              <Text style={styles.label}>📅 Date:</Text>
              <Text style={styles.value}>
                {new Date(record.date).toLocaleDateString("en-IN", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })}
              </Text>
            </View>

            <View style={styles.row}>
              <Text style={styles.label}>🕒 Time:</Text>
              <Text style={styles.value}>
                {record.time ? record.time.split(".")[0] : "Unknown Time"}
              </Text>
            </View>

            <View style={styles.row}>
              <Text style={styles.label}>📍 Location:</Text>
              <Text style={styles.value}>{record.location || "N/A"}</Text>
            </View>

            <View style={styles.row}>
              <Text style={styles.label}>🧾 Method:</Text>
              <Text style={styles.value}>{record.method || "Manual"}</Text>
            </View>
          </View>
        ))
      )}

      <TouchableOpacity
        style={styles.backBtn}
        onPress={() => router.push("/admin-dashboard")}
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
    marginBottom: 14,
    boxShadow: "0 2px 3px rgba(0,0,0,0.08)",
  },
  name: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0f172a",
  },
  email: {
    color: "#64748b",
    fontSize: 13,
    marginBottom: 8,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  label: { fontWeight: "600", color: "#334155", fontSize: 14 },
  value: { color: "#475569", fontSize: 14 },
  backBtn: {
    marginTop: 20,
    backgroundColor: "#0b5cff",
    padding: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  backBtnText: { color: "#fff", fontWeight: "700" },
});
