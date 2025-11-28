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
  Alert,
} from "react-native";
import axios from "axios";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get("window");
const BACKEND = "http://10.49.102.21:5000";

/**
 * Students History
 */

export default function StudentsHistory() {
  const [pastStudents, setStudentsHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  const [selectedStudent, setSelectedStudent] = useState(null);
  const [remarks, setRemarks] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("details");

  const [wardensById, setWardensById] = useState({});
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;

  const loadWardens = async () => {
    try {
      const res = await axios.get(`${BACKEND}/api/admin/users`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const map = {};
      res.data.forEach((u) => {
        if (u.role === "warden") {
          map[String(u.id)] = { id: u.id, name: u.name };
        }
      });

      setWardensById(map);
    } catch (err) {
      console.warn("Failed loading wardens:", err);
    }
  };

  const fetchStudentsHistory = async () => {
    try {
      setLoading(true);
      await loadWardens();

      const res = await axios.get(`${BACKEND}/api/students/history`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setStudentsHistory(res.data || []);
    } catch (err) {
      Alert.alert("Error", "Failed to fetch students history.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudentsHistory();
  }, []);

  const fmtDate = (d) => {
    try {
      return d
        ? new Date(d).toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          })
        : "—";
    } catch {
      return "—";
    }
  };

  const openStudentModal = async (student) => {
    setSelectedStudent(student);
    setDetailsLoading(true);
    setActiveTab("details");

    const idForFetch = student.user_id ?? student.id;

    try {
      if (Array.isArray(student.remarks)) setRemarks(student.remarks);
      else {
        const r = await axios.get(`${BACKEND}/api/remarks/${idForFetch}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setRemarks(r.data || []);
      }
    } catch {
      setRemarks([]);
    }

    try {
      if (Array.isArray(student.complaints)) setComplaints(student.complaints);
      else {
        const c = await axios.get(
          `${BACKEND}/api/complaints/student/${idForFetch}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setComplaints(c.data || []);
      }
    } catch {
      setComplaints([]);
    }

    setDetailsLoading(false);
  };

  const wardenNameFor = (id) => wardensById[String(id)]?.name || "Warden";

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
      {/* HEADER */}
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.title}>🎓 Students History</Text>
          <Text style={styles.subtitle}>
            Students list — tap a card to view details, remarks and complaints
          </Text>
        </View>

        <View style={{ flexDirection: "row", gap: 8 }}>
          <TouchableOpacity
            style={styles.refreshBtn}
            onPress={fetchStudentsHistory}
          >
            <Ionicons name="refresh" size={18} color="#fff" />
            <Text style={styles.refreshText}>Refresh</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* GRID */}
      <ScrollView contentContainerStyle={styles.grid}>
        {pastStudents.length === 0 ? (
          <Text style={styles.emptyText}>No students history found.</Text>
        ) : (
          pastStudents.map((s) => (
            <TouchableOpacity
              key={s.id ?? s.user_id}
              style={styles.card}
              activeOpacity={0.9}
              onPress={() => openStudentModal(s)}
            >
              <Text style={styles.name}>{s.name}</Text>
              <Text style={styles.email}>{s.email}</Text>

              <View style={styles.cardMetaRow}>
                <View style={styles.metaBlock}>
                  <Ionicons name="id-card-outline" size={14} color="#6366f1" />
                  <Text style={styles.metaText}>USN: {s.usn || "—"}</Text>
                </View>

                <View style={styles.metaBlock}>
                  <Ionicons name="home-outline" size={14} color="#10b981" />
                  <Text style={styles.metaText}>Room: {s.room_no || "—"}</Text>
                </View>

                <View style={styles.metaBlock}>
                  <Ionicons name="school-outline" size={14} color="#f59e0b" />
                  <Text style={styles.metaText}>
                    {s.dept_branch || "—"} • {s.year || "—"}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      {/* ======================== MODAL ======================== */}
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
              {/* HEADER */}
              <View style={modalStyles.header}>
                <View style={{ flex: 1 }}>
                  <Text style={modalStyles.headerName}>
                    {selectedStudent.name}
                  </Text>
                  <Text style={modalStyles.headerSub}>
                    {selectedStudent.email}
                  </Text>
                </View>

                <View style={{ alignItems: "flex-end" }}>
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
              </View>

              {/* TABS */}
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

              {/* CONTENT */}
              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ padding: 18, paddingBottom: 24 }}
              >
                {/* DETAILS TAB */}
                {activeTab === "details" && (
                  <>
                    <View style={modalStyles.card}>
                      <Text style={modalStyles.cardTitle}>Student Details</Text>
                      <View style={modalStyles.row}>
                        <DetailRow
                          label="Hostel ID"
                          value={selectedStudent.hostel_id}
                        />
                      </View>

                      <View style={modalStyles.row}>
                        <DetailRow label="USN" value={selectedStudent.usn} />
                      </View>

                      <View style={modalStyles.row}>
                        <DetailRow
                          label="Department"
                          value={selectedStudent.dept_branch}
                        />
                      </View>

                      <View style={modalStyles.row}>
                        <DetailRow label="Year" value={selectedStudent.year} />
                      </View>

                      <View style={modalStyles.row}>
                        <DetailRow
                          label="Batch"
                          value={selectedStudent.batch}
                        />
                      </View>

                      <View style={modalStyles.row}>
                        <DetailRow
                          label="Address"
                          value={selectedStudent.address}
                        />
                      </View>

                      <View style={modalStyles.row}>
                        <DetailRow
                          label="Phone"
                          value={selectedStudent.phone_number}
                        />
                      </View>

                      <View style={modalStyles.row}>
                        <DetailRow
                          label="Gender"
                          value={selectedStudent.gender}
                        />
                      </View>

                      <View style={modalStyles.row}>
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
                      </View>

                      <View style={{ marginTop: 12 }}>
                        <Text style={modalStyles.smallLabel}>Address</Text>
                        <Text style={[modalStyles.valueText, { marginTop: 6 }]}>
                          {selectedStudent.address || "N/A"}
                        </Text>
                      </View>
                    </View>

                    <View style={modalStyles.row}>
                      <DetailRow
                        label="Joined"
                        value={fmtDate(selectedStudent.created_at)}
                      />
                    </View>

                    <View style={modalStyles.row}>
                      <DetailRow
                        label="Left"
                        value={fmtDate(selectedStudent.left_at)}
                      />
                    </View>

                    <View style={modalStyles.parentCard}>
                      <Text style={modalStyles.parentHeader}>
                        👨 Parent Information
                      </Text>
                      <View style={modalStyles.row}>
                        <DetailRow
                          label="Father Name"
                          value={selectedStudent.father_name}
                        />
                      </View>

                      <View style={modalStyles.row}>
                        <DetailRow
                          label="Father Phone"
                          value={selectedStudent.father_number}
                        />
                      </View>

                      <View style={modalStyles.row}>
                        <DetailRow
                          label="Mother Name"
                          value={selectedStudent.mother_name}
                        />
                      </View>

                      <View style={modalStyles.row}>
                        <DetailRow
                          label="Mother Phone"
                          value={selectedStudent.mother_number}
                        />
                      </View>
                    </View>
                  </>
                )}

                {/* REMARKS TAB */}
                {activeTab === "remarks" && (
                  <View style={[modalStyles.card, { paddingBottom: 8 }]}>
                    <Text style={modalStyles.cardTitle}>🗒️ Remarks</Text>

                    {detailsLoading ? (
                      <ActivityIndicator size="small" color="#2563eb" />
                    ) : remarks.length === 0 ? (
                      <Text style={modalStyles.emptyText}>
                        No remarks recorded.
                      </Text>
                    ) : (
                      remarks.map((r) => (
                        <View
                          key={r.id ?? Math.random()}
                          style={modalStyles.remarkRow}
                        >
                          <Text style={modalStyles.remarkText}>{r.remark}</Text>

                          <Text style={modalStyles.remarkMeta}>
                            {fmtDate(r.created_at)} •{" "}
                            <Text style={modalStyles.remarkWarden}>
                              {wardenNameFor(r.warden_id)}
                            </Text>
                          </Text>
                        </View>
                      ))
                    )}
                  </View>
                )}

                {/* COMPLAINTS TAB */}
                {activeTab === "complaints" && (
                  <View style={[modalStyles.card, { paddingBottom: 8 }]}>
                    <Text style={modalStyles.cardTitle}>⚠️ Complaints</Text>

                    {detailsLoading ? (
                      <ActivityIndicator size="small" color="#2563eb" />
                    ) : complaints.length === 0 ? (
                      <Text style={modalStyles.emptyText}>
                        No complaints filed.
                      </Text>
                    ) : (
                      complaints.map((c) => {
                        const [bgC, textC] = getComplaintColors(c.status);

                        return (
                          <View
                            key={c.id ?? Math.random()}
                            style={modalStyles.complaintRow}
                          >
                            <Text style={modalStyles.complaintTitle}>
                              {c.title}
                            </Text>
                            <Text style={modalStyles.complaintDesc}>
                              {c.description}
                            </Text>

                            <Text style={modalStyles.smallMeta}>
                              Submitted: {fmtDate(c.created_at)}
                            </Text>
                            <Text style={modalStyles.smallMeta}>
                              Updated: {fmtDate(c.updated_at)}
                            </Text>

                            <View
                              style={[
                                modalStyles.statusBadge,
                                { backgroundColor: bgC },
                              ]}
                            >
                              <Text
                                style={[
                                  modalStyles.statusText,
                                  { color: textC },
                                ]}
                              >
                                {c.status?.toUpperCase() || "PENDING"}
                              </Text>
                            </View>
                          </View>
                        );
                      })
                    )}
                  </View>
                )}
              </ScrollView>

              {/* FOOTER */}
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

      {/* BACK BUTTON */}
      <TouchableOpacity
        style={styles.backBtn}
        onPress={() => router.push("/admin-dashboard")}
      >
        <Text style={styles.backBtnText}>← Back to Dashboard</Text>
      </TouchableOpacity>
    </View>
  );
}

/* ------------ SMALL COMPONENTS -------------- */

function DetailRow({ label, value }) {
  return (
    <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
      <Text style={modalStyles.smallLabel}>{label}</Text>
      <Text style={modalStyles.valueText}>{value || "—"}</Text>
    </View>
  );
}

function TabButton({ label, active, onPress }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[modalStyles.tabBtn, active && modalStyles.tabBtnActive]}
    >
      <Text
        style={[modalStyles.tabBtnText, active && modalStyles.tabBtnTextActive]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

/* ------------ Complaint badge colors -------------- */

function getComplaintColors(status) {
  if (!status) return ["#fde68a", "#92400e"];
  const s = status.toLowerCase();
  if (s === "resolved") return ["#bbf7d0", "#065f46"];
  if (s === "denied") return ["#fecaca", "#991b1b"];
  return ["#fde68a", "#92400e"];
}

/* ============================================================
   MAIN PAGE STYLES
   ============================================================ */

const styles = StyleSheet.create({
  page: { backgroundColor: "#f3f6fb", flex: 1, padding: 18 },

  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },

  title: { fontSize: 24, fontWeight: "900", color: "#0b5cff" },
  subtitle: { color: "#6b7280", marginTop: 4 },

  refreshBtn: {
    backgroundColor: "#0b5cff",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    marginRight: 8,
  },
  refreshText: { color: "#fff", fontWeight: "800", marginLeft: 8 },

  backSmallBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#eef2ff",
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#c7d2fe",
  },
  backSmallText: {
    marginLeft: 6,
    color: "#4f46e5",
    fontWeight: "700",
  },

  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 14,
    paddingBottom: 24,
  },

  card: {
    width: SCREEN_W > 1200 ? "30%" : SCREEN_W > 900 ? "47%" : "100%",
    minWidth: 260,
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "#e6eefc",
    elevation: 3,
  },

  name: { fontSize: 16, fontWeight: "900", color: "#0f172a" },
  email: { color: "#475569", marginTop: 8 },

  cardMetaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
    gap: 8,
  },

  metaBlock: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  metaText: { color: "#6b7280", fontWeight: "700", fontSize: 13 },

  emptyText: {
    textAlign: "center",
    color: "#94a3b8",
    fontSize: 15,
    marginTop: 28,
  },

  backBtn: {
    marginTop: 10,
    backgroundColor: "#0b5cff",
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 18,
  },
  backBtnText: { color: "#fff", fontWeight: "800" },

  center: { flex: 1, justifyContent: "center", alignItems: "center" },
});

/* ============================================================
   MODAL STYLES
   ============================================================ */

const modalStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(6,8,15,0.45)",
    justifyContent: "center",
    alignItems: "center",
    padding: 14,
  },

  modalBox: {
    width: SCREEN_W > 1200 ? "86%" : "96%",
    maxHeight: SCREEN_H * 0.92,
    backgroundColor: "#fff",
    borderRadius: 12,
    overflow: "hidden",
    elevation: 20,
  },

  header: {
    flexDirection: "row",
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderColor: "#eef2ff",
  },

  headerName: { fontSize: 20, fontWeight: "900", color: "#0b5cff" },
  headerSub: { fontSize: 13, color: "#475569" },
  smallMeta: { fontSize: 12, color: "#6b7280", marginBottom: 6 },

  iconWrap: {
    padding: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e6eefc",
  },

  /* Tabs */
  tabBar: {
    flexDirection: "row",
    gap: 8,
    padding: 12,
    backgroundColor: "#fbfdff",
    borderBottomWidth: 1,
    borderColor: "#f1f5f9",
  },

  tabBtn: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
  },
  tabBtnActive: { backgroundColor: "#e6f0ff" },
  tabBtnText: { fontWeight: "800", color: "#475569" },
  tabBtnTextActive: { color: "#0b5cff" },

  /* Main modal cards */
  card: {
    backgroundColor: "#f5f3ff", // lavender bg
    padding: 18,
    marginVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#e2e0ff",
  },

  cardTitle: {
    fontSize: 16,
    fontWeight: "900",
    color: "#0b5cff",
    marginBottom: 10,
  },

  twoCol: { flexDirection: "row", gap: 18 },
  col: { flex: 1 },

  detailRow: {
    flexDirection: "row",
    marginBottom: 10,
  },
  smallLabel: { width: 120, color: "#475569", fontWeight: "800" },
  valueText: { flex: 1, color: "#0f172a", fontWeight: "700" },

  parentCard: {
    backgroundColor: "#f5f3ff",
    padding: 18,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#e2e0ff",
    marginTop: 10,
  },

  parentHeader: { fontWeight: "900", color: "#2563eb", marginBottom: 6 },
  parentText: { color: "#334155", marginBottom: 4 },

  row: {
    backgroundColor: "#f5f3ff", // lavender
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#e2e0ff",
  },

  /* ============================================================
     REMARKS ROW — CLEARLY SEPARATED CARDS
     ============================================================ */

  remarkRow: {
    padding: 14,
    marginBottom: 10,
    borderRadius: 10,
    backgroundColor: "#f8faff",
    borderWidth: 1,
    borderColor: "#e5e9ff",
  },

  remarkText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0f172a",
  },

  remarkMeta: {
    marginTop: 6,
    fontSize: 13,
    fontWeight: "600",
    color: "#475569",
  },

  remarkWarden: {
    color: "#0b5cff",
    fontWeight: "900",
    fontSize: 13,
  },

  /* ============================================================
     COMPLAINT ROW — CARD STYLE LIKE REMARKS
     ============================================================ */

  complaintRow: {
    padding: 14,
    marginBottom: 12,
    borderRadius: 10,
    backgroundColor: "#f8faff",
    borderWidth: 1,
    borderColor: "#e5e9ff",
  },

  complaintTitle: { fontSize: 15, fontWeight: "900", color: "#0f172a" },
  complaintDesc: { marginTop: 6, color: "#475569" },

  statusBadge: {
    alignSelf: "flex-start",
    marginTop: 10,
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  statusText: { fontWeight: "900", fontSize: 12 },

  footerRow: {
    padding: 12,
    borderTopWidth: 1,
    borderColor: "#eef2ff",
    alignItems: "center",
  },

  closeBtn: {
    flexDirection: "row",
    backgroundColor: "#0b5cff",
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  closeText: { color: "#fff", marginLeft: 8, fontWeight: "900" },

  emptyText: {
    textAlign: "center",
    color: "#94a3b8",
    fontSize: 14,
    marginTop: 8,
  },
});
