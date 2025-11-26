// frontend/app/warden/studens-history.jsx
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Dimensions,
} from "react-native";
import axios from "axios";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get("window");

export default function StudentsHistory() {
  const [pastStudents, setStudentsHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  const [selectedStudent, setSelectedStudent] = useState(null);
  const [remarks, setRemarks] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("details");

  const BACKEND = "http://10.49.102.21:5000";
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;

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

  const openStudentModal = async (student) => {
    setSelectedStudent(student);
    setDetailsLoading(true);
    setActiveTab("details");

    const idForFetch = student.user_id ?? student.id; // history rows may use user_id or id

    // REMARKS
    if (student.remarks && Array.isArray(student.remarks)) {
      setRemarks(student.remarks);
    } else {
      try {
        const remRes = await axios.get(`${BACKEND}/api/remarks/${idForFetch}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setRemarks(remRes.data || []);
      } catch (err) {
        console.warn("No remarks via API or failed:", err);
        setRemarks([]);
      }
    }

    // COMPLAINTS
    if (student.complaints && Array.isArray(student.complaints)) {
      setComplaints(student.complaints);
    } else {
      try {
        const compRes = await axios.get(
          `${BACKEND}/api/complaints/student/${idForFetch}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setComplaints(compRes.data || []);
      } catch (err) {
        console.warn("No complaints via API or failed:", err);
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
          pastStudents.map((s) => {
            const key = s.id ?? s.user_id ?? Math.random();
            return (
              <TouchableOpacity
                key={key}
                style={styles.card}
                activeOpacity={0.88}
                onPress={() => openStudentModal(s)}
              >
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                  }}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={styles.name}>{s.name}</Text>
                    <Text style={styles.metaText}>
                      🏢 Hostel ID: {s.hostel_id || "—"}
                    </Text>
                    <Text style={styles.email}>{s.email || "—"}</Text>
                    <Text style={styles.role}>
                      🎓 {s.dept_branch || s.role || "—"} • {s.year || "—"}
                    </Text>
                  </View>

                  <View style={{ alignItems: "flex-end", marginLeft: 8 }}>
                    <Text style={styles.date}>Left: {fmtDate(s.left_at)}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>

      {/* ========== MODAL ========== */}
      {selectedStudent && (
        <Modal
          visible={true}
          transparent={true}
          animationType="fade"
          onRequestClose={() => {
            setSelectedStudent(null);
            setRemarks([]);
            setComplaints([]);
          }}
        >
          <View style={modalStyles.overlay}>
            <View style={modalStyles.modalBox}>
              {/* Header */}
              <View style={modalStyles.header}>
                <View style={{ flex: 1 }}>
                  <Text style={modalStyles.headerName}>
                    {selectedStudent.name}
                  </Text>
                  <Text style={modalStyles.headerSub}>
                    {selectedStudent.email}
                  </Text>
                </View>

                <TouchableOpacity
                  onPress={() => {
                    setSelectedStudent(null);
                    setRemarks([]);
                    setComplaints([]);
                  }}
                  style={modalStyles.iconWrap}
                >
                  <Ionicons name="close" size={20} color="#0b5cff" />
                </TouchableOpacity>
              </View>

              {/* Tabs */}
              <View style={modalStyles.tabBar}>
                <TabButton
                  label="Details"
                  active={activeTab === "details"}
                  onPress={() => setActiveTab("details")}
                />
                <TabButton
                  label={`Remarks (${remarks.length})`}
                  active={activeTab === "remarks"}
                  onPress={() => setActiveTab("remarks")}
                />
                <TabButton
                  label={`Complaints (${complaints.length})`}
                  active={activeTab === "complaints"}
                  onPress={() => setActiveTab("complaints")}
                />
              </View>

              {/* Content */}
              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ padding: 16, paddingBottom: 26 }}
              >
                {activeTab === "details" && (
                  <>
                    <View style={modalStyles.card}>
                      <Text style={modalStyles.cardTitle}>Student Details</Text>

                      <View style={modalStyles.twoCol}>
                        <View style={modalStyles.col}>
                          <DetailRow
                            label="Hostel ID"
                            value={selectedStudent.hostel_id}
                          />
                          <DetailRow label="USN" value={selectedStudent.usn} />
                          <DetailRow
                            label="Department"
                            value={selectedStudent.dept_branch}
                          />
                          <DetailRow
                            label="Year"
                            value={selectedStudent.year}
                          />
                          <DetailRow
                            label="Batch"
                            value={selectedStudent.batch}
                          />
                        </View>

                        <View style={modalStyles.col}>
                          <DetailRow
                            label="Phone"
                            value={selectedStudent.phone_number}
                          />
                          <DetailRow
                            label="Gender"
                            value={selectedStudent.gender}
                          />
                          <DetailRow
                            label="DOB"
                            value={
                              selectedStudent.dob
                                ? new Date(
                                    selectedStudent.dob
                                  ).toLocaleDateString()
                                : "—"
                            }
                          />
                          <DetailRow
                            label="Joined"
                            value={fmtDate(selectedStudent.created_at)}
                          />
                          <DetailRow
                            label="Left"
                            value={fmtDate(selectedStudent.left_at)}
                          />
                        </View>
                      </View>

                      <View style={{ marginTop: 12 }}>
                        <Text style={modalStyles.smallLabel}>Address</Text>
                        <Text style={[modalStyles.valueText, { marginTop: 6 }]}>
                          {selectedStudent.address || "N/A"}
                        </Text>
                      </View>
                    </View>

                    <View style={modalStyles.parentCard}>
                      <Text style={modalStyles.parentHeader}>
                        👨 Father's Details
                      </Text>
                      <Text style={modalStyles.parentText}>
                        Name: {selectedStudent.father_name || "N/A"}
                      </Text>
                      <Text style={modalStyles.parentText}>
                        Phone: {selectedStudent.father_number || "N/A"}
                      </Text>

                      <View style={{ height: 10 }} />

                      <Text style={modalStyles.parentHeader}>
                        👩 Mother's Details
                      </Text>
                      <Text style={modalStyles.parentText}>
                        Name: {selectedStudent.mother_name || "N/A"}
                      </Text>
                      <Text style={modalStyles.parentText}>
                        Phone: {selectedStudent.mother_number || "N/A"}
                      </Text>
                    </View>
                  </>
                )}

                {activeTab === "remarks" && (
                  <View style={[modalStyles.card, { paddingBottom: 20 }]}>
                    <Text style={modalStyles.cardTitle}>🗒️ Warden Remarks</Text>

                    {detailsLoading ? (
                      <ActivityIndicator size="small" color="#2563eb" />
                    ) : remarks.length === 0 ? (
                      <Text style={modalStyles.emptyText}>
                        No remarks recorded.
                      </Text>
                    ) : (
                      <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={{ paddingVertical: 10 }}
                      >
                        {remarks.map((r) => (
                          <View
                            key={r.id ?? JSON.stringify(r)}
                            style={modalStyles.remarkCard}
                          >
                            <Text style={modalStyles.remarkText}>
                              {r.remark}
                            </Text>
                            <Text style={modalStyles.remarkMeta}>
                              {r.created_at
                                ? new Date(r.created_at).toLocaleString(
                                    "en-IN",
                                    {
                                      day: "2-digit",
                                      month: "short",
                                      year: "numeric",
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    }
                                  )
                                : "—"}{" "}
                              •{" "}
                              {r.warden_id
                                ? `Warden #${r.warden_id}`
                                : "Warden"}
                            </Text>
                          </View>
                        ))}
                      </ScrollView>
                    )}
                  </View>
                )}

                {activeTab === "complaints" && (
                  <View style={[modalStyles.card, { paddingBottom: 20 }]}>
                    <Text style={modalStyles.cardTitle}>⚠️ Complaints</Text>

                    {detailsLoading ? (
                      <ActivityIndicator size="small" color="#2563eb" />
                    ) : complaints.length === 0 ? (
                      <Text style={modalStyles.emptyText}>
                        No complaints filed.
                      </Text>
                    ) : (
                      <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={{ paddingVertical: 10 }}
                      >
                        {complaints.map((c) => {
                          const [bgColor, textColor] = getComplaintColors(
                            c.status
                          );
                          return (
                            <View
                              key={c.id ?? JSON.stringify(c)}
                              style={modalStyles.complaintCard}
                            >
                              <Text style={modalStyles.complaintTitle}>
                                {c.title}
                              </Text>
                              <Text
                                style={modalStyles.complaintDesc}
                                numberOfLines={5}
                              >
                                {c.description}
                              </Text>
                              <Text style={modalStyles.dateText}>
                                Raised: {fmtDate(c.created_at)}
                              </Text>
                              <Text style={modalStyles.dateText}>
                                Updated: {fmtDate(c.updated_at)}
                              </Text>

                              <View
                                style={[
                                  modalStyles.statusBadge,
                                  { backgroundColor: bgColor },
                                ]}
                              >
                                <Text
                                  style={[
                                    modalStyles.statusText,
                                    { color: textColor },
                                  ]}
                                >
                                  {c.status
                                    ? c.status.toUpperCase()
                                    : "PENDING"}
                                </Text>
                              </View>
                            </View>
                          );
                        })}
                      </ScrollView>
                    )}
                  </View>
                )}
              </ScrollView>

              {/* Footer buttons */}
              <View style={modalStyles.footerRow}>
                <TouchableOpacity
                  style={modalStyles.closeBtn}
                  onPress={() => {
                    setSelectedStudent(null);
                    setRemarks([]);
                    setComplaints([]);
                  }}
                >
                  <Ionicons name="close" size={18} color="#fff" />
                  <Text style={modalStyles.closeText}>Close</Text>
                </TouchableOpacity>
              </View>
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

/* ===================== Small helper components ===================== */

function DetailRow({ label, value }) {
  return (
    <View style={modalStyles.detailRow}>
      <Text style={modalStyles.smallLabel}>{label}</Text>
      <Text style={modalStyles.valueText}>{value || "—"}</Text>
    </View>
  );
}

function TabButton({ label, active, onPress }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[modalStyles.tabBtn, active ? modalStyles.tabBtnActive : null]}
    >
      <Text
        style={[
          modalStyles.tabBtnText,
          active ? modalStyles.tabBtnTextActive : null,
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

function getComplaintColors(status) {
  if (!status) return ["#fde68a", "#92400e"];
  const s = status.toLowerCase();
  if (s === "resolved") return ["#bbf7d0", "#065f46"];
  if (s === "denied") return ["#fecaca", "#991b1b"];
  return ["#fde68a", "#92400e"];
}

/* ===================== Styles ===================== */

const styles = StyleSheet.create({
  page: { backgroundColor: "#f3f6fb", flex: 1, padding: 20 },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#0b5cff",
    marginBottom: 14,
  },

  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "flex-start",
    gap: 12,
  },

  card: {
    width: "31%",
    minWidth: 240,
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#e6eefc",
    elevation: 2,
  },

  name: { fontSize: 15, fontWeight: "700", color: "#0f172a" },
  metaText: { fontSize: 12, color: "#64748b", marginTop: 6 },
  email: { color: "#475569", marginVertical: 6 },
  role: { fontSize: 13, color: "#2563eb", fontWeight: "600" },
  date: { fontSize: 12, color: "#64748b", marginTop: 6 },

  emptyText: {
    textAlign: "center",
    color: "#94a3b8",
    fontSize: 14,
    marginTop: 8,
  },

  backBtn: {
    marginTop: 18,
    backgroundColor: "#0b5cff",
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  backBtnText: { color: "#fff", fontWeight: "700" },

  center: { flex: 1, justifyContent: "center", alignItems: "center" },
});

/* ===================== Modal styles ===================== */

const modalStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(6,8,15,0.45)",
    justifyContent: "center",
    alignItems: "center",
    padding: 14,
  },
  modalBox: {
    width: SCREEN_W > 1200 ? "86%" : "94%",
    maxHeight: SCREEN_H * 0.88,
    backgroundColor: "#fff",
    borderRadius: 12,
    overflow: "hidden",
    elevation: 12,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 18,
    paddingTop: 14,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderColor: "#eef2ff",
  },
  headerName: { fontSize: 20, fontWeight: "800", color: "#0b5cff" },
  headerSub: { fontSize: 13, color: "#475569", marginTop: 2 },
  iconWrap: {
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e6eefc",
    marginLeft: 12,
  },

  tabBar: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderColor: "#f1f5f9",
    backgroundColor: "#fbfdff",
  },
  tabBtn: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
  },
  tabBtnActive: {
    backgroundColor: "#e6f0ff",
  },
  tabBtnText: {
    color: "#475569",
    fontWeight: "700",
  },
  tabBtnTextActive: {
    color: "#0b5cff",
  },

  card: {
    backgroundColor: "#fff",
    padding: 14,
    marginVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#eef2ff",
    elevation: 2,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0b5cff",
    marginBottom: 10,
  },

  twoCol: {
    flexDirection: "row",
    gap: 18,
  },
  col: {
    flex: 1,
    minWidth: 200,
  },

  detailRow: {
    flexDirection: "row",
    marginBottom: 10,
  },
  smallLabel: {
    width: 110,
    color: "#475569",
    fontWeight: "700",
    fontSize: 13,
  },
  valueText: {
    flex: 1,
    color: "#0f172a",
    fontWeight: "600",
    fontSize: 14,
  },

  parentCard: {
    backgroundColor: "#fff",
    padding: 14,
    marginVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#eef2ff",
  },
  parentHeader: { color: "#2563eb", fontWeight: "800", marginBottom: 6 },
  parentText: { color: "#334155", fontSize: 14, marginBottom: 4 },

  remarkCard: {
    width: 320,
    backgroundColor: "#f8fbff",
    borderRadius: 10,
    padding: 14,
    marginRight: 12,
    borderLeftWidth: 4,
    borderLeftColor: "#0b5cff",
    elevation: 2,
  },
  remarkText: {
    fontSize: 14,
    color: "#0f172a",
    lineHeight: 20,
  },
  remarkMeta: { marginTop: 8, fontSize: 12, color: "#64748b" },

  complaintCard: {
    width: 320,
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 14,
    marginRight: 12,
    borderWidth: 1,
    borderColor: "#eef2ff",
    elevation: 2,
  },
  complaintTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#0f172a",
    marginBottom: 8,
  },
  complaintDesc: {
    fontSize: 13,
    color: "#475569",
    lineHeight: 18,
    marginBottom: 8,
  },
  dateText: { fontSize: 12, color: "#64748b" },

  statusBadge: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    alignSelf: "flex-start",
    marginTop: 8,
  },
  statusText: { fontWeight: "800", fontSize: 12 },

  footerRow: {
    padding: 12,
    borderTopWidth: 1,
    borderColor: "#eef2ff",
    alignItems: "center",
    justifyContent: "center",
  },

  closeBtn: {
    flexDirection: "row",
    backgroundColor: "#0b5cff",
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    paddingHorizontal: 18,
  },
  closeText: { color: "#fff", marginLeft: 8, fontWeight: "800" },

  emptyText: {
    textAlign: "center",
    color: "#94a3b8",
    fontSize: 14,
    marginTop: 8,
  },
});
