// adhas/frontend/app/student/complaints.jsx

import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native";
import axios from "axios";
import { useRouter } from "expo-router";

export default function StudentComplaints() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(false);

  const BACKEND = "http://10.69.232.21:5000";

  // ⚠️ Replace this with logged-in student's ID from AsyncStorage later
  const student_id = 3;

  // 🟢 Fetch student's complaints
  const fetchComplaints = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${BACKEND}/api/complaints/${student_id}`);
      setComplaints(res.data);
    } catch (err) {
      console.error("❌ Error fetching complaints:", err);
      Alert.alert("Error", "Failed to load your complaints");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, []);

  // 🟠 Submit complaint
  const addComplaint = async () => {
    if (!title || !description) {
      Alert.alert("Missing Fields", "Please fill in all fields");
      return;
    }

    try {
      setLoading(true);
      const res = await axios.post(`${BACKEND}/api/complaints/add`, {
        user_id: student_id,
        title,
        description,
      });
      Alert.alert("✅ Success", "Complaint submitted successfully!");
      setTitle("");
      setDescription("");
      fetchComplaints();
    } catch (err) {
      console.error("❌ Error submitting complaint:", err);
      Alert.alert("Error", "Failed to submit complaint");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.page} contentContainerStyle={{ padding: 20 }}>
      <Text style={styles.header}>📝 Student Complaint Portal</Text>

      {/* Add Complaint Form */}
      <View style={styles.form}>
        <TextInput
          style={styles.input}
          placeholder="Enter complaint title"
          value={title}
          onChangeText={setTitle}
        />
        <TextInput
          style={[styles.input, styles.textarea]}
          placeholder="Enter detailed description"
          value={description}
          multiline
          numberOfLines={4}
          onChangeText={setDescription}
        />
        <TouchableOpacity style={styles.btn} onPress={addComplaint}>
          <Text style={styles.btnText}>Submit Complaint</Text>
        </TouchableOpacity>
      </View>

      {/* Complaint List */}
      <Text style={styles.subHeader}>📋 Your Previous Complaints</Text>

      {loading ? (
        <ActivityIndicator size="large" color="#007bff" />
      ) : complaints.length === 0 ? (
        <Text style={{ color: "#64748b" }}>No complaints found.</Text>
      ) : (
        complaints.map((c) => (
          <View key={c.id} style={styles.card}>
            <Text style={styles.cardTitle}>{c.title}</Text>
            <Text style={styles.desc}>{c.description}</Text>
            <Text
              style={[
                styles.status,
                c.status === "Resolved"
                  ? styles.resolved
                  : c.status === "In Progress"
                  ? styles.progress
                  : styles.pending,
              ]}
            >
              {c.status.toUpperCase()}
            </Text>
          </View>
        ))
      )}

      <TouchableOpacity
        style={styles.backBtn}
        onPress={() => router.push("/student-dashboard")}
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
  textarea: { height: 100, textAlignVertical: "top" },
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
  desc: { color: "#475569", fontSize: 13, marginTop: 4 },
  status: {
    marginTop: 8,
    paddingVertical: 4,
    borderRadius: 6,
    fontWeight: "600",
    textAlign: "center",
  },
  pending: { backgroundColor: "#fef3c7", color: "#92400e" },
  progress: { backgroundColor: "#dbeafe", color: "#1d4ed8" },
  resolved: { backgroundColor: "#bbf7d0", color: "#065f46" },
  backBtn: {
    marginTop: 20,
    backgroundColor: "#0b5cff",
    padding: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  backBtnText: { color: "#fff", fontWeight: "700" },
});
