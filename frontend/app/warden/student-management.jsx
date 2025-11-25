import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import axios from "axios";
import { router } from "expo-router";
import { Trash2 } from "lucide-react";
import Swal from "sweetalert2";

export default function WardenStudentManagement() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const BACKEND = "http://172.29.206.21:5000";
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;

  // 📋 Fetch Students List
  const fetchStudents = async () => {
    try {
      const res = await axios.get(`${BACKEND}/api/students`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setStudents(res.data);
    } catch (err) {
      console.error("Error fetching students:", err);
      Swal.fire("❌ Error", "Failed to load students list", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  // 🧍 Register New Student
  const registerStudent = async () => {
    if (!name || !email || !password)
      return Swal.fire("⚠️ Missing Info", "Please fill all fields", "warning");

    if (!email.endsWith("@cit_nc.edu.in"))
      return Swal.fire(
        "❌ Invalid Email",
        "Use only college email (e.g. name@cit_nc.edu.in)",
        "error"
      );

    try {
      setSubmitting(true);
      const res = await axios.post(
        `${BACKEND}/api/students/register`,
        { name, email, password },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      Swal.fire(
        "✅ Success",
        res.data.message || "Student registered",
        "success"
      );
      setName("");
      setEmail("");
      setPassword("");
      setShowPassword(false);
      fetchStudents();
    } catch (err) {
      console.error("Registration error:", err);
      Swal.fire(
        "❌ Error",
        err.response?.data?.message || "Registration failed",
        "error"
      );
    } finally {
      setSubmitting(false);
    }
  };

  // 🗑️ Delete Student → Move to past_students
  const deleteStudent = async (id, studentName) => {
    const confirmation = await Swal.fire({
      title: "Confirm Removal",
      text: `Remove ${studentName} and move to Past Students?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, remove",
      cancelButtonText: "Cancel",
    });

    if (!confirmation.isConfirmed) return;

    try {
      console.log("Deleting student with token:", token); // Debug

      const res = await axios.delete(`${BACKEND}/api/students/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      Swal.fire("✅ Removed", res.data.message, "success");

      setStudents((prev) => prev.filter((s) => s.id !== id));
    } catch (err) {
      console.error("Delete error:", err.response?.data || err);
      Swal.fire(
        "❌ Error",
        err.response?.data?.message || "Failed to delete student",
        "error"
      );
    }
  };

  // 🔙 Back to Dashboard
  const handleBack = () => router.push("/warden-dashboard");

  return (
    <ScrollView style={styles.page} contentContainerStyle={{ padding: 20 }}>
      <Text style={styles.pageTitle}>👨‍🎓 Student Management</Text>

      {/* 🔹 Register New Student (Card Style) */}
      <View style={[styles.cardContainer, styles.shadowCard]}>
        <Text style={styles.sectionTitle}>🆕 Register New Student</Text>

        <Text style={styles.label}>Full Name:</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter student name"
          value={name}
          onChangeText={setName}
        />

        <Text style={styles.label}>College Email:</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. abc@cit_nc.edu.in"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />

        <Text style={styles.label}>Password:</Text>
        <View style={styles.passwordContainer}>
          <TextInput
            style={[styles.input, { flex: 1, borderWidth: 0 }]}
            placeholder="Enter password"
            secureTextEntry={!showPassword}
            value={password}
            onChangeText={setPassword}
          />
          <TouchableOpacity
            onPress={() => setShowPassword((s) => !s)}
            style={styles.eyeButton}
          >
            <Text style={{ fontSize: 18 }}>{showPassword ? "🙈" : "👁️"}</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[styles.buttonGradient, submitting && { opacity: 0.7 }]}
          disabled={submitting}
          onPress={registerStudent}
        >
          <Text style={styles.buttonText}>
            {submitting ? "Registering..." : "Register Student"}
          </Text>
        </TouchableOpacity>
      </View>

      {/* 📋 Registered Students */}
      <Text style={styles.sectionTitle}>📋 Registered Students</Text>

      {loading ? (
        <ActivityIndicator size="large" color="#2563eb" />
      ) : students.length === 0 ? (
        <Text style={styles.noData}>No students found.</Text>
      ) : (
        <View style={styles.grid}>
          {students.map((s) => (
            <View key={s.id} style={[styles.studentCard, styles.shadowCard]}>
              <View style={{ flex: 1 }}>
                <Text style={styles.studentName}>{s.name}</Text>
                <Text style={styles.studentEmail}>{s.email}</Text>
                <Text style={styles.roleTag}>🎓 {s.role}</Text>
              </View>
              <TouchableOpacity
                style={styles.deleteBtn}
                onPress={() => deleteStudent(s.id, s.name)}
              >
                <Trash2 size={18} color="#fff" />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}

      {/* 🔗 View History */}
      <TouchableOpacity
        style={[styles.secondaryBtn, { backgroundColor: "#1e40af" }]}
        onPress={() => router.push("/warden/past-students")}
      >
        <Text style={styles.secondaryBtnText}>📜 View Student History</Text>
      </TouchableOpacity>

      {/* 🔙 Back to Dashboard */}
      <TouchableOpacity style={styles.backBtn} onPress={handleBack}>
        <Text style={styles.backBtnText}>← Back to Dashboard</Text>
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

  cardContainer: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 18,
    marginBottom: 24,
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

  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1e293b",
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
    paddingBottom: 6,
  },

  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#475569",
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
    backgroundColor: "#f9fafb",
  },
  passwordContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 10,
    marginBottom: 10,
    paddingRight: 10,
    backgroundColor: "#fff",
  },
  eyeButton: { paddingHorizontal: 8 },

  buttonGradient: {
    backgroundColor: "#2563eb",
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#1e40af",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 2,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 15,
    letterSpacing: 0.3,
  },

  /* Grid */
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  studentCard: {
    width: "48%",
    borderRadius: 12,
    padding: 14,
    backgroundColor: "#e0f2fe",
    marginBottom: 14,
    flexDirection: "row",
    alignItems: "center",
  },
  studentName: { fontSize: 16, fontWeight: "700", color: "#0f172a" },
  studentEmail: { color: "#64748b", marginVertical: 2 },
  roleTag: { fontSize: 13, color: "#2563eb" },

  deleteBtn: {
    backgroundColor: "#ef4444",
    padding: 8,
    borderRadius: 8,
    marginLeft: 10,
  },

  secondaryBtn: {
    marginTop: 20,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  secondaryBtnText: { color: "#fff", fontWeight: "700", fontSize: 15 },

  backBtn: {
    marginTop: 25,
    backgroundColor: "#0b5cff",
    padding: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  backBtnText: { color: "#fff", fontWeight: "700", fontSize: 15 },

  noData: { color: "#64748b", textAlign: "center", marginVertical: 10 },
});
