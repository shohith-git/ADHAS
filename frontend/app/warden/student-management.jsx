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
  const [showPassword, setShowPassword] = useState(false); // 👁️ toggle
  const [submitting, setSubmitting] = useState(false);

  // 🌐 Backend URL
  const BACKEND = "http://10.69.232.21:5000";

  // 🔑 Auth token
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;

  // 📋 Fetch students list
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

  // 🧍‍♂️ Register new student
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

      Swal.fire("✅ Success", res.data.message, "success");
      setName("");
      setEmail("");
      setPassword("");
      fetchStudents();
    } catch (err) {
      console.error("Error registering student:", err);
      Swal.fire(
        "❌ Error",
        err.response?.data?.message || "Registration failed",
        "error"
      );
    } finally {
      setSubmitting(false);
    }
  };

  // 🗑️ Delete student → Move to past_students
  const deleteStudent = async (id, studentName) => {
    const confirm = await Swal.fire({
      title: "Are you sure?",
      text: `Remove ${studentName} from hostel and move to past list?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, remove",
      cancelButtonText: "Cancel",
    });

    if (!confirm.isConfirmed) return;

    try {
      const res = await axios.delete(`${BACKEND}/api/students/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.data.message.includes("moved to past student list")) {
        Swal.fire("✅ Success", `${studentName} moved to past list`, "success");
      } else {
        Swal.fire(
          "⚠️ Note",
          "Student deleted but not recorded in past list.",
          "info"
        );
      }

      setStudents((prev) => prev.filter((s) => s.id !== id));
    } catch (err) {
      console.error("Error deleting student:", err);
      Swal.fire(
        "❌ Error",
        err.response?.data?.message || "Failed to delete student",
        "error"
      );
    }
  };

  return (
    <ScrollView style={styles.page} contentContainerStyle={{ padding: 20 }}>
      <Text style={styles.title}>👨‍🎓 Student Management</Text>

      {/* ➕ Register New Student */}
      <View style={styles.form}>
        <Text style={styles.formTitle}>Register New Student</Text>

        <TextInput
          style={styles.input}
          placeholder="Student Name"
          value={name}
          onChangeText={setName}
        />

        <TextInput
          style={styles.input}
          placeholder="College Email (e.g. abc@cit_nc.edu.in)"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        {/* 👁️ Password Field with Eye Icon */}
        <View style={styles.passwordContainer}>
          <TextInput
            style={[styles.input, { flex: 1, borderWidth: 0 }]}
            placeholder="Password"
            secureTextEntry={!showPassword}
            value={password}
            onChangeText={setPassword}
          />
          <TouchableOpacity
            onPress={() => setShowPassword(!showPassword)}
            style={styles.eyeButton}
          >
            <Text style={{ fontSize: 18 }}>{showPassword ? "🙈" : "👁️"}</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[styles.button, submitting && { backgroundColor: "#94a3b8" }]}
          disabled={submitting}
          onPress={registerStudent}
        >
          <Text style={styles.buttonText}>
            {submitting ? "Registering..." : "Register Student"}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.divider} />

      {/* 📋 Registered Students */}
      <Text style={styles.subtitle}>📋 Registered Students</Text>

      {loading ? (
        <ActivityIndicator size="large" color="#0b5cff" />
      ) : students.length === 0 ? (
        <Text style={{ color: "#64748b", marginTop: 10 }}>
          No students found.
        </Text>
      ) : (
        students.map((s) => (
          <View key={s.id} style={styles.card}>
            <View style={{ flex: 1 }}>
              <Text style={styles.studentName}>{s.name}</Text>
              <Text style={styles.studentEmail}>{s.email}</Text>
              <Text style={styles.roleTag}>🎓 {s.role}</Text>
            </View>
            <TouchableOpacity
              style={styles.iconBtn}
              onPress={() => deleteStudent(s.id, s.name)}
            >
              <Trash2 size={20} color="#ef4444" />
            </TouchableOpacity>
          </View>
        ))
      )}

      {/* 🔗 View History */}
      <TouchableOpacity
        style={[styles.backBtn, { backgroundColor: "#1e40af", marginTop: 10 }]}
        onPress={() => router.push("/warden/past-students")}
      >
        <Text style={styles.backBtnText}>📜 View Student History</Text>
      </TouchableOpacity>

      {/* 🔙 Back */}
      <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
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
  form: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 10,
    marginBottom: 20,
    boxShadow: "0px 2px 5px #e2e8f0",
  },
  formTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#0f172a",
    marginBottom: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
  },
  passwordContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 8,
    marginBottom: 10,
    paddingRight: 10,
  },
  eyeButton: { paddingHorizontal: 8 },
  button: {
    backgroundColor: "#0b5cff",
    padding: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  buttonText: { color: "#fff", fontWeight: "700" },
  divider: { height: 1, backgroundColor: "#e2e8f0", marginVertical: 20 },
  subtitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#0f172a",
    marginBottom: 10,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 14,
    borderRadius: 10,
    marginBottom: 12,
    boxShadow: "0px 2px 5px #e2e8f0",
  },
  studentName: { fontSize: 16, fontWeight: "700", color: "#0f172a" },
  studentEmail: { color: "#64748b", marginVertical: 2 },
  roleTag: { fontSize: 13, color: "#2563eb" },
  iconBtn: {
    backgroundColor: "#fee2e2",
    padding: 8,
    borderRadius: 8,
    marginLeft: 10,
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
