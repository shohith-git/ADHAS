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
import { jwtDecode } from "jwt-decode";

export default function StudentComplaints() {
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(false);

  const BACKEND = "http://10.69.232.21:5000";

  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;

  let student_id = null;
  if (token) {
    try {
      const decoded = jwtDecode(token);
      student_id = decoded.id;
    } catch {
      console.log("Token decode error");
    }
  }

  // Fetch complaints
  const fetchComplaints = async () => {
    try {
      setLoading(true);
      const res = await axios.get(
        `${BACKEND}/api/complaints/student/${student_id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setComplaints(res.data || []);
    } catch (err) {
      console.log("❌ Fetch issue:", err.response?.data || err);
      Alert.alert("Error", "Could not load complaints.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, []);

  // Submit complaint
  const addComplaint = async () => {
    if (!title.trim() || !description.trim()) {
      Alert.alert("Missing Fields", "Please fill in all fields.");
      return;
    }

    try {
      setLoading(true);
      await axios.post(
        `${BACKEND}/api/complaints/`,
        { title, description },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setTitle("");
      setDescription("");
      fetchComplaints();
    } catch (err) {
      console.log("❌ Submit issue:", err.response?.data || err);
      Alert.alert("Error", "Could not submit complaint.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.page} contentContainerStyle={{ padding: 20 }}>
      <Text style={styles.header}>📝 Student Complaint Portal</Text>

      {/* ADD COMPLAINT FORM */}
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

      <Text style={styles.subHeader}>📋 Your Previous Complaints</Text>

      {/* LOADING */}
      {loading ? (
        <ActivityIndicator size="large" color="#007bff" />
      ) : complaints.length === 0 ? (
        <Text style={{ color: "#64748b" }}>No complaints found.</Text>
      ) : (
        <View style={styles.grid}>
          {complaints.map((c) => {
            const raised = new Date(c.created_at).toLocaleDateString("en-IN", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            });

            const updated = c.updated_at
              ? new Date(c.updated_at).toLocaleDateString("en-IN", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })
              : "—";

            return (
              <View key={c.id} style={styles.card}>
                <Text style={styles.cardTitle}>{c.title}</Text>
                <Text style={styles.cardDesc}>{c.description}</Text>

                <Text style={styles.dateText}>📅 Raised: {raised}</Text>
                <Text style={styles.dateText}>🕒 Updated: {updated}</Text>

                <View
                  style={[
                    styles.status,
                    c.status === "resolved"
                      ? styles.resolved
                      : c.status === "in-progress"
                      ? styles.progress
                      : styles.pending,
                  ]}
                >
                  <Text style={styles.statusText}>
                    {c.status.toUpperCase()}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>
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

/* ------------------------------ STYLES ------------------------------ */

const styles = StyleSheet.create({
  page: { backgroundColor: "#f8fafc", flex: 1 },

  header: {
    fontSize: 22,
    fontWeight: "700",
    color: "#0f172a",
    marginBottom: 16,
    textAlign: "center",
  },

  form: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 15,
    marginBottom: 20,
    shadowColor: "#0002",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 3 },
  },

  input: {
    borderWidth: 1,
    borderColor: "#ccd0d5",
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
    fontSize: 14,
  },

  textarea: { height: 100 },

  btn: {
    backgroundColor: "#0b5cff",
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
  },

  btnText: { color: "#fff", fontWeight: "700" },

  subHeader: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0f172a",
    marginBottom: 16,
  },

  /* GRID LAYOUT OF CARDS */
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },

  card: {
    width: "32%",
    backgroundColor: "#fff",
    padding: 14,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    shadowColor: "#0003",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 3 },
  },

  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1e293b",
    marginBottom: 6,
  },

  cardDesc: {
    fontSize: 13,
    color: "#475569",
    marginBottom: 8,
  },

  dateText: {
    fontSize: 12,
    color: "#64748b",
    marginBottom: 4,
  },

  status: {
    paddingVertical: 6,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 8,
  },

  statusText: {
    fontSize: 12.5,
    fontWeight: "700",
  },

  resolved: { backgroundColor: "#bbf7d0", color: "#065f46" },
  progress: { backgroundColor: "#dbeafe", color: "#1d4ed8" },
  pending: { backgroundColor: "#fef3c7", color: "#92400e" },

  backBtn: {
    backgroundColor: "#0b5cff",
    padding: 12,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 20,
    marginBottom: 30,
  },

  backBtnText: { color: "#fff", fontWeight: "700" },
});
