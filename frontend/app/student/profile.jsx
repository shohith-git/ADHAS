import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
} from "react-native";
import axios from "axios";
import { useRouter } from "expo-router";

export default function StudentProfile() {
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const BACKEND = "http://10.69.232.21:5000";
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const rawId =
    typeof window !== "undefined" ? localStorage.getItem("user_id") : null;
  const studentId = rawId ? Number(rawId) : null;

  const redirectToLogin = () => {
    if (typeof window !== "undefined") {
      window.location.href = "/login";
    }
  };

  const fetchProfile = async () => {
    if (!studentId || isNaN(studentId) || studentId <= 0) {
      console.error("Invalid studentId in localStorage:", rawId);
      Alert.alert(
        "Session Error",
        "Student ID not found. Please log in again.",
        [{ text: "OK", onPress: redirectToLogin }]
      );
      setLoading(false);
      return;
    }

    if (!token) {
      console.error("Missing token in localStorage");
      Alert.alert(
        "Authentication Error",
        "Login token missing. Please login again.",
        [{ text: "OK", onPress: redirectToLogin }]
      );
      setLoading(false);
      return;
    }

    try {
      console.log(`Fetching profile for studentId=${studentId}`);
      const res = await axios.get(`${BACKEND}/api/students/${studentId}`, {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 10000,
      });
      setStudent(res.data);
    } catch (err) {
      if (err.response) {
        const status = err.response.status;
        if (status === 401 || status === 403) {
          Alert.alert("Unauthorized", "Session expired. Please login again.", [
            { text: "OK", onPress: redirectToLogin },
          ]);
        } else if (status === 404) {
          Alert.alert("Not found", "Profile not found. Contact your warden.");
        } else {
          Alert.alert("Error", "Failed to load profile data (server error).");
        }
      } else if (err.code === "ECONNABORTED") {
        Alert.alert("Timeout", "Server did not respond. Try again later.");
      } else {
        Alert.alert("Network Error", "Check your internet connection.");
      }
      console.error("Error fetching profile:", err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  if (loading)
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text>Loading Profile...</Text>
      </View>
    );

  if (!student)
    return (
      <View style={styles.centered}>
        <Text>No profile data found. Please contact your warden.</Text>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.push("/student-dashboard")}
        >
          <Text style={styles.backText}>← Back to Dashboard</Text>
        </TouchableOpacity>
      </View>
    );

  return (
    <ScrollView style={styles.page} contentContainerStyle={{ padding: 20 }}>
      <Text style={styles.header}>👤 My Profile</Text>

      <View style={styles.card}>
        <Row label="Name" value={student.name} />
        <Row label="Email" value={student.email} />
        <Row label="Department" value={student.dept_branch || "—"} />
        <Row label="Year" value={student.year || "—"} />
        <Row label="Batch" value={student.batch || "—"} />
        <Row label="Room Number" value={student.room_no || "—"} />
        <Row label="Gender" value={student.gender || "—"} />
        <Row label="Date of Birth" value={student.dob?.split("T")[0] || "—"} />
        <Row label="Phone" value={student.phone_number || "—"} />
        <Row label="Address" value={student.address || "—"} />

        <Text style={styles.sectionHeader}>Parent Details</Text>
        <Row label="Father Name" value={student.father_name || "—"} />
        <Row label="Father Number" value={student.father_number || "—"} />
        <Row label="Mother Name" value={student.mother_name || "—"} />
        <Row label="Mother Number" value={student.mother_number || "—"} />
      </View>

      {/* Back Button */}
      <TouchableOpacity
        style={styles.backBtn}
        onPress={() => router.push("/student-dashboard")}
      >
        <Text style={styles.backText}>← Back to Dashboard</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

/* 🔹 Row component for neat profile layout */
const Row = ({ label, value }) => (
  <View style={styles.row}>
    <Text style={styles.label}>{label}</Text>
    <Text style={styles.value}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  page: { backgroundColor: "#f8fafc", flex: 1 },
  header: {
    fontSize: 24,
    fontWeight: "700",
    color: "#0f172a",
    marginBottom: 20,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 16,
    elevation: 2,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
    paddingVertical: 8,
  },
  label: { fontWeight: "600", color: "#334155" },
  value: { color: "#1e293b" },
  sectionHeader: {
    fontSize: 16,
    fontWeight: "700",
    color: "#2563eb",
    marginTop: 14,
    marginBottom: 8,
  },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  backBtn: {
    backgroundColor: "#0b5cff",
    padding: 12,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 25,
    marginBottom: 10,
  },
  backText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 15,
  },
});
