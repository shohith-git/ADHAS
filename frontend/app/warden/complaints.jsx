import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Picker,
  Alert,
} from "react-native";
import axios from "axios";
import { router } from "expo-router";

export default function WardenComplaints() {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const BACKEND = "http://10.196.39.21:5000"; // ✅ update if IP changes
  const token =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6Miwicm9sZSI6IndhcmRlbiIsImNvbGxlZ2UiOiJjaXRfbmMuZWR1LmluIiwiaWF0IjoxNzYxNjY2MjIyLCJleHAiOjE3NjE2ODc4MjJ9.W4i9fRBzi0KOADQpbvscoGc57unD5PztUVdiXk3R51c";

  // Fetch complaints
  const fetchComplaints = async () => {
    try {
      const res = await axios.get(`${BACKEND}/api/complaints`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setComplaints(res.data);
    } catch (err) {
      console.error("Error fetching complaints:", err);
      setError("Failed to load complaints. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, []);

  // Update complaint status
  const updateStatus = async (id, newStatus) => {
    try {
      await axios.put(
        `${BACKEND}/api/complaints/${id}/status`,
        { status: newStatus },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      Alert.alert("✅ Success", `Status updated to ${newStatus}`);
      fetchComplaints(); // refresh list
    } catch (err) {
      console.error("Error updating status:", err.response?.data || err);
      Alert.alert("❌ Error", "Failed to update complaint status");
    }
  };

  // Color styling for status
  const getStatusColor = (status) => {
    switch (status) {
      case "resolved":
        return { backgroundColor: "#bbf7d0", color: "#065f46" };
      case "in-progress":
        return { backgroundColor: "#fde68a", color: "#92400e" };
      default:
        return { backgroundColor: "#fecaca", color: "#991b1b" };
    }
  };

  if (loading)
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#0b5cff" />
        <Text style={{ marginTop: 10 }}>Loading complaints...</Text>
      </View>
    );

  if (error)
    return (
      <View style={styles.center}>
        <Text style={{ color: "red" }}>{error}</Text>
      </View>
    );

  return (
    <ScrollView style={styles.page} contentContainerStyle={{ padding: 20 }}>
      <Text style={styles.title}>📋 Complaints (Warden View)</Text>

      {complaints.length === 0 ? (
        <Text style={{ color: "#64748b" }}>No complaints available.</Text>
      ) : (
        complaints.map((c) => {
          const style = getStatusColor(c.status);
          return (
            <View key={c.id} style={styles.card}>
              <Text style={styles.cardTitle}>{c.title}</Text>
              <Text style={styles.meta}>
                {c.student_name} ({c.student_email})
              </Text>
              <Text style={styles.desc}>{c.description}</Text>

              {/* Status dropdown */}
              <View style={styles.statusRow}>
                <Text
                  style={[
                    styles.statusText,
                    {
                      backgroundColor: style.backgroundColor,
                      color: style.color,
                    },
                  ]}
                >
                  {c.status.toUpperCase()}
                </Text>

                <Picker
                  selectedValue={c.status}
                  style={styles.picker}
                  onValueChange={(newStatus) => updateStatus(c.id, newStatus)}
                >
                  <Picker.Item label="Pending" value="pending" />
                  <Picker.Item label="In Progress" value="in-progress" />
                  <Picker.Item label="Resolved" value="resolved" />
                </Picker>
              </View>
            </View>
          );
        })
      )}

      <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
        <Text style={styles.backBtnText}>← Back to Dashboard</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { backgroundColor: "#f8fafc", flex: 1 },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#0f172a",
    marginBottom: 16,
  },
  card: {
    backgroundColor: "#fff",
    padding: 14,
    marginBottom: 14,
    borderRadius: 10,
    shadowColor: "#00000011",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
  },
  cardTitle: { fontWeight: "700", fontSize: 16, color: "#0f172a" },
  meta: { color: "#64748b", fontSize: 13, marginVertical: 4 },
  desc: { color: "#334155", fontSize: 14, marginBottom: 10 },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  statusText: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    fontWeight: "600",
    fontSize: 13,
  },
  picker: {
    height: 35,
    width: 140,
    borderWidth: 1,
    borderColor: "#ccc",
  },
  backBtn: {
    marginTop: 20,
    backgroundColor: "#0b5cff",
    padding: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  backBtnText: { color: "#fff", fontWeight: "700" },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 60,
  },
});
