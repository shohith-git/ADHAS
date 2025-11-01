import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from "react-native";
import axios from "axios";
import { router } from "expo-router";

export default function PastStudents() {
  const [pastStudents, setPastStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  const BACKEND = "http://10.69.232.21:5000"; // ✅ use your current backend IP

  // Get token stored after login
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;

  // Fetch past students
  const fetchPastStudents = async () => {
    try {
      const res = await axios.get(`${BACKEND}/api/students/past`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPastStudents(res.data);
    } catch (err) {
      console.error("Error fetching past students:", err);
      Alert.alert("Error", "Failed to fetch student history");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPastStudents();
  }, []);

  return (
    <ScrollView style={styles.page} contentContainerStyle={{ padding: 20 }}>
      <Text style={styles.title}>🎓 Student History</Text>

      {loading ? (
        <ActivityIndicator size="large" color="#0b5cff" />
      ) : pastStudents.length === 0 ? (
        <Text style={{ color: "#64748b", marginTop: 10 }}>
          No past students found.
        </Text>
      ) : (
        pastStudents.map((s) => (
          <View key={s.id} style={styles.card}>
            <Text style={styles.studentName}>{s.name}</Text>
            <Text style={styles.studentEmail}>{s.email}</Text>
            <Text style={styles.studentRole}>🎓 {s.role}</Text>
            <Text style={styles.date}>
              Left on: {new Date(s.left_on).toLocaleString()}
            </Text>
          </View>
        ))
      )}

      <TouchableOpacity
        style={styles.backBtn}
        onPress={() => router.push("/warden-dashboard")}
      >
        <Text style={styles.backBtnText}>← Back to Dashboard</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { backgroundColor: "#f8fafc", flex: 1 },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#0f172a",
    marginBottom: 16,
  },
  card: {
    backgroundColor: "#fff",
    padding: 14,
    borderRadius: 10,
    marginBottom: 12,
    shadowColor: "#00000011",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
  },
  studentName: { fontSize: 16, fontWeight: "700", color: "#0f172a" },
  studentEmail: { color: "#64748b", marginVertical: 2 },
  studentRole: { fontSize: 13, color: "#2563eb" },
  date: { fontSize: 12, color: "#64748b", marginTop: 4 },
  backBtn: {
    marginTop: 20,
    backgroundColor: "#0b5cff",
    padding: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  backBtnText: { color: "#fff", fontWeight: "700" },
});
