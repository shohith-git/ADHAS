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

  const BACKEND = "http://10.49.102.21:5000";
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;

  let student_id = null;
  if (token) {
    try {
      student_id = jwtDecode(token)?.id;
    } catch {}
  }

  /* ---------------- FETCH COMPLAINTS ---------------- */
  const fetchComplaints = async () => {
    try {
      setLoading(true);
      const res = await axios.get(
        `${BACKEND}/api/complaints/student/${student_id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setComplaints(res.data || []);
    } catch (err) {
      Alert.alert("Error", "Unable to load complaints.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, []);

  /* ---------------- SUBMIT COMPLAINT ---------------- */
  const addComplaint = async () => {
    if (!title.trim() || !description.trim()) {
      Alert.alert("Missing Fields", "Please fill all fields.");
      return;
    }

    try {
      setLoading(true);

      await axios.post(
        `${BACKEND}/api/complaints/`,
        { title, description },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setTitle("");
      setDescription("");
      fetchComplaints();
    } catch (err) {
      Alert.alert("Error", "Could not submit complaint.");
    } finally {
      setLoading(false);
    }
  };

  /* ------------------ UI ------------------ */
  return (
    <ScrollView style={styles.page} contentContainerStyle={{ padding: 20 }}>
      <Text style={styles.header}>📝 Student Complaint Portal</Text>

      {/* ------------------- FORM -------------------- */}
      <View style={styles.form}>
        <Text style={styles.sectionLabel}>Raise a New Complaint</Text>

        <TextInput
          style={styles.input}
          placeholder="Complaint Title"
          placeholderTextColor="#94a3b8"
          value={title}
          onChangeText={setTitle}
        />

        <TextInput
          style={[styles.input, styles.textarea]}
          placeholder="Describe your complaint in detail"
          placeholderTextColor="#94a3b8"
          value={description}
          multiline
          onChangeText={setDescription}
        />

        <TouchableOpacity style={styles.submitBtn} onPress={addComplaint}>
          <Text style={styles.submitText}>Submit Complaint</Text>
        </TouchableOpacity>
      </View>

      {/* ------------------- HISTORY -------------------- */}
      <Text style={styles.subHeader}>📋 Your Complaints</Text>

      {loading ? (
        <ActivityIndicator size="large" color="#2563eb" />
      ) : complaints.length === 0 ? (
        <Text style={styles.emptyText}>No complaints filed yet.</Text>
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

                <View style={styles.row}>
                  <Text style={styles.date}>📅 Raised: {raised}</Text>
                </View>

                <View style={styles.row}>
                  <Text style={styles.date}>🕒 Updated: {updated}</Text>
                </View>

                {/* STATUS BADGE */}
                <View
                  style={[
                    styles.statusBox,
                    c.status === "resolved"
                      ? styles.resolved
                      : c.status === "in-progress"
                      ? styles.inProgress
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

      {/* BACK BUTTON */}
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
  page: {
    flex: 1,
    backgroundColor: "#eef4ff",
  },

  header: {
    fontSize: 24,
    fontWeight: "800",
    color: "#0f172a",
    marginBottom: 18,
    textAlign: "center",
  },

  /* ---------- FORM ---------- */
  form: {
    backgroundColor: "#ffffff",
    padding: 18,
    borderRadius: 14,
    marginBottom: 25,
    elevation: 3,
  },

  sectionLabel: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1e293b",
    marginBottom: 10,
  },

  input: {
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    color: "#0f172a",
    marginBottom: 12,
  },

  textarea: {
    height: 110,
    textAlignVertical: "top",
  },

  submitBtn: {
    backgroundColor: "#2563eb",
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 5,
  },

  submitText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 15,
  },

  /* ---------- HISTORY SECTION ---------- */
  subHeader: {
    fontSize: 19,
    fontWeight: "700",
    color: "#0f172a",
    marginBottom: 16,
  },

  emptyText: {
    color: "#64748b",
    fontStyle: "italic",
    marginBottom: 10,
  },

  /* GRID */
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },

  /* COMPLAINT CARD */
  card: {
    width: "32%",
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 14,
    marginBottom: 18,
    elevation: 3,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },

  cardTitle: {
    fontSize: 15.5,
    fontWeight: "700",
    color: "#1e293b",
    marginBottom: 6,
  },

  cardDesc: {
    fontSize: 13.5,
    color: "#475569",
    marginBottom: 10,
  },

  row: {
    marginBottom: 4,
  },

  date: {
    fontSize: 12,
    color: "#64748b",
  },

  /* STATUS BADGES */
  statusBox: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 8,
    alignSelf: "flex-start",
  },

  statusText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#fff",
  },

  resolved: {
    backgroundColor: "#16a34a",
  },

  inProgress: {
    backgroundColor: "#3b82f6",
  },

  pending: {
    backgroundColor: "#f59e0b",
  },

  /* BUTTON */
  backBtn: {
    backgroundColor: "#0b5cff",
    padding: 12,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 25,
    marginBottom: 40,
  },

  backBtnText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 15,
  },
});
