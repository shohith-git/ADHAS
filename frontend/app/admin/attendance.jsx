import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TextInput,
  ActivityIndicator,
  TouchableOpacity,
  StyleSheet,
  Animated,
} from "react-native";
import axios from "axios";
import { Calendar } from "react-native-calendars";
import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

export default function AttendanceDashboard() {
  const router = useRouter();

  const [selectedDate, setSelectedDate] = useState(null);
  const [presentList, setPresentList] = useState([]);
  const [absentList, setAbsentList] = useState([]);
  const [summary, setSummary] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  const [toastMsg, setToastMsg] = useState("");
  const toastAnim = React.useRef(new Animated.Value(0)).current;

  const BACKEND = "http://10.49.102.21:5000";
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;

  const today = new Date().toISOString().split("T")[0];

  /* ---------------- TOAST ---------------- */
  const showToast = (msg = "", ms = 1500) => {
    if (!msg) return;
    setToastMsg(msg);

    Animated.timing(toastAnim, {
      toValue: 1,
      duration: 150,
      useNativeDriver: true,
    }).start();

    setTimeout(() => {
      Animated.timing(toastAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }).start();
    }, ms);
  };

  /* ---------------- LOAD SUMMARY ---------------- */
  const loadSummary = async () => {
    try {
      const res = await axios.get(`${BACKEND}/api/attendance/summary`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSummary(res.data || []);
    } catch (err) {
      showToast("Error loading summary");
    }
  };

  /* ---------------- LOAD FOR A DATE ---------------- */
  const loadDate = async (date) => {
    setLoading(true);
    try {
      const res = await axios.get(`${BACKEND}/api/attendance/date/${date}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = res.data || [];
      setPresentList(data.filter((d) => d.method === "Present"));
      setAbsentList(data.filter((d) => d.method === "Absent"));
    } catch (err) {
      showToast("Error loading attendance");
    }
    setLoading(false);
  };

  const onDayPress = (day) => {
    const date = day.dateString;

    setSelectedDate(date);
    loadDate(date);

    const readable = new Date(date).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

    showToast(`Showing attendance for ${readable}`);
  };

  useEffect(() => {
    setSelectedDate(today);
    loadDate(today);
    loadSummary();
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (selectedDate) loadDate(selectedDate);
      loadSummary();
    }, [selectedDate])
  );

  /* ---------------- SEARCH FILTER ---------------- */
  const filter = (list) => {
    const q = search.trim().toLowerCase();
    if (!q) return list;

    return list.filter((s) => {
      const name = (s.student_name || "").toLowerCase();
      const usn = (s.usn || "").toLowerCase();
      const room = (s.room_no || "").toString().toLowerCase();
      const hostel = (s.hostel_id || "").toString().toLowerCase();

      return (
        name.includes(q) ||
        usn.includes(q) ||
        room.includes(q) ||
        hostel.includes(q)
      );
    });
  };

  /* ---------------- MARK CALENDAR ---------------- */
  const marked = {};

  summary.forEach((r) => {
    marked[r.date] = {
      marked: true,
      dotColor: r.total_absent > 0 ? "#ef4444" : "#10b981",
    };
  });

  marked[today] = marked[today] || { marked: true, dotColor: "#10b981" };

  if (selectedDate) {
    marked[selectedDate] = {
      ...(marked[selectedDate] || {}),
      selected: true,
      selectedColor: "#4f46e5",
    };
  }

  /* ---------------- UI ---------------- */
  return (
    <View style={styles.page}>
      {/* Toast */}
      <Animated.View
        pointerEvents="none"
        style={[
          styles.toast,
          {
            opacity: toastAnim,
            transform: [
              {
                translateY: toastAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-12, 0],
                }),
              },
            ],
          },
        ]}
      >
        <Text style={styles.toastText}>{toastMsg}</Text>
      </Animated.View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16, paddingBottom: 140 }}
      >
        {/* Header */}
        <View style={styles.headerRow}>
          <Text style={styles.header}>📅 Attendance Overview</Text>

          <TouchableOpacity
            style={styles.refreshBtn}
            onPress={() => {
              loadDate(selectedDate);
              loadSummary();

              const now = new Date();
              const timeString = now.toLocaleTimeString("en-IN", {
                hour: "2-digit",
                minute: "2-digit",
              });

              showToast(`Refreshed at ${timeString}`);
            }}
          >
            <Ionicons name="refresh-outline" size={18} color="#4f46e5" />
            <Text style={styles.refreshText}>Refresh</Text>
          </TouchableOpacity>
        </View>

        {/* Calendar */}
        <View style={styles.calendarCard}>
          <Calendar
            onDayPress={onDayPress}
            markedDates={marked}
            theme={{
              todayTextColor: "#10b981",
              selectedDayBackgroundColor: "#4f46e5",
              arrowColor: "#4f46e5",
            }}
            style={{ borderRadius: 10 }}
          />
        </View>

        {/* Summary Cards */}
        <View style={styles.summaryRow}>
          <View style={[styles.sumCard, { backgroundColor: "#e0fce4" }]}>
            <Ionicons name="checkmark-circle" size={22} color="#16a34a" />
            <View>
              <Text style={styles.sumLabel}>Present</Text>
              <Text style={styles.sumNum}>{presentList.length}</Text>
            </View>
          </View>

          <View style={[styles.sumCard, { backgroundColor: "#ffe2e2" }]}>
            <Ionicons name="close-circle" size={22} color="#dc2626" />
            <View>
              <Text style={styles.sumLabel}>Absent</Text>
              <Text style={styles.sumNum}>{absentList.length}</Text>
            </View>
          </View>
        </View>

        {/* Search */}
        <TextInput
          placeholder="Search by name, USN, room, hostel ID..."
          style={styles.search}
          value={search}
          onChangeText={setSearch}
        />

        {/* Date Display */}
        <Text style={styles.dateTitle}>
          {new Date(selectedDate).toDateString()}
        </Text>

        {/* PRESENT LIST */}
        <Text style={styles.sectionTitle}>🟢 Present Students</Text>
        {loading ? (
          <ActivityIndicator color="#4f46e5" />
        ) : filter(presentList).length === 0 ? (
          <Text style={styles.emptyText}>No present students</Text>
        ) : (
          filter(presentList).map((p) => (
            <View key={p.student_id} style={styles.studentCard}>
              <Text style={styles.studentName}>{p.student_name}</Text>
              <Text style={styles.studentMeta}>
                Hostel {p.hostel_id} • Room {p.room_no} • {p.usn}
              </Text>
              <Text style={[styles.tag, styles.tagPresent]}>Present</Text>
            </View>
          ))
        )}

        {/* ABSENT LIST */}
        <Text style={styles.sectionTitle}>🔴 Absent Students</Text>
        {loading ? (
          <ActivityIndicator color="#4f46e5" />
        ) : filter(absentList).length === 0 ? (
          <Text style={styles.emptyText}>No absent students</Text>
        ) : (
          filter(absentList).map((a) => (
            <View key={a.student_id} style={styles.studentCard}>
              <Text style={styles.studentName}>{a.student_name}</Text>
              <Text style={styles.studentMeta}>
                Hostel {a.hostel_id} • Room {a.room_no} • {a.usn}
              </Text>
              <Text style={[styles.tag, styles.tagAbsent]}>Absent</Text>
            </View>
          ))
        )}

        {/* Back Button */}
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.push("/admin-dashboard")}
        >
          <Ionicons name="arrow-back" size={18} color="#fff" />
          <Text style={styles.backText}>Back to Dashboard</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

/* ---------------- STYLES ---------------- */

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: "#eef2ff" },

  toast: {
    position: "absolute",
    top: 12,
    left: "50%",
    marginLeft: -150,
    width: 300,
    padding: 10,
    backgroundColor: "#ffffff",
    borderRadius: 10,
    elevation: 4,
    zIndex: 9999,
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 8,
  },
  toastText: { fontWeight: "700", textAlign: "center", color: "#1e293b" },

  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  header: { fontSize: 22, fontWeight: "800", color: "#4f46e5" },

  refreshBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#e0e7ff",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },

  refreshText: {
    color: "#4f46e5",
    fontWeight: "700",
    marginLeft: 4,
  },

  calendarCard: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 12,
    marginBottom: 14,
    elevation: 3,
  },

  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },

  sumCard: {
    width: "48%",
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 14,
    backgroundColor: "#fff",
    borderRadius: 12,
    elevation: 3,
  },

  sumLabel: { color: "#4b5563", fontSize: 13 },
  sumNum: { fontSize: 20, fontWeight: "800", color: "#111827" },

  search: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: "#d4d4d8",
    marginBottom: 16,
    fontSize: 14,
  },

  dateTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1e293b",
    marginBottom: 10,
  },

  sectionTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#4f46e5",
    marginTop: 12,
    marginBottom: 10,
  },

  studentCard: {
    backgroundColor: "#fff",
    padding: 14,
    borderRadius: 10,
    elevation: 2,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },

  studentName: { fontSize: 15, fontWeight: "700", color: "#111827" },

  studentMeta: { marginTop: 4, fontSize: 12.5, color: "#64748b" },

  tag: {
    marginTop: 8,
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderRadius: 6,
    fontWeight: "700",
    fontSize: 12,
    alignSelf: "flex-start",
    color: "#fff",
  },

  tagPresent: { backgroundColor: "#16a34a" },
  tagAbsent: { backgroundColor: "#dc2626" },

  emptyText: { color: "#94a3b8", fontStyle: "italic", marginBottom: 10 },

  backBtn: {
    marginTop: 25,
    backgroundColor: "#4f46e5",
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
  },

  backText: { color: "#fff", fontSize: 15, fontWeight: "700", marginLeft: 6 },
});
