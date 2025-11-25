import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView, // ✅ ADDED THIS
} from "react-native";
import axios from "axios";
import { Ionicons } from "@expo/vector-icons";
import { Picker } from "@react-native-picker/picker";
import { router } from "expo-router";

export default function Complaints() {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedComplaint, setSelectedComplaint] = useState(null);

  const BACKEND = "http://172.29.206.21:5000";
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;

  // ✅ Fetch complaints
  const fetchComplaints = async () => {
    try {
      const res = await axios.get(`${BACKEND}/api/complaints`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setComplaints(res.data);
    } catch (err) {
      console.error("❌ Error fetching complaints:", err.response?.data || err);
      Alert.alert("Error", "Failed to load complaints.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, []);

  // ✅ Update complaint status
  const updateStatus = async (id, newStatus) => {
    try {
      await axios.put(
        `${BACKEND}/api/complaints/status/${id}`,
        { status: newStatus },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      Alert.alert("✅ Updated", `Status changed to "${newStatus}"`);
      fetchComplaints();
    } catch (err) {
      console.error("❌ Error updating complaint status:", err);
      Alert.alert("Error", "Failed to update status");
    }
  };

  // Helper for badge colors
  const getStatusStyle = (status) => {
    switch (status?.toLowerCase()) {
      case "resolved":
        return { backgroundColor: "#bbf7d0", color: "#065f46" };
      case "in-progress":
      case "in progress":
        return { backgroundColor: "#fde68a", color: "#92400e" };
      case "denied":
        return { backgroundColor: "#fecaca", color: "#991b1b" };
      default:
        return { backgroundColor: "#fef9c3", color: "#854d0e" };
    }
  };

  if (loading)
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#0b5cff" />
        <Text>Loading complaints...</Text>
      </View>
    );

  return (
    <View style={styles.page}>
      <Text style={styles.title}>📋 Student Complaints</Text>

      {/* ✅ SCROLL FIX — Grid wrapped inside ScrollView */}
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.grid}>
          {complaints.length === 0 ? (
            <Text style={{ color: "#64748b", marginTop: 20 }}>
              No complaints available.
            </Text>
          ) : (
            complaints.map((c) => {
              const style = getStatusStyle(c.status || "pending");

              const createdOn = c.created_at
                ? new Date(c.created_at).toLocaleDateString("en-IN", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })
                : "—";

              const updatedOn = c.updated_at
                ? new Date(c.updated_at).toLocaleDateString("en-IN", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })
                : "—";

              return (
                <TouchableOpacity
                  key={c.id}
                  style={styles.card}
                  activeOpacity={0.8}
                  onPress={() => setSelectedComplaint(c)}
                >
                  <Text style={styles.name}>{c.student_name}</Text>
                  <Text style={styles.studentHostel}>
                    🏢 Hostel ID: {c.hostel_id || "—"}
                  </Text>

                  <Text style={styles.meta}>📧 {c.email}</Text>
                  <Text style={styles.meta}>
                    🏠 Room: {c.room_no || "N/A"} | {c.dept_branch || "Dept"}
                  </Text>
                  <Text style={styles.meta}>
                    🎓 Year: {c.year || "—"} | USN: {c.usn || "—"}
                  </Text>

                  <View style={styles.dateRow}>
                    <Ionicons name="time-outline" size={13} color="#475569" />
                    <Text style={styles.dateText}>Raised: {createdOn}</Text>
                  </View>
                  <View style={styles.dateRow}>
                    <Ionicons
                      name="refresh-outline"
                      size={13}
                      color="#475569"
                    />
                    <Text style={styles.dateText}>Updated: {updatedOn}</Text>
                  </View>

                  <View
                    style={[
                      styles.statusBadge,
                      { backgroundColor: style.backgroundColor },
                    ]}
                  >
                    <Text style={[styles.statusText, { color: style.color }]}>
                      {c.status?.toUpperCase()}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </View>
      </ScrollView>

      {/* MODAL (unchanged) */}
      {selectedComplaint && (
        <Modal
          visible={true}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setSelectedComplaint(null)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalBox}>
              <Text style={styles.modalTitle}>{selectedComplaint.title}</Text>
              <Text style={styles.modalMeta}>
                👤 {selectedComplaint.student_name} | Room:{" "}
                {selectedComplaint.room_no || "N/A"}
              </Text>
              <Text style={styles.modalMeta}>📧 {selectedComplaint.email}</Text>
              <Text style={styles.modalDesc}>
                {selectedComplaint.description}
              </Text>

              <View style={styles.modalStatusRow}>
                <Text style={styles.modalLabel}>Change Status:</Text>
                <Picker
                  selectedValue={selectedComplaint.status}
                  style={styles.picker}
                  onValueChange={(newStatus) => {
                    updateStatus(selectedComplaint.id, newStatus);
                    setSelectedComplaint({
                      ...selectedComplaint,
                      status: newStatus,
                    });
                  }}
                >
                  <Picker.Item label="Pending" value="pending" />
                  <Picker.Item label="In Progress" value="in-progress" />
                  <Picker.Item label="Resolved" value="resolved" />
                  <Picker.Item label="Denied ❌" value="denied" />
                </Picker>
              </View>

              <TouchableOpacity
                style={styles.closeBtn}
                onPress={() => setSelectedComplaint(null)}
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
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    elevation: 3,
  },

  name: { fontWeight: "700", fontSize: 16, color: "#0f172a" },
  meta: { fontSize: 13, color: "#475569", marginVertical: 2 },

  dateRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 3,
  },

  dateText: {
    fontSize: 12,
    color: "#475569",
    marginLeft: 5,
  },

  statusBadge: {
    alignSelf: "flex-start",
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
    marginTop: 6,
  },

  statusText: { fontWeight: "700", fontSize: 12 },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.3)",
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

  modalMeta: { color: "#475569", fontSize: 13, marginVertical: 2 },
  modalDesc: {
    color: "#334155",
    fontSize: 14,
    marginVertical: 10,
    lineHeight: 20,
  },

  modalStatusRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
    justifyContent: "space-between",
  },

  modalLabel: { fontWeight: "600", color: "#1e293b", fontSize: 14 },
  picker: { height: 40, width: 160 },

  closeBtn: {
    flexDirection: "row",
    backgroundColor: "#0b5cff",
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    marginTop: 15,
  },

  closeText: {
    color: "#fff",
    fontWeight: "700",
    marginLeft: 5,
  },

  backBtn: {
    backgroundColor: "#0b5cff",
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 20,
  },

  backBtnText: { color: "#fff", fontWeight: "700" },

  center: { flex: 1, justifyContent: "center", alignItems: "center" },

  studentHostel: {
    fontSize: 13,
    color: "#1e3a8a",
    fontWeight: "600",
    marginVertical: 2,
  },
});
