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

export default function AdminComplaints() {
  const router = useRouter();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(false);

  const BACKEND = "http://10.49.102.21:5000";

  // 🟢 Fetch all complaints
  const fetchComplaints = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${BACKEND}/api/admin/complaints`);
      setComplaints(res.data);
    } catch (err) {
      console.error("❌ Error fetching complaints:", err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, []);

  return (
    <ScrollView style={styles.page} contentContainerStyle={{ padding: 20 }}>
      <Text style={styles.header}>📋 Student Complaints</Text>

      {loading ? (
        <ActivityIndicator size="large" color="#0b5cff" />
      ) : complaints.length === 0 ? (
        <Text style={{ textAlign: "center", color: "#64748b" }}>
          No complaints found.
        </Text>
      ) : (
        complaints.map((item) => (
          <View key={item.id} style={styles.card}>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.desc}>{item.description}</Text>

            <View style={styles.infoBox}>
              <Text style={styles.meta}>
                👤 {item.student_name || "Unknown Student"}
              </Text>
              <Text style={styles.meta}>📧 {item.student_email}</Text>
              <Text style={styles.meta}>
                🕓{" "}
                {new Date(item.created_at).toLocaleDateString("en-IN", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })}
              </Text>
            </View>

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
              <Text style={styles.statusText}>{item.status.toUpperCase()}</Text>
            </View>
          </View>
        ))
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

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: "#f8fafc" },
  header: {
    fontSize: 22,
    fontWeight: "700",
    color: "#0f172a",
    marginBottom: 20,
    textAlign: "center",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 14,
    marginBottom: 14,
    boxShadow: "0 2px 3px rgba(0,0,0,0.08)",
  },
  title: { fontSize: 16, fontWeight: "700", color: "#0f172a" },
  desc: { fontSize: 14, color: "#334155", marginVertical: 6 },
  infoBox: { marginBottom: 6 },
  meta: { color: "#64748b", fontSize: 13 },
  statusBox: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontWeight: "700",
    fontSize: 12,
    color: "#fff",
    textTransform: "uppercase",
  },
  pending: { backgroundColor: "#f87171" },
  inProgress: { backgroundColor: "#facc15" },
  resolved: { backgroundColor: "#4ade80" },
  backBtn: {
    marginTop: 20,
    backgroundColor: "#0b5cff",
    padding: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  backBtnText: { color: "#fff", fontWeight: "700" },
});
