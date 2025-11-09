import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Alert,
} from "react-native";
import axios from "axios";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";

export default function StudentProfileList() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const { refresh } = useLocalSearchParams(); // 👈 triggers when returning from Add/Edit

  const BACKEND = "http://10.69.232.21:5000";
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;

  const router = useRouter();

  // ✅ Fetch all students
  const fetchStudents = async () => {
    try {
      const res = await axios.get(`${BACKEND}/api/students`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setStudents(res.data);
    } catch (err) {
      console.error("Error fetching students:", err.message);
    } finally {
      setLoading(false);
    }
  };

  // 🔁 Fetch when mounted or refresh flag changes
  useEffect(() => {
    fetchStudents(); // run once on mount
  }, []);

  useEffect(() => {
    const unsubscribe = router?.addListener?.("focus", fetchStudents);
    return unsubscribe;
  }, []);

  // 🎉 Show toast when refreshed (i.e. details were added/edited)
  useEffect(() => {
    if (refresh) {
      Alert.alert("✅ Updated", "Student profile saved successfully");
    }
  }, [refresh]);

  // 🧠 Split lists dynamically
  const newStudents = students.filter((s) => !s.dept_branch);
  const existingStudents = students.filter((s) => s.dept_branch);

  return (
    <ScrollView style={styles.page} contentContainerStyle={{ padding: 20 }}>
      <Text style={styles.title}>🎓 Student Profiles</Text>

      {loading ? (
        <ActivityIndicator size="large" color="#2563eb" />
      ) : (
        <>
          {/* 🆕 Fresh Students Section */}
          <Text style={styles.sectionTitle}>🆕 Fresh Students</Text>
          {newStudents.length === 0 ? (
            <Text style={styles.emptyText}>No fresh students found.</Text>
          ) : (
            newStudents.map((s) => (
              <View key={s.id} style={styles.card}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.name}>{s.name}</Text>
                  <Text style={styles.email}>{s.email}</Text>
                </View>
                <TouchableOpacity
                  style={[styles.btn, { backgroundColor: "#10b981" }]}
                  onPress={() =>
                    router.push({
                      pathname: `/warden/student-profile/add/${s.id}`,
                      params: { from: "fresh" },
                    })
                  }
                >
                  <Ionicons name="add-circle-outline" size={20} color="#fff" />
                  <Text style={styles.btnText}>Add Details</Text>
                </TouchableOpacity>
              </View>
            ))
          )}

          <View style={styles.divider} />

          {/* 👩‍🎓 Existing Students Section */}
          <Text style={styles.sectionTitle}>👩‍🎓 Existing Students</Text>
          {existingStudents.length === 0 ? (
            <Text style={styles.emptyText}>No existing student profiles.</Text>
          ) : (
            existingStudents.map((s) => (
              <View key={s.id} style={styles.card}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.name}>{s.name}</Text>
                  <Text style={styles.email}>{s.email}</Text>
                  <Text style={styles.dept}>{s.dept_branch}</Text>
                </View>
                <TouchableOpacity
                  style={[styles.btn, { backgroundColor: "#2563eb" }]}
                  onPress={() =>
                    router.push({
                      pathname: `/warden/student-profile/edit/${s.id}`,
                      params: { from: "existing" },
                    })
                  }
                >
                  <Ionicons name="create-outline" size={20} color="#fff" />
                  <Text style={styles.btnText}>Edit Profile</Text>
                </TouchableOpacity>
              </View>
            ))
          )}
        </>
      )}

      {/* Back button */}
      <TouchableOpacity
        style={styles.backBtn}
        onPress={() => router.push("/warden-dashboard")}
      >
        <Text style={styles.backText}>← Back to Dashboard</Text>
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
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#0f172a",
    marginBottom: 10,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    elevation: 2,
  },
  name: { fontSize: 16, fontWeight: "600", color: "#0f172a" },
  email: { color: "#475569", marginVertical: 2 },
  dept: { color: "#2563eb", fontWeight: "500" },
  btn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  btnText: { color: "#fff", fontWeight: "600" },
  divider: { height: 1, backgroundColor: "#e2e8f0", marginVertical: 15 },
  emptyText: { color: "#64748b", marginBottom: 10 },
  backBtn: {
    backgroundColor: "#0b5cff",
    padding: 12,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 15,
  },
  backText: { color: "#fff", fontWeight: "700" },
});
