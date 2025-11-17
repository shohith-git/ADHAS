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

  // Fetch past students with complaints + remarks from backend
  const fetchPastStudents = async () => {
    try {
      const res = await axios.get(`${BACKEND}/api/students/past`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPastStudents(res.data || []);
    } catch (err) {
      console.error("Error fetching past students:", err);
      alert("Failed to fetch past students");
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
    <ScrollView contentContainerStyle={styles.page}>
      <Text style={styles.title}>🎓 Past Students</Text>

      {/* Grid */}
      <View style={styles.grid}>
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
              <Text style={styles.metaText}>
                🏢 Hostel ID: {s.hostel_id || "—"}
              </Text>
              <Text style={styles.email}>{s.email}</Text>
              <Text style={styles.role}>🎓 {s.dept_branch || s.role}</Text>
              <Text style={styles.date}>
                🕓{" "}
                {s.left_at
                  ? `Left on ${new Date(s.left_at).toLocaleDateString()}`
                  : "Left date unavailable"}
              </Text>
            </TouchableOpacity>
          ))
        )}
      </View>

      {/* ===================== MODAL ===================== */}
      {selectedStudent && (
        <Modal
          visible={true}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setSelectedStudent(null)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalBox}>
              <ScrollView showsVerticalScrollIndicator={false}>
                {/* NAME */}
                <Text style={styles.modalTitle}>{selectedStudent.name}</Text>

                {/* BASIC INFO */}
                <Text style={styles.modalMeta}>📧 {selectedStudent.email}</Text>
                <Text style={styles.modalMeta}>
                  🏢 Hostel: {selectedStudent.hostel_id || "—"}
                </Text>
                <Text style={styles.modalMeta}>
                  🧾 USN: {selectedStudent.usn || "—"}
                </Text>
                <Text style={styles.modalMeta}>
                  🎓 {selectedStudent.dept_branch || "—"} | Year:{" "}
                  {selectedStudent.year || "—"}
                </Text>
                <Text style={styles.modalMeta}>
                  🏠 Room: {selectedStudent.room_no || "N/A"}
                </Text>
                <Text style={styles.modalMeta}>
                  📱 {selectedStudent.phone_number || "—"}
                </Text>
                <Text style={styles.modalMeta}>
                  ⚧ {selectedStudent.gender || "—"}
                </Text>
                <Text style={styles.modalMeta}>
                  🎂{" "}
                  {selectedStudent.dob
                    ? new Date(selectedStudent.dob).toLocaleDateString()
                    : "—"}
                </Text>
                <Text style={styles.modalMeta}>
                  🏡 {selectedStudent.address || "—"}
                </Text>

                {/* PARENTS */}
                <Text style={styles.sectionHeader}>👨‍👩‍👧 Parents</Text>
                <Text style={styles.modalMeta}>
                  Father: {selectedStudent.father_name || "—"} (
                  {selectedStudent.father_number || "—"})
                </Text>
                <Text style={styles.modalMeta}>
                  Mother: {selectedStudent.mother_name || "—"} (
                  {selectedStudent.mother_number || "—"})
                </Text>

                {/* OVERALL REMARK SUMMARY */}
                <Text style={styles.sectionHeader}>
                  📝 Overall Remarks (Summary)
                </Text>
                <View style={styles.remarkBox}>
                  <Text style={styles.remarkText}>
                    {selectedStudent.all_remarks &&
                    selectedStudent.all_remarks.trim() !== ""
                      ? selectedStudent.all_remarks
                      : "No remarks recorded."}
                  </Text>
                </View>

                {/* INDIVIDUAL REMARK ITEMS */}
                <Text style={styles.sectionHeader}>
                  🗒️ Warden Remarks ({selectedStudent.remark_count || 0})
                </Text>

                {selectedStudent.student_remarks &&
                selectedStudent.student_remarks.length > 0 ? (
                  selectedStudent.student_remarks.map((r) => (
                    <View key={r.id} style={styles.remarkItem}>
                      <Text style={styles.remarkText}>• {r.remark}</Text>
                      <Text style={styles.remarkDate}>
                        {new Date(r.created_at).toLocaleDateString()}
                      </Text>
                    </View>
                  ))
                ) : (
                  <Text style={styles.modalMeta}>No remarks available.</Text>
                )}

                {/* COMPLAINT LIST */}
                <Text style={styles.sectionHeader}>
                  📢 Complaints ({selectedStudent.complaint_count || 0})
                </Text>

                {selectedStudent.complaints &&
                selectedStudent.complaints.length > 0 ? (
                  selectedStudent.complaints.map((c, index) => (
                    <View key={c.id} style={styles.complaintItem}>
                      <Text style={styles.complaintTitle}>
                        #{index + 1} {c.title}
                      </Text>
                      <Text style={styles.modalMeta}>{c.description}</Text>
                      <Text style={styles.modalMeta}>Status: {c.status}</Text>
                      <Text style={styles.remarkDate}>
                        Raised: {new Date(c.created_at).toLocaleDateString()}
                      </Text>
                    </View>
                  ))
                ) : (
                  <Text style={styles.modalMeta}>No complaints available.</Text>
                )}

                {/* JOINED / LEFT */}
                <Text style={styles.modalDate}>
                  🕒 Joined:{" "}
                  {selectedStudent.created_at
                    ? new Date(selectedStudent.created_at).toLocaleDateString()
                    : "—"}
                </Text>

                <Text style={styles.modalDate}>
                  🔄 Left:{" "}
                  {selectedStudent.left_at
                    ? new Date(selectedStudent.left_at).toLocaleDateString()
                    : "—"}
                </Text>
              </ScrollView>

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

      {/* Back Button */}
      <TouchableOpacity
        style={styles.backBtn}
        onPress={() => router.push("/warden-dashboard")}
      >
        <Text style={styles.backBtnText}>← Back to Dashboard</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

/* ===================== Styles ===================== */
const styles = StyleSheet.create({
  page: {
    backgroundColor: "#f9fafb",
    padding: 20,
    paddingBottom: 40,
  },

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
  metaText: { fontSize: 13, color: "#475569", marginTop: 2 },
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
    width: "88%",
    maxHeight: "85%",
    padding: 20,
    elevation: 8,
  },

  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#0f172a",
    marginBottom: 6,
  },

  modalMeta: { color: "#475569", fontSize: 14, marginVertical: 3 },
  modalDate: { color: "#334155", fontSize: 13, marginVertical: 5 },

  sectionHeader: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0b5cff",
    marginTop: 12,
    marginBottom: 4,
  },

  remarkBox: {
    backgroundColor: "#f8fafc",
    borderLeftWidth: 4,
    borderLeftColor: "#0b5cff",
    borderRadius: 6,
    padding: 10,
    marginTop: 6,
    marginBottom: 10,
  },

  remarkText: {
    color: "#0f172a",
    fontSize: 14,
    lineHeight: 20,
  },

  remarkItem: {
    marginBottom: 10,
    padding: 10,
    backgroundColor: "#f1f5f9",
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: "#0b5cff",
  },

  remarkDate: {
    fontSize: 11,
    color: "#64748b",
    marginTop: 3,
  },

  complaintItem: {
    marginBottom: 12,
    padding: 10,
    backgroundColor: "#eef2ff",
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: "#6366f1",
  },

  complaintTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1e293b",
    marginBottom: 4,
  },

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
