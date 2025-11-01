import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import axios from "axios";
import { router } from "expo-router";
import { Trash2, History } from "lucide-react";
import Swal from "sweetalert2";

export default function WardenStudents() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const BACKEND = "http://10.69.232.21:5000";

  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;

  // 🧾 Fetch all students
  const fetchStudents = async () => {
    try {
      const res = await axios.get(`${BACKEND}/api/students`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setStudents(res.data);
    } catch (err) {
      console.error("Error fetching students:", err);
      Alert.alert("❌ Error", "Failed to load students list");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  // 👨‍🎓 Register new student
  const registerStudent = async () => {
    if (!name || !email || !password)
      return Alert.alert("⚠️ Missing Info", "Please fill all fields");

    if (!email.endsWith("@cit_nc.edu.in"))
      return Alert.alert("❌ Invalid Email", "Use college email only");

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

  // 🗑️ Delete student
  const deleteStudent = async (id, name) => {
    const confirm = await Swal.fire({
      title: "Are you sure?",
      text: `Remove ${name} from hostel and move to past list?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, remove",
      cancelButtonText: "Cancel",
    });

    if (!confirm.isConfirmed) return;

    try {
      await axios.delete(`${BACKEND}/api/students/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      Swal.fire("✅ Removed", `${name} moved to past list`, "success");
      setStudents((prev) => prev.filter((s) => s.id !== id));
    } catch (err) {
      console.error("Error deleting student:", err);
      Swal.fire("❌ Error", "Failed to delete student", "error");
    }
  };

  return (
    <ScrollView style={styles.page} contentContainerStyle={{ padding: 20 }}>
      <Text style={styles.title}>👨‍🎓 Student Management</Text>

      {/* Register Form */}
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
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

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

      {/* Student List */}
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

      {/* Past Students Button */}
      <TouchableOpacity
        style={[styles.backBtn, { backgroundColor: "#1e40af", marginTop: 10 }]}
        onPress={() => router.push("/warden/past-students")}
      >
        <Text style={styles.backBtnText}>📜 View Student History</Text>
      </TouchableOpacity>

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
  historyBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#2563eb",
    padding: 12,
    borderRadius: 10,
    marginTop: 20,
  },
  historyBtnText: {
    color: "#fff",
    fontWeight: "700",
    marginLeft: 6,
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
