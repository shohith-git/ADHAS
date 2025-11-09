import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Alert,
  TextInput,
} from "react-native";
import axios from "axios";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";

export default function StudentProfileList() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const { refresh } = useLocalSearchParams();

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

  useEffect(() => {
    fetchStudents();
  }, []);

  useEffect(() => {
    const unsubscribe = router?.addListener?.("focus", fetchStudents);
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (refresh) {
      Alert.alert("✅ Updated", "Student profile saved successfully");
    }
  }, [refresh]);

  // 🔍 Filter students based on search
  const filteredStudents = students.filter((s) => {
    const q = searchQuery.toLowerCase();
    return (
      s.name?.toLowerCase().includes(q) ||
      s.usn?.toLowerCase().includes(q) ||
      s.room_no?.toLowerCase().includes(q)
    );
  });

  // 🧠 Split lists dynamically
  const newStudents = filteredStudents.filter((s) => !s.dept_branch);
  const existingStudents = filteredStudents.filter((s) => s.dept_branch);

  return (
    <ScrollView style={styles.page} contentContainerStyle={{ padding: 20 }}>
      <Text style={styles.pageTitle}>🎓 Student Profiles</Text>

      {/* 🔍 Search Bar */}
      <View style={[styles.searchContainer, styles.shadowCard]}>
        <Ionicons name="search-outline" size={20} color="#475569" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by Name, USN, or Room Number..."
          placeholderTextColor="#94a3b8"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery("")}>
            <Ionicons name="close-circle" size={20} color="#64748b" />
          </TouchableOpacity>
        )}
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#2563eb" />
          <Text style={styles.loadingText}>Loading profiles...</Text>
        </View>
      ) : (
        <>
          {/* 🆕 Fresh Students */}
          <View style={[styles.sectionCard, styles.shadowCard]}>
            <Text style={styles.sectionHeader}>🆕 Fresh Students</Text>
            {newStudents.length === 0 ? (
              <Text style={styles.emptyText}>No fresh students found.</Text>
            ) : (
              newStudents.map((s) => (
                <View key={s.id} style={styles.studentCard}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.name}>{s.name}</Text>
                    <Text style={styles.email}>{s.email}</Text>
                    {s.usn && <Text style={styles.metaText}>USN: {s.usn}</Text>}
                  </View>
                  <TouchableOpacity
                    style={[styles.actionBtn, styles.greenBtn]}
                    onPress={() =>
                      router.push({
                        pathname: `/warden/student-profile/add/${s.id}`,
                        params: { from: "fresh" },
                      })
                    }
                  >
                    <Ionicons
                      name="add-circle-outline"
                      size={20}
                      color="#fff"
                    />
                    <Text style={styles.btnText}>Add Details</Text>
                  </TouchableOpacity>
                </View>
              ))
            )}
          </View>

          {/* 👩‍🎓 Existing Students */}
          <View style={[styles.sectionCard, styles.shadowCard]}>
            <Text style={styles.sectionHeader}>👩‍🎓 Existing Students</Text>
            {existingStudents.length === 0 ? (
              <Text style={styles.emptyText}>
                No existing student profiles found.
              </Text>
            ) : (
              existingStudents.map((s) => (
                <View key={s.id} style={styles.studentCard}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.name}>{s.name}</Text>
                    <Text style={styles.email}>{s.email}</Text>
                    {s.dept_branch && (
                      <Text style={styles.metaText}>
                        {s.dept_branch} • Room: {s.room_no || "N/A"}
                      </Text>
                    )}
                  </View>
                  <TouchableOpacity
                    style={[styles.actionBtn, styles.blueBtn]}
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
          </View>
        </>
      )}

      {/* 🔙 Back Button */}
      <TouchableOpacity
        style={styles.backBtn}
        onPress={() => router.push("/warden-dashboard")}
      >
        <Text style={styles.backText}>← Back to Dashboard</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

/* ------------------------------ STYLES ------------------------------ */
const styles = StyleSheet.create({
  page: { backgroundColor: "#f8fafc", flex: 1 },
  pageTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#0b5cff",
    marginBottom: 20,
  },
  centered: { alignItems: "center", marginVertical: 40 },
  loadingText: { marginTop: 8, color: "#64748b", fontSize: 14 },

  /* 🔍 Search Bar */
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: "#0f172a",
    marginLeft: 8,
  },

  /* 🌟 Section Containers */
  sectionCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 18,
    marginBottom: 20,
  },
  shadowCard: {
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1e293b",
    marginBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
    paddingBottom: 6,
  },

  /* 👩‍🎓 Student Cards */
  studentCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f1f5f9",
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  name: { fontSize: 16, fontWeight: "600", color: "#0f172a" },
  email: { color: "#475569", marginVertical: 2 },
  metaText: { color: "#334155", fontSize: 13, fontWeight: "500" },

  /* 🎯 Buttons */
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    minWidth: 120,
    shadowColor: "#1e40af",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  btnText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 13,
  },
  blueBtn: { backgroundColor: "#2563eb" },
  greenBtn: { backgroundColor: "#10b981" },

  /* Empty Text */
  emptyText: {
    color: "#64748b",
    fontSize: 14,
    textAlign: "center",
    marginVertical: 8,
  },

  /* 🔙 Back Button */
  backBtn: {
    marginTop: 25,
    backgroundColor: "#0b5cff",
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
    elevation: 3,
  },
  backText: { color: "#fff", fontWeight: "700", fontSize: 15 },
});
