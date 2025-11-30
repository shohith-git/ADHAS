// adhas/frontend/app/warden/complaints.jsx

import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
} from "react-native";
import axios from "axios";
import { Ionicons } from "@expo/vector-icons";
import { Picker } from "@react-native-picker/picker";
import { router } from "expo-router";

export default function Complaints() {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedComplaint, setSelectedComplaint] = useState(null);

  const BACKEND = "http://10.49.102.21:5000";
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;

  /* ----------------------------------------------------
     Fetch Complaints
  ---------------------------------------------------- */
  const fetchComplaints = async () => {
    try {
      const res = await axios.get(`${BACKEND}/api/complaints`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setComplaints(res.data);
    } catch (err) {
      Alert.alert("Error", "Failed to load complaints.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, []);

  /* ----------------------------------------------------
     Update Status
  ---------------------------------------------------- */
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

      fetchComplaints();
    } catch (err) {
      Alert.alert("Error", "Failed to update complaint status.");
    }
  };

  const badgeColors = {
    resolved: { bg: "#22c55e22", text: "#15803d" },
    "in-progress": { bg: "#facc1522", text: "#b45309" },
    pending: { bg: "#fef08a44", text: "#854d0e" },
    denied: { bg: "#fecaca44", text: "#b91c1c" },
  };

  if (loading)
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={{ marginTop: 8 }}>Loading complaints...</Text>
      </View>
    );

  /* ----------------------------------------------------
     UI
  ---------------------------------------------------- */

  return (
    <View style={styles.page}>
      <Text style={styles.header}>📋 Student Complaints</Text>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.grid}>
          {complaints.length === 0 ? (
            <Text style={styles.emptyText}>No complaints found.</Text>
          ) : (
            complaints.map((c) => {
              const badge = badgeColors[c.status] || badgeColors["pending"];

              const created = c.created_at
                ? new Date(c.created_at).toLocaleDateString("en-IN", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })
                : "—";

              const updated = c.updated_at
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
                  activeOpacity={0.85}
                  onPress={() => setSelectedComplaint(c)}
                >
                  <Text style={styles.cardTitle}>{c.title}</Text>

                  <Text style={styles.name}>{c.student_name}</Text>
                  <Text style={styles.meta}>📧 {c.email}</Text>

                  <Text style={styles.meta}>
                    🏠 Room: {c.room_no || "—"} • {c.dept_branch || "Dept"}
                  </Text>

                  <Text style={styles.meta}>🎓 Year: {c.year || "—"}</Text>
                  <Text style={styles.meta}>🪪 USN: {c.usn || "—"}</Text>

                  <View style={styles.row}>
                    <Ionicons name="time-outline" size={14} color="#475569" />
                    <Text style={styles.date}>Raised: {created}</Text>
                  </View>

                  <View style={styles.row}>
                    <Ionicons
                      name="refresh-outline"
                      size={14}
                      color="#475569"
                    />
                    <Text style={styles.date}>Updated: {updated}</Text>
                  </View>

                  <View style={[styles.badge, { backgroundColor: badge.bg }]}>
                    <Text style={[styles.badgeText, { color: badge.text }]}>
                      {c.status.toUpperCase()}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </View>
      </ScrollView>

      {/* MODAL DETAILS */}
      {selectedComplaint && (
        <Modal
          visible={true}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setSelectedComplaint(null)}
        >
          <View style={styles.overlay}>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>{selectedComplaint.title}</Text>

              <Text style={styles.modalMeta}>
                👤 {selectedComplaint.student_name}
              </Text>
              <Text style={styles.modalMeta}>📧 {selectedComplaint.email}</Text>
              <Text style={styles.modalMeta}>
                🏠 Room: {selectedComplaint.room_no || "—"}
              </Text>

              <Text style={styles.modalDesc}>
                {selectedComplaint.description}
              </Text>

              {/* Status Dropdown */}
              <View style={styles.statusRow}>
                <Text style={styles.statusLabel}>Status:</Text>
                <Picker
                  selectedValue={selectedComplaint.status}
                  style={styles.picker}
                  onValueChange={(value) => {
                    updateStatus(selectedComplaint.id, value);
                    setSelectedComplaint({
                      ...selectedComplaint,
                      status: value,
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

/* ----------------------------------------------------
   STYLES (Professionally Updated)
---------------------------------------------------- */

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: "#eef4ff",
    padding: 20,
  },

  header: {
    fontSize: 26,
    fontWeight: "800",
    color: "#0b5cff",
    marginBottom: 20,
  },

  emptyText: {
    color: "#64748b",
    fontStyle: "italic",
  },

  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },

  card: {
    width: "31%",
    backgroundColor: "#ffffff",
    borderRadius: 14,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    elevation: 4,
    shadowColor: "#00000030",
    shadowRadius: 6,
    shadowOpacity: 0.1,
  },

  cardTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#1e293b",
    marginBottom: 6,
  },

  name: {
    fontWeight: "700",
    fontSize: 14,
    color: "#0f172a",
    marginBottom: 3,
  },

  meta: {
    fontSize: 13,
    color: "#475569",
    marginVertical: 1,
  },

  row: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },

  date: {
    fontSize: 12,
    marginLeft: 5,
    color: "#475569",
  },

  badge: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 8,
    marginTop: 8,
    alignSelf: "flex-start",
  },

  badgeText: {
    fontWeight: "700",
    fontSize: 12,
  },

  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },

  modalCard: {
    backgroundColor: "#fff",
    width: "92%",
    borderRadius: 16,
    padding: 22,
    elevation: 8,
  },

  modalTitle: {
    fontSize: 18,
    fontWeight: "800",
    marginBottom: 8,
    color: "#1e293b",
  },

  modalMeta: {
    fontSize: 14,
    color: "#475569",
    marginVertical: 2,
  },

  modalDesc: {
    fontSize: 15,
    color: "#334155",
    marginVertical: 12,
    lineHeight: 20,
  },

  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 15,
    justifyContent: "space-between",
  },

  statusLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1e293b",
  },

  picker: {
    height: 40,
    width: 170,
  },

  closeBtn: {
    flexDirection: "row",
    backgroundColor: "#0b5cff",
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 20,
  },

  closeText: {
    color: "#fff",
    fontWeight: "700",
    marginLeft: 6,
  },

  backBtn: {
    backgroundColor: "#0b5cff",
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 18,
  },

  backBtnText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 15,
  },

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
