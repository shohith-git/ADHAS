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

export default function AttendanceDashboard() {
  const router = useRouter();

  const [selectedDate, setSelectedDate] = useState(null);
  const [presentList, setPresentList] = useState([]);
  const [absentList, setAbsentList] = useState([]);
  const [summary, setSummary] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  // Floating toast
  const [toastMsg, setToastMsg] = useState("");
  const toastAnim = React.useRef(new Animated.Value(0)).current;

  const BACKEND = "http://10.69.232.21:5000";
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;

  const today = new Date().toISOString().split("T")[0];

  /* ---------------------- TOAST ---------------------- */
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

  /* ---------------------- LOAD SUMMARY ---------------------- */
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

  /* ---------------------- LOAD DATE ---------------------- */
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

  /* ---------------------- SELECT DATE ---------------------- */
  const onDayPress = (day) => {
    const date = day.dateString;

    setSelectedDate(date);
    loadDate(date);

    // Toast A: Showing attendance for DD MMM YYYY
    const readable = new Date(date).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

    showToast(`Showing attendance for ${readable}`);
  };

  /* ---------------------- INITIAL ---------------------- */
  useEffect(() => {
    setSelectedDate(today);
    loadDate(today);
    loadSummary();
  }, []);

  /* ---------------------- FOCUS REFRESH ---------------------- */
  useFocusEffect(
    useCallback(() => {
      if (selectedDate) loadDate(selectedDate);
      loadSummary();
    }, [selectedDate])
  );

  /* ---------------------- SEARCH FILTER ---------------------- */
  const q = search.trim().toLowerCase();
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

  /* ---------------------- MARKED DATES ---------------------- */
  const marked = {};

  summary.forEach((r) => {
    marked[r.date] = {
      marked: true,
      dotColor: r.total_absent > 0 ? "#ef4444" : "#10b981",
    };
  });

  if (!marked[today]) {
    marked[today] = { marked: true, dotColor: "#10b981" };
  }

  if (selectedDate) {
    marked[selectedDate] = {
      ...(marked[selectedDate] || {}),
      selected: true,
      selectedColor: "#0b5cff",
    };
  }

  /* ---------------------- UI ---------------------- */
  return (
    <View style={{ flex: 1, backgroundColor: "#f8fafc" }}>
      {/* Floating Toast */}
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

      {/* SCROLLABLE PAGE */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16, paddingBottom: 140 }}
      >
        {/* HEADER */}
        <View style={styles.headerRow}>
          <Text style={styles.header}>📅 Attendance Dashboard</Text>

          <View style={{ flexDirection: "row" }}>
            {/* Refresh */}
            <TouchableOpacity
              style={styles.smallBtn}
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
              <Text style={styles.smallBtnText}>⟳ Refresh</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* CALENDAR */}
        <View style={styles.card}>
          <Calendar
            onDayPress={onDayPress}
            markedDates={marked}
            theme={{
              todayTextColor: "#10b981",
              selectedDayBackgroundColor: "#0b5cff",
              arrowColor: "#0b5cff",
            }}
            style={styles.calendar}
          />
        </View>

        {/* SUMMARY */}
        <View style={styles.summaryRow}>
          <View style={styles.summaryCard}>
            <Text style={styles.sumLabel}>Present</Text>
            <Text style={styles.sumNum}>
              {loading ? "—" : presentList.length}
            </Text>
          </View>

          <View style={styles.summaryCard}>
            <Text style={styles.sumLabel}>Absent</Text>
            <Text style={styles.sumNum}>
              {loading ? "—" : absentList.length}
            </Text>
          </View>
        </View>

        {/* SEARCH */}
        <TextInput
          placeholder="Search students by name, USN, room, hostel id."
          style={styles.search}
          value={search}
          onChangeText={setSearch}
        />

        {/* DATE HEADER */}
        <Text style={styles.dateTitle}>
          Attendance for{" "}
          <Text style={{ fontWeight: "800" }}>
            {new Date(selectedDate).toDateString()}
          </Text>
        </Text>

        {/* PRESENT */}
        <Text style={styles.sectionTitle}>🟢 Present Students</Text>
        {loading ? (
          <ActivityIndicator color="#2563eb" />
        ) : filter(presentList).length === 0 ? (
          <Text style={styles.empty}>No present students</Text>
        ) : (
          filter(presentList).map((p) => (
            <View key={p.student_id} style={styles.studentCard}>
              <Text style={styles.studentName}>{p.student_name}</Text>
              <Text style={styles.studentMeta}>
                Hostel id: {p.hostel_id} • Room: {p.room_no} • USN: {p.usn}
              </Text>
              <Text style={[styles.tag, styles.tagPresent]}>Present</Text>
            </View>
          ))
        )}

        {/* ABSENT */}
        <Text style={styles.sectionTitle}>🔴 Absent Students</Text>
        {loading ? (
          <ActivityIndicator color="#2563eb" />
        ) : filter(absentList).length === 0 ? (
          <Text style={styles.empty}>No absent students</Text>
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

        {/* BACK BUTTON AT BOTTOM */}
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.push("/warden/attendance")}
        >
          <Text style={styles.backText}>← Back to Attendance</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

/* ---------------------- STYLES ---------------------- */
const styles = StyleSheet.create({
  toast: {
    position: "absolute",
    top: 12,
    left: "50%",
    width: 330,
    marginLeft: -165,
    backgroundColor: "#fff",
    padding: 10,
    borderRadius: 10,
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 6,
    zIndex: 9999,
    alignItems: "center",
  },
  toastText: { color: "#0f172a", fontWeight: "700" },

  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  header: { fontSize: 22, fontWeight: "800", color: "#0b5cff" },

  smallBtn: {
    backgroundColor: "#e9efff",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  smallBtnText: { color: "#0b5cff", fontWeight: "700" },

  card: {
    backgroundColor: "#fff",
    padding: 10,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 4,
  },

  calendar: { borderRadius: 8 },

  summaryRow: { flexDirection: "row", justifyContent: "space-between" },

  summaryCard: {
    backgroundColor: "#fff",
    width: "48%",
    padding: 14,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
    marginBottom: 14,
  },

  sumLabel: { fontSize: 13, color: "#64748b" },
  sumNum: { fontSize: 22, fontWeight: "800", color: "#0f172a" },

  search: {
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#e6eefb",
    marginBottom: 14,
  },

  dateTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#0f172a",
    marginBottom: 10,
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0b5cff",
    marginBottom: 10,
    marginTop: 10,
  },

  studentCard: {
    backgroundColor: "#fff",
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#e6eefb",
    marginBottom: 10,
  },

  studentName: { fontSize: 15, fontWeight: "700" },
  studentMeta: { marginTop: 4, color: "#64748b", fontSize: 13 },

  tag: {
    marginTop: 8,
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderRadius: 8,
    color: "#fff",
    fontWeight: "700",
    fontSize: 12,
    alignSelf: "flex-start",
  },
  tagPresent: { backgroundColor: "#16a34a" },
  tagAbsent: { backgroundColor: "#ef4444" },

  empty: { color: "#94a3b8", fontStyle: "italic", marginBottom: 8 },

  backBtn: {
    marginTop: 25,
    backgroundColor: "#1e3a8a",
    padding: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  backText: { color: "#fff", fontWeight: "700", fontSize: 15 },
});
