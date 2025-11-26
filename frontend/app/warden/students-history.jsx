// frontend/app/warden/past-students.jsx
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

export default function StudentsHistory() {
  const [pastStudents, setStudentsHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  const [selectedStudent, setSelectedStudent] = useState(null);
  const [remarks, setRemarks] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [detailsLoading, setDetailsLoading] = useState(false);

  const BACKEND = "http://10.49.102.21:5000";
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;

  /* ================================================
     FETCH ALL STUDENTS HISTORY
  ================================================= */
  const fetchStudentsHistory = async () => {
    try {
      const res = await axios.get(`${BACKEND}/api/students/history`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setStudentsHistory(res.data || []);
    } catch (err) {
      console.error("❌ Error fetching students history:", err);
      alert("Failed to fetch students history");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudentsHistory();
  }, []);

  /* ================================================
     OPEN MODAL — LOAD REMARKS & COMPLAINTS PROPERLY
     Priority:
     1. Use stored JSON (remarks, complaints)
     2. Else fallback to API (active student case)
  ================================================= */
  const openStudentModal = async (student) => {
    setSelectedStudent(student);
    setDetailsLoading(true);

    const idForFetch = student.user_id ?? student.id;

    // ------------ REMARKS ------------
    if (student.remarks && Array.isArray(student.remarks)) {
      setRemarks(student.remarks);
    } else {
      try {
        const remRes = await axios.get(`${BACKEND}/api/remarks/${idForFetch}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setRemarks(remRes.data || []);
      } catch {
        setRemarks([]);
      }
    }

    // ------------ COMPLAINTS ------------
    if (student.complaints && Array.isArray(student.complaints)) {
      setComplaints(student.complaints);
    } else {
      try {
        const compRes = await axios.get(
          `${BACKEND}/api/complaints/student/${idForFetch}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setComplaints(compRes.data || []);
      } catch {
        setComplaints([]);
      }
    }

    setDetailsLoading(false);
  };

  const fmtDate = (d) => {
    try {
      return d ? new Date(d).toLocaleDateString("en-IN") : "—";
    } catch {
      return "—";
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#0b5cff" />
        <Text style={{ marginTop: 10 }}>Loading Students History...</Text>
      </View>
    );
  }

  return (
    <View style={styles.page}>
      <Text style={styles.title}>🎓 Students History</Text>

      <ScrollView contentContainerStyle={styles.grid}>
        {pastStudents.length === 0 ? (
          <Text style={styles.emptyText}>No Students History found.</Text>
        ) : (
          pastStudents.map((s) => (
            <TouchableOpacity
              key={s.id}
              style={styles.card}
              activeOpacity={0.85}
              onPress={() => openStudentModal(s)}
            >
              <Text style={styles.name}>{s.name}</Text>
              <Text style={styles.metaText}>
                🏢 Hostel ID: {s.hostel_id || "—"}
              </Text>
              <Text style={styles.email}>{s.email || "—"}</Text>
              <Text style={styles.role}>
                🎓 {s.dept_branch || s.role || "—"} • {s.year || "—"}
              </Text>
              <Text style={styles.date}>Left: {fmtDate(s.left_at)}</Text>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      {/* ====================== MODAL ====================== */}
      {selectedStudent && (
        <Modal
          visible={true}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setSelectedStudent(null)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalBox}>
              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 14 }}
              >
                <View style={styles.headerRow}>
                  <View>
                    <Text style={styles.modalTitle}>
                      {selectedStudent.name}
                    </Text>
                    <Text style={styles.subTitle}>{selectedStudent.email}</Text>
                  </View>
                </View>

                {/* PROFILE DETAILS */}
                <View style={[styles.sectionCard, styles.shadowCard]}>
                  <Text style={styles.sectionHeader}>📋 Student Details</Text>

                  {[
                    ["Hostel ID", selectedStudent.hostel_id],
                    ["USN", selectedStudent.usn],
                    ["Department", selectedStudent.dept_branch],
                    ["Year", selectedStudent.year],
                    ["Batch", selectedStudent.batch],
                    ["Phone", selectedStudent.phone_number],
                    ["Gender", selectedStudent.gender],
                    [
                      "DOB",
                      selectedStudent.dob
                        ? new Date(selectedStudent.dob).toLocaleDateString()
                        : "N/A",
                    ],
                  ].map(([label, val], idx) => (
                    <View key={idx} style={styles.detailRow}>
                      <Text style={styles.label}>{label}</Text>
                      <Text style={styles.value}>{val || "N/A"}</Text>
                    </View>
                  ))}

                  <View style={{ marginTop: 8 }}>
                    <Text style={styles.label}>Address</Text>
                    <Text style={[styles.value, { marginTop: 4 }]}>
                      {selectedStudent.address || "N/A"}
                    </Text>
                  </View>

                  <View style={{ marginTop: 12 }}>
                    <Text style={styles.label}>Joined</Text>
                    <Text style={styles.value}>
                      {fmtDate(selectedStudent.created_at)}
                    </Text>

                    <Text style={[styles.label, { marginTop: 8 }]}>Left</Text>
                    <Text style={styles.value}>
                      {fmtDate(selectedStudent.left_at)}
                    </Text>
                  </View>
                </View>

                {/* PARENTS */}
                {/* PARENTS */}
                <View style={styles.parentContainer}>
                  <Text style={styles.parentTitle}>👨 Father's Details</Text>
                  <Text style={styles.parentInfo}>
                    Name: {selectedStudent.father_name || "N/A"}
                  </Text>
                  <Text style={styles.parentInfo}>
                    Phone: {selectedStudent.father_number || "N/A"}
                  </Text>

                  <Text style={[styles.parentTitle, { marginTop: 10 }]}>
                    👩 Mother's Details
                  </Text>
                  <Text style={styles.parentInfo}>
                    Name: {selectedStudent.mother_name || "N/A"}
                  </Text>
                  <Text style={styles.parentInfo}>
                    Phone: {selectedStudent.mother_number || "N/A"}
                  </Text>
                </View>

                {/* REMARKS */}
                <View style={[styles.sectionCard, styles.shadowCard]}>
                  <Text style={styles.sectionHeader}>🗒️ Warden Remarks</Text>

                  {detailsLoading ? (
                    <ActivityIndicator size="small" color="#2563eb" />
                  ) : remarks.length === 0 ? (
                    <Text style={styles.emptyText}>No remarks recorded.</Text>
                  ) : (
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      snapToInterval={280}
                      contentContainerStyle={{ paddingVertical: 6 }}
                    >
                      {remarks.map((r) => (
                        <View key={r.id} style={styles.remarkCardHorizontal}>
                          <Text style={styles.remarkText}>{r.remark}</Text>
                          <Text style={styles.remarkDate}>
                            {new Date(r.created_at).toLocaleDateString(
                              "en-IN",
                              {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              }
                            )}{" "}
                            • {r.warden_name || "Warden"}
                          </Text>
                        </View>
                      ))}
                    </ScrollView>
                  )}
                </View>

                {/* COMPLAINTS */}
                <View style={[styles.sectionCard, styles.shadowCard]}>
                  <Text style={styles.sectionHeader}>⚠️ Complaints</Text>

                  {detailsLoading ? (
                    <ActivityIndicator size="small" color="#2563eb" />
                  ) : complaints.length === 0 ? (
                    <Text style={styles.emptyText}>No complaints filed.</Text>
                  ) : (
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      snapToInterval={300}
                      contentContainerStyle={{ paddingVertical: 6 }}
                    >
                      {complaints.map((c) => {
                        const getColors = (status) => {
                          if (!status) return ["#fde68a", "#92400e"];
                          status = status.toLowerCase();
                          if (status === "resolved")
                            return ["#bbf7d0", "#065f46"];
                          if (status === "denied")
                            return ["#fecaca", "#991b1b"];
                          return ["#fde68a", "#92400e"];
                        };

                        const [bgColor, textColor] = getColors(c.status);

                        return (
                          <View
                            key={c.id}
                            style={styles.complaintCardHorizontal}
                          >
                            <Text style={styles.complaintTitle}>{c.title}</Text>
                            <Text
                              style={styles.complaintDesc}
                              numberOfLines={4}
                            >
                              {c.description}
                            </Text>

                            <Text style={styles.dateText}>
                              Raised: {fmtDate(c.created_at)}
                            </Text>
                            <Text style={styles.dateText}>
                              Updated: {fmtDate(c.updated_at)}
                            </Text>

                            <View
                              style={[
                                styles.statusBadge,
                                { backgroundColor: bgColor },
                              ]}
                            >
                              <Text
                                style={[
                                  styles.statusText,
                                  { color: textColor },
                                ]}
                              >
                                {c.status?.toUpperCase()}
                              </Text>
                            </View>
                          </View>
                        );
                      })}
                    </ScrollView>
                  )}
                </View>
              </ScrollView>

              <TouchableOpacity
                style={styles.closeBtn}
                onPress={() => {
                  setSelectedStudent(null);
                  setRemarks([]);
                  setComplaints([]);
                }}
              >
                <Ionicons name="close" size={18} color="#fff" />
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

/* ===================== STYLES ===================== */
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
  metaText: { fontSize: 13, color: "#475569", marginTop: 4 },
  email: { color: "#475569", marginVertical: 4 },
  role: { fontSize: 13, color: "#2563eb", fontWeight: "600" },
  date: { fontSize: 12, color: "#64748b", marginTop: 6 },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "center",
    alignItems: "center",
  },

  modalBox: {
    backgroundColor: "#fff",
    borderRadius: 12,
    width: "92%",
    maxHeight: "88%",
    padding: 18,
    elevation: 8,
  },

  headerRow: {
    flexDirection: "row",
    justifyContent: "flex-start",
    marginBottom: 10,
  },

  modalTitle: { fontSize: 20, fontWeight: "700", color: "#0f172a" },
  subTitle: { fontSize: 13, color: "#475569" },

  sectionCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  shadowCard: { elevation: 3 },

  sectionHeader: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0b5cff",
    marginBottom: 8,
  },

  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
    gap: 20,
  },

  label: {
    width: 120,
    color: "#475569",
    fontWeight: "600",
    fontSize: 14,
  },

  value: {
    flexShrink: 1,
    color: "#0f172a",
    fontWeight: "500",
    fontSize: 14,
  },

  modalMeta: { color: "#475569", fontSize: 14, marginVertical: 2 },

  remarkCardHorizontal: {
    width: 260,
    backgroundColor: "#f8fafc",
    borderRadius: 12,
    padding: 12,
    marginRight: 14,
    borderLeftWidth: 3,
    borderLeftColor: "#0b5cff",
    elevation: 2,
  },

  remarkText: { fontSize: 14, color: "#0f172a", lineHeight: 20 },
  remarkDate: { fontSize: 12, color: "#64748b", marginTop: 6 },

  complaintCardHorizontal: {
    width: 290,
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14,
    marginRight: 14,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    elevation: 3,
  },

  complaintTitle: { fontSize: 15, fontWeight: "700", color: "#0f172a" },
  complaintDesc: {
    fontSize: 13,
    color: "#475569",
    marginTop: 6,
    lineHeight: 18,
  },

  dateText: { fontSize: 12, color: "#64748b" },

  statusBadge: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 8,
    alignSelf: "flex-start",
    marginTop: 8,
  },
  statusText: { fontWeight: "700", fontSize: 12 },

  emptyText: {
    textAlign: "center",
    color: "#94a3b8",
    fontSize: 14,
    marginTop: 8,
  },

  closeBtn: {
    flexDirection: "row",
    backgroundColor: "#0b5cff",
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    marginTop: 6,
  },
  closeText: { color: "#fff", marginLeft: 8, fontWeight: "700" },

  backBtn: {
    marginTop: 16,
    backgroundColor: "#0b5cff",
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  backBtnText: { color: "#fff", fontWeight: "700" },

  center: { flex: 1, justifyContent: "center", alignItems: "center" },
});
