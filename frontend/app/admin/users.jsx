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

export default function AdminUsers() {
  const router = useRouter();
  const [activeUsers, setActiveUsers] = useState([]);
  const [deletedStudents, setDeletedStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showDeleted, setShowDeleted] = useState(false);

  const BACKEND = "http://10.49.102.21:5000";

  // Fetch active users
  const fetchActiveUsers = async () => {
    try {
      const res = await axios.get(`${BACKEND}/api/admin/users`);
      setActiveUsers(res.data);
    } catch (err) {
      console.error("❌ Error fetching active users:", err.message);
      Alert.alert("Error", "Failed to load active users");
    }
  };

  // Fetch deleted students
  const fetchDeletedStudents = async () => {
    try {
      const res = await axios.get(`${BACKEND}/api/admin/deleted-students`);
      setDeletedStudents(res.data);
    } catch (err) {
      console.error("❌ Error fetching deleted students:", err.message);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        await Promise.all([fetchActiveUsers(), fetchDeletedStudents()]);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const users = showDeleted ? deletedStudents : activeUsers;

  // Split by role for active users
  const wardens = !showDeleted ? users.filter((u) => u.role === "warden") : [];
  const students = showDeleted
    ? users
    : users.filter((u) => u.role === "student");

  return (
    <ScrollView style={styles.page} contentContainerStyle={{ padding: 20 }}>
      <Text style={styles.header}>👥 Manage Wardens & Students</Text>

      {/* Toggle Buttons */}
      <View style={styles.toggleContainer}>
        <TouchableOpacity
          style={[styles.toggleBtn, !showDeleted && styles.activeToggle]}
          onPress={() => setShowDeleted(false)}
        >
          <Text
            style={[styles.toggleText, !showDeleted && styles.activeToggleText]}
          >
            Active
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.toggleBtn, showDeleted && styles.activeToggle]}
          onPress={() => setShowDeleted(true)}
        >
          <Text
            style={[styles.toggleText, showDeleted && styles.activeToggleText]}
          >
            Deleted
          </Text>
        </TouchableOpacity>
      </View>

      {/* Data Display */}
      {loading ? (
        <ActivityIndicator size="large" color="#0b5cff" />
      ) : users.length === 0 ? (
        <Text style={{ textAlign: "center", color: "#64748b" }}>
          No {showDeleted ? "deleted" : "active"} records found.
        </Text>
      ) : (
        <>
          {/* 🟣 WARDENS SECTION */}
          {!showDeleted && wardens.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>👨‍🏫 Wardens</Text>
              {wardens.map((user) => (
                <View key={user.id} style={styles.card}>
                  <Text style={styles.name}>{user.name}</Text>
                  <Text style={styles.email}>{user.email}</Text>
                  <Text style={[styles.role, styles.warden]}>WARDEN</Text>
                </View>
              ))}
            </>
          )}

          {/* 🟠 STUDENTS SECTION */}
          {!showDeleted && students.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>🎓 Students</Text>
              {students.map((user) => (
                <View key={user.id} style={styles.card}>
                  <Text style={styles.name}>{user.name}</Text>
                  <Text style={styles.email}>{user.email}</Text>
                  <Text style={[styles.role, styles.student]}>STUDENT</Text>
                </View>
              ))}
            </>
          )}

          {/* 🔴 DELETED STUDENTS SECTION */}
          {showDeleted && (
            <>
              <Text style={styles.sectionTitle}>🗑️ Deleted Students</Text>
              {students.map((user) => (
                <View key={user.id} style={styles.card}>
                  <Text style={styles.name}>{user.name}</Text>
                  <Text style={styles.email}>{user.email}</Text>
                  <Text style={[styles.role, styles.student]}>STUDENT</Text>
                  <Text style={styles.deletedLabel}>
                    Left on:{" "}
                    {user.left_at
                      ? new Date(user.left_at).toLocaleDateString("en-IN", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })
                      : "Unknown Date"}
                  </Text>
                </View>
              ))}
            </>
          )}
        </>
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0f172a",
    marginTop: 10,
    marginBottom: 6,
  },
  toggleContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 15,
  },
  toggleBtn: {
    paddingVertical: 8,
    paddingHorizontal: 20,
    marginHorizontal: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#0b5cff",
  },
  toggleText: { color: "#0b5cff", fontWeight: "600" },
  activeToggle: { backgroundColor: "#0b5cff" },
  activeToggleText: { color: "#fff" },
  card: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 14,
    marginBottom: 12,
    boxShadow: "0 2px 3px rgba(0,0,0,0.08)",
  },
  name: { fontSize: 16, fontWeight: "700", color: "#0f172a" },
  email: { fontSize: 13, color: "#475569" },
  role: {
    marginTop: 5,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 6,
    fontWeight: "600",
    textAlign: "center",
    alignSelf: "flex-start",
  },
  student: { backgroundColor: "#dbeafe", color: "#1e3a8a" },
  warden: { backgroundColor: "#fef3c7", color: "#92400e" },
  admin: { backgroundColor: "#bbf7d0", color: "#166534" },
  deletedLabel: {
    fontSize: 12,
    color: "#dc2626",
    marginTop: 5,
    fontStyle: "italic",
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
