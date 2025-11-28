import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import axios from "axios";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

export default function AdminComplaints() {
  const router = useRouter();
  const BACKEND = "http://10.49.102.21:5000";

  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchComplaints = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${BACKEND}/api/admin/complaints`);
      setComplaints(res.data || []);
    } catch (err) {
      console.error("❌ Error:", err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, []);

  return (
    <ScrollView style={styles.page} contentContainerStyle={{ padding: 16 }}>
      <View style={styles.headerRow}>
        <Text style={styles.header}>📋 Student Complaints</Text>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#4f46e5" />
      ) : complaints.length === 0 ? (
        <Text style={styles.empty}>No complaints found.</Text>
      ) : (
        <View style={styles.grid}>
          {complaints.map((item) => (
            <View key={item.id} style={styles.card}>
              {/* Top Section: Student Basic Info */}
              <View style={styles.topBox}>
                <Ionicons
                  name="person-circle-outline"
                  size={38}
                  color="#4f46e5"
                />

                <View style={{ marginLeft: 8 }}>
                  <Text style={styles.name}>{item.student_name}</Text>
                  <Text style={styles.email}>{item.student_email}</Text>
                  <Text style={styles.subText}>USN: {item.usn || "—"}</Text>
                  <Text style={styles.subText}>
                    Room: {item.room_no || "—"}
                  </Text>
                </View>
              </View>

              {/* Complaint Details */}
              <View style={styles.detailsBox}>
                <Text style={styles.title}>{item.title}</Text>
                <Text style={styles.desc} numberOfLines={4}>
                  {item.description}
                </Text>

                <Text style={styles.meta}>
                  Submitted:{" "}
                  {new Date(item.created_at).toLocaleDateString("en-IN", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })}
                </Text>

                <Text style={styles.meta}>
                  Updated:{" "}
                  {item.updated_at
                    ? new Date(item.updated_at).toLocaleDateString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })
                    : "—"}
                </Text>

                <View
                  style={[
                    styles.statusBox,
                    item.status === "resolved"
                      ? styles.resolved
                      : item.status === "in-progress"
                      ? styles.inProgress
                      : styles.pending,
                  ]}
                >
                  <Text style={styles.statusText}>
                    {item.status.toUpperCase()}
                  </Text>
                </View>
              </View>
            </View>
          ))}
        </View>
      )}

      <TouchableOpacity
        style={styles.backBtn}
        onPress={() => router.push("/admin-dashboard")}
      >
        <Text style={styles.backBtnText}>← Back to Dashboard</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

/* -------------------------- STYLES -------------------------- */

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: "#eef2ff",
  },

  headerRow: {
    alignItems: "center",
    marginBottom: 16,
  },

  header: {
    fontSize: 22,
    fontWeight: "800",
    color: "#1e293b",
  },

  /* GRID: 3 Cards Per Row (Auto Wrap) */
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },

  card: {
    width: "32%", // 3 in a row
    backgroundColor: "#fff",
    borderRadius: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    padding: 12,
    elevation: 2,
  },

  /* TOP BOX */
  topBox: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
  },

  name: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0f172a",
  },

  email: {
    fontSize: 12.5,
    color: "#4b5563",
  },

  subText: {
    fontSize: 12,
    color: "#64748b",
  },

  /* COMPLAINT DETAILS */
  detailsBox: {
    marginTop: 4,
  },

  title: {
    fontSize: 14.5,
    fontWeight: "700",
    color: "#1e293b",
    marginBottom: 4,
  },

  desc: {
    color: "#475569",
    fontSize: 12.5,
    marginBottom: 6,
  },

  meta: {
    fontSize: 11.5,
    color: "#6b7280",
    marginTop: 2,
  },

  /* STATUS BADGE */
  statusBox: {
    marginTop: 10,
    alignSelf: "flex-start",
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  statusText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 11,
  },

  pending: { backgroundColor: "#f87171" },
  inProgress: { backgroundColor: "#facc15" },
  resolved: { backgroundColor: "#4ade80" },

  empty: {
    textAlign: "center",
    marginTop: 40,
    color: "#64748b",
    fontStyle: "italic",
  },

  backBtn: {
    marginTop: 20,
    backgroundColor: "#4f46e5",
    padding: 12,
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 20,
  },

  backBtnText: {
    color: "#fff",
    fontWeight: "700",
  },
});
