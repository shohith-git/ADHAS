// adhas/frontend/app/warden/attendance.jsx

import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import axios from "axios";
import { useRouter } from "expo-router";

export default function AttendancePage() {
  const router = useRouter();
  const [studentId, setStudentId] = useState("");
  const [method, setMethod] = useState("");
  const [location, setLocation] = useState("");
  const [attendanceList, setAttendanceList] = useState([]);
  const [loading, setLoading] = useState(false);

  const BACKEND = "http://10.69.232.21:5000"; // change IP if backend changes
  const token =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6Miwicm9sZSI6IndhcmRlbiIsImNvbGxlZ2UiOiJjaXRfbmMuZWR1LmluIiwiaWF0IjoxNzYxOTkzOTMxLCJleHAiOjE3NjIwMTU1MzF9.1RBDfdOovVsv6t_r3QOWZnB-dg-OYWQGF7Ph45vdOk0";

  // 🟢 Fetch attendance list
  const fetchAttendance = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${BACKEND}/api/attendance`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAttendanceList(res.data);
    } catch (err) {
      console.error("❌ Error fetching attendance:", err);
      Alert.alert("Error", "Unable to fetch attendance records");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendance();
  }, []);

  // 🟠 Mark new attendance
  const markAttendance = async () => {
    if (!studentId || !method || !location) {
      Alert.alert("Missing Fields", "Please fill all fields");
      return;
    }

    try {
      setLoading(true);
      const res = await axios.post(
        `${BACKEND}/api/attendance`,
        {
          student_id: parseInt(studentId),
          method,
          location,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      Alert.alert("✅ Success", "Attendance marked successfully");
      setStudentId("");
      setMethod("");
      setLocation("");
      fetchAttendance();
    } catch (err) {
      console.error("❌ Error marking attendance:", err.response?.data || err);
      Alert.alert("Error", "Failed to mark attendance");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.page} contentContainerStyle={{ padding: 20 }}>
      <Text style={styles.header}>📋 Warden Attendance Panel</Text>

      {/* Mark Attendance Form */}
      <View style={styles.form}>
        <TextInput
          style={styles.input}
          placeholder="Enter Student ID"
          keyboardType="numeric"
          value={studentId}
          onChangeText={setStudentId}
        />
        <TextInput
          style={styles.input}
          placeholder="Enter Method (Manual / QR / etc.)"
          value={method}
          onChangeText={setMethod}
        />
        <TextInput
          style={styles.input}
          placeholder="Enter Location (e.g., Hostel Block A)"
          value={location}
          onChangeText={setLocation}
        />
        <TouchableOpacity style={styles.btn} onPress={markAttendance}>
          <Text style={styles.btnText}>Mark Attendance</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.subHeader}>📆 Recent Attendance Records</Text>

      {loading ? (
        <ActivityIndicator size="large" color="#007bff" />
      ) : attendanceList.length === 0 ? (
        <Text style={{ color: "#64748b", textAlign: "center" }}>
          No attendance records found.
        </Text>
      ) : (
        attendanceList.map((a) => (
          <View key={a.id} style={styles.card}>
            <Text style={styles.cardTitle}>
              {a.student_name || "Student"} ({a.student_email || "N/A"})
            </Text>
            <Text style={styles.meta}>
              Date: {a.date?.split("T")[0]} | Time: {a.time?.split(".")[0]}
            </Text>
            <Text style={styles.meta}>
              Method: {a.method} | Location: {a.location}
            </Text>
          </View>
        ))
      )}

      <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
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
    marginBottom: 16,
    textAlign: "center",
  },
  form: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
    shadowColor: "#00000022",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
    fontSize: 14,
  },
  btn: {
    backgroundColor: "#007bff",
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: "center",
  },
  btnText: { color: "#fff", fontWeight: "700" },
  subHeader: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0f172a",
    marginBottom: 12,
  },
  card: {
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 10,
    marginBottom: 10,
    shadowColor: "#00000011",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
  },
  cardTitle: { fontWeight: "700", color: "#1e293b", fontSize: 15 },
  meta: { color: "#475569", fontSize: 13, marginTop: 4 },
  backBtn: {
    marginTop: 20,
    backgroundColor: "#0b5cff",
    padding: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  backBtnText: { color: "#fff", fontWeight: "700" },
});
