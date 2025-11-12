import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import axios from "axios";
import { useRouter } from "expo-router";

export default function AttendanceLogs() {
  const [summary, setSummary] = useState([]);
  const [details, setDetails] = useState({});
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const BACKEND = "http://10.69.232.21:5000";
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;

  // Fetch summary (dates + counts)
  const fetchSummary = async () => {
    try {
      const res = await axios.get(`${BACKEND}/api/attendance/summary`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSummary(res.data || []);
    } catch (err) {
      console.error("❌ Error loading attendance summary:", err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch student details for a specific date
  const fetchDetails = async (date) => {
    try {
      const res = await axios.get(`${BACKEND}/api/attendance/date/${date}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setDetails((prev) => ({ ...prev, [date]: res.data || [] }));
    } catch (err) {
      console.error(`❌ Error loading details for ${date}:`, err);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, []);

  if (loading)
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text>Loading attendance logs...</Text>
      </View>
    );

  return (
    <ScrollView style={styles.page} contentContainerStyle={{ padding: 16 }}>
      <Text style={styles.header}>📋 Attendance Logs</Text>

      {summary.length === 0 ? (
        <Text style={styles.empty}>No attendance records found.</Text>
      ) : (
        summary.map((s) => {
          const date = s.date.split("T")[0];
          const dayDetails = details[date];
          const isOpen = !!dayDetails;

          return (
            <View key={date} style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.dateText}>
                  {new Date(date).toLocaleDateString("en-IN", {
                    weekday: "long",
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </Text>
                <Text style={styles.counts}>
                  ✅ Present: {s.total_present} ❌ Absent: {s.total_absent}
                </Text>
              </View>

              <TouchableOpacity
                style={[styles.btn, isOpen && styles.btnOpen]}
                onPress={() => {
                  if (!dayDetails) fetchDetails(date);
                  else setDetails((prev) => ({ ...prev, [date]: null }));
                }}
              >
                <Text style={[styles.btnText, isOpen && { color: "#fff" }]}>
                  {isOpen ? "Hide Details" : "View Details"}
                </Text>
              </TouchableOpacity>

              {isOpen && (
                <View style={styles.detailsBox}>
                  <Text style={styles.sectionHeader}>🟢 Present Students</Text>
                  {dayDetails.filter((d) => d.method === "Present").length ===
                  0 ? (
                    <Text style={styles.emptyRow}>No Present Students</Text>
                  ) : (
                    dayDetails
                      .filter((d) => d.method === "Present")
                      .map((p) => (
                        <Text key={p.student_id} style={styles.entry}>
                          {p.student_name} — Hostel {p.hostel_id || "—"} — Room{" "}
                          {p.room_no || "N/A"}
                        </Text>
                      ))
                  )}

                  <Text style={[styles.sectionHeader, { marginTop: 10 }]}>
                    🔴 Absent Students
                  </Text>
                  {dayDetails.filter((d) => d.method === "Absent").length ===
                  0 ? (
                    <Text style={styles.emptyRow}>No Absent Students</Text>
                  ) : (
                    dayDetails
                      .filter((d) => d.method === "Absent")
                      .map((a) => (
                        <Text key={a.student_id} style={styles.entry}>
                          {a.student_name} — Hostel {a.hostel_id || "—"} — Room{" "}
                          {a.room_no || "N/A"}
                        </Text>
                      ))
                  )}
                </View>
              )}
            </View>
          );
        })
      )}

      <TouchableOpacity
        style={styles.backBtn}
        onPress={() => router.push("/warden/attendance")}
      >
        <Text style={styles.backText}>← Back to Dashboard</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: "#f9fafb" },
  header: {
    fontSize: 24,
    fontWeight: "700",
    color: "#0b5cff",
    marginBottom: 15,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  dateText: { fontWeight: "700", color: "#0f172a" },
  counts: { color: "#64748b", fontSize: 13 },
  btn: {
    backgroundColor: "#e0f2fe",
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
    alignSelf: "flex-start",
    marginTop: 8,
  },
  btnOpen: { backgroundColor: "#0b5cff" },
  btnText: { fontWeight: "700", color: "#0b5cff" },
  detailsBox: {
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
    paddingTop: 8,
  },
  sectionHeader: { fontWeight: "700", color: "#0b5cff", marginBottom: 4 },
  entry: { color: "#0f172a", marginBottom: 3, fontSize: 13.5 },
  empty: { color: "#64748b", textAlign: "center", marginTop: 30 },
  emptyRow: { color: "#94a3b8", fontSize: 13 },
  backBtn: {
    backgroundColor: "#0b5cff",
    padding: 12,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 10,
    marginBottom: 20,
  },
  backText: { color: "#fff", fontWeight: "700" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
});
