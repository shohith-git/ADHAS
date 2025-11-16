// frontend/app/student/profile.jsx

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

/* ------------------------------
   MAIN COMPONENT
--------------------------------*/
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
    if (typeof window !== "undefined") window.location.href = "/login";
  };

  const fetchProfile = async () => {
    if (!studentId || !token) {
      Alert.alert("Error", "Your session expired. Please login again.", [
        { text: "OK", onPress: redirectToLogin },
      ]);
      setLoading(false);
      return;
    }

    try {
      const res = await axios.get(`${BACKEND}/api/students/${studentId}`, {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 10000,
      });

      setStudent(res.data);
    } catch (err) {
      Alert.alert("Error", "Unable to load profile. Try again later.");
      console.log("Profile error:", err.message || err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={{ marginTop: 10 }}>Loading Profile...</Text>
      </View>
    );
  }

  if (!student) {
    return (
      <View style={styles.centered}>
        <Text>No profile found.</Text>

        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.push("/student-dashboard")}
        >
          <Text style={styles.backBtnText}>Back to Dashboard</Text>
        </TouchableOpacity>
      </View>
    );
  }

  /* ------------------------------
     MAIN UI
  --------------------------------*/
  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.container}>
      {/* HEADER BLOCK */}
      <View style={styles.profileHeader}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {student.name?.charAt(0)?.toUpperCase()}
          </Text>
        </View>

        <Text style={styles.name}>{student.name}</Text>
        <Text style={styles.email}>{student.email}</Text>
      </View>

      {/* MAIN CARD */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Profile Information</Text>

        <Row label="Department" value={student.dept_branch} />
        <Row label="Year" value={student.year} />
        <Row label="Batch" value={student.batch} />
        <Row label="Room Number" value={student.room_no} />
        <Row label="Gender" value={student.gender} />
        <Row label="Date of Birth" value={student.dob?.split("T")[0]} />
        <Row label="Phone" value={student.phone_number} />
        <Row label="Address" value={student.address} />
      </View>

      {/* PARENT DETAILS */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Parent Details</Text>

        <Row label="Father Name" value={student.father_name} />
        <Row label="Father Number" value={student.father_number} />
        <Row label="Mother Name" value={student.mother_name} />
        <Row label="Mother Number" value={student.mother_number} />
      </View>

      {/* BUTTON */}
      <TouchableOpacity
        style={styles.backBtn}
        onPress={() => router.push("/student-dashboard")}
      >
        <Text style={styles.backBtnText}>Back to Dashboard</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

/* ------------------------------
   REUSABLE ROW COMPONENT
--------------------------------*/
const Row = ({ label, value }) => (
  <View style={styles.row}>
    <Text style={styles.label}>{label}</Text>
    <Text style={styles.value}>{value || "—"}</Text>
  </View>
);

/* ------------------------------
   PROFESSIONAL STYLES
--------------------------------*/
const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: "#f1f5f9",
  },

  container: {
    padding: 18,
    paddingBottom: 40,
  },

  /* HEADER */
  profileHeader: {
    alignItems: "center",
    marginBottom: 25,
    paddingVertical: 25,
    backgroundColor: "#fff",
    borderRadius: 15,
    elevation: 3,
  },

  avatar: {
    width: 85,
    height: 85,
    borderRadius: 42.5,
    backgroundColor: "#2563eb22",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },

  avatarText: {
    fontSize: 36,
    fontWeight: "800",
    color: "#2563eb",
  },

  name: {
    fontSize: 22,
    fontWeight: "700",
    color: "#0f172a",
  },

  email: {
    fontSize: 14,
    color: "#475569",
    marginTop: 5,
  },

  /* CARD */
  card: {
    backgroundColor: "#fff",
    padding: 18,
    borderRadius: 14,
    marginBottom: 20,
    elevation: 2,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1e293b",
    marginBottom: 12,
  },

  row: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },

  label: {
    fontSize: 14,
    color: "#64748b",
    marginBottom: 2,
  },

  value: {
    fontSize: 16,
    fontWeight: "600",
    color: "#0f172a",
  },

  /* GENERAL */
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  /* BUTTON */
  backBtn: {
    marginTop: 10,
    backgroundColor: "#2563eb",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },

  backBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
});
