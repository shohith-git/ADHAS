import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  StyleSheet,
  Modal,
} from "react-native";
import axios from "axios";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

export default function PastStudents() {
  const [pastStudents, setPastStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState(null);

  const BACKEND = "http://10.69.232.21:5000";
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;

  const fetchPastStudents = async () => {
    try {
      const res = await axios.get(`${BACKEND}/api/students/past`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPastStudents(res.data || []);
    } catch (err) {
      console.error("Error fetching past students:", err.response?.data || err);
      alert("Failed to fetch student history");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPastStudents();
  }, []);

  if (loading)
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#0b5cff" />
        <Text style={{ marginTop: 10 }}>Loading past students...</Text>
      </View>
    );

  return (
    <View style={styles.page}>
      <Text style={styles.title}>🎓 Past Students</Text>

      <ScrollView contentContainerStyle={styles.grid}>
        {pastStudents.length === 0 ? (
          <Text style={{ color: "#64748b", marginTop: 10 }}>
            No past students found.
          </Text>
        ) : (
          pastStudents.map((s) => (
            <TouchableOpacity
              key={s.id}
              style={styles.card}
              activeOpacity={0.85}
              onPress={() => setSelectedStudent(s)}
            >
              <Text style={styles.name}>{s.name}</Text>
              <Text style={styles.email}>{s.email}</Text>
              <Text style={styles.role}>🎓 {s.role}</Text>
              <Text style={styles.date}>
                {s.left_at
                  ? `Left on: ${new Date(s.left_at).toLocaleDateString()}`
                  : "Left date unavailable"}
              </Text>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      {/* Modal */}
      {selectedStudent && (
        <Modal
          visible={true}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setSelectedStudent(null)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalBox}>
              <Text style={styles.modalTitle}>{selectedStudent.name}</Text>
              <Text style={styles.modalMeta}>📧 {selectedStudent.email}</Text>
              <Text style={styles.modalMeta}>
                🎓 Role: {selectedStudent.role}
              </Text>
              <Text style={styles.modalMeta}>
                🏫 Domain: {selectedStudent.college_domain || "—"}
              </Text>
              <Text style={styles.modalDate}>
                🕓{" "}
                {selectedStudent.left_at
                  ? `Left on ${new Date(
                      selectedStudent.left_at
                    ).toLocaleString()}`
                  : "No record of leaving date"}
              </Text>

              <TouchableOpacity
                style={styles.closeBtn}
                onPress={() => setSelectedStudent(null)}
              >
                <Ionicons name="close" size={20} color="#fff" />
                <Text style={styles.closeText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}

      <TouchableOpacity
        style={styles.backBtn}
        onPress={() => router.push("/warden-dashboard")}
      >
        <Text style={styles.backBtnText}>← Back to Dashboard</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { backgroundColor: "#f9fafb", flex: 1, padding: 20 },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#0b5cff",
    marginBottom: 15,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  card: {
    width: "31%",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    elevation: 3,
  },
  name: { fontSize: 16, fontWeight: "700", color: "#0f172a" },
  email: { color: "#475569", marginVertical: 2 },
  role: { fontSize: 13, color: "#2563eb", fontWeight: "600" },
  date: { fontSize: 12, color: "#64748b", marginTop: 4 },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalBox: {
    backgroundColor: "#fff",
    borderRadius: 12,
    width: "85%",
    padding: 20,
    elevation: 6,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0f172a",
    marginBottom: 8,
  },
  modalMeta: { color: "#475569", fontSize: 14, marginVertical: 3 },
  modalDate: { color: "#334155", fontSize: 13, marginVertical: 8 },
  closeBtn: {
    flexDirection: "row",
    backgroundColor: "#0b5cff",
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    marginTop: 15,
  },
  closeText: { color: "#fff", fontWeight: "700", marginLeft: 5 },
  backBtn: {
    marginTop: 20,
    backgroundColor: "#0b5cff",
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  backBtnText: { color: "#fff", fontWeight: "700" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
});
