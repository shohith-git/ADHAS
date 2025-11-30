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

  const [toastMsg, setToastMsg] = useState("");
  const toastAnim = React.useRef(new Animated.Value(0)).current;

  const BACKEND = "http://10.49.102.21:5000";
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
    } catch {
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
    } catch {
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

  const q = search.trim().toLowerCase();
  const filter = (list) => {
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
      dotColor: r.total_absent > 0 ? "#ef4444" : "#22c55e",
    };
  });

  if (!marked[today]) {
    marked[today] = { marked: true, dotColor: "#22c55e" };
  }

  if (selectedDate) {
    marked[selectedDate] = {
      ...(marked[selectedDate] || {}),
      selected: true,
      selectedColor: "#1d4ed8",
    };
  }

  /* ---------------------- UI ---------------------- */
  return (
    <View style={styles.page}>
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

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16, paddingBottom: 140 }}
      >
        {/* HEADER */}
        <View style={styles.headerRow}>
          <Text style={styles.header}>Attendance Dashboard</Text>

          <TouchableOpacity
            style={styles.refreshBtn}
            onPress={() => {
              loadDate(selectedDate);
              loadSummary();
              const t = new Date();
              showToast(
                `Refreshed at ${t.getHours()}:${String(t.getMinutes()).padStart(
                  2,
                  "0"
                )}`
              );
            }}
          >
            <Text style={styles.refreshText}>⟳ Refresh</Text>
          </TouchableOpacity>
        </View>

        {/* CALENDAR CARD */}
        <View style={styles.calendarCard}>
          <Calendar
            onDayPress={onDayPress}
            markedDates={marked}
            theme={{
              todayTextColor: "#22c55e",
              selectedDayBackgroundColor: "#1d4ed8",
              arrowColor: "#1d4ed8",
            }}
            style={styles.calendar}
          />
        </View>

        {/* SUMMARY */}
        <View style={styles.summaryContainer}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Present</Text>
            <Text style={styles.summaryValue}>{presentList.length}</Text>
          </View>

          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Absent</Text>
            <Text style={styles.summaryValue}>{absentList.length}</Text>
          </View>
        </View>

        {/* SEARCH */}
        <TextInput
          placeholder="Search students by name, USN, room, hostel id..."
          style={styles.search}
          value={search}
          onChangeText={setSearch}
        />

        <Text style={styles.dateTitle}>
          {new Date(selectedDate).toDateString()}
        </Text>

        {/* PRESENT LIST */}
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
                Hostel {p.hostel_id} • Room {p.room_no} • {p.usn}
              </Text>
              <Text style={[styles.tag, styles.presentTag]}>Present</Text>
            </View>
          ))
        )}

        {/* ABSENT LIST */}
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
              <Text style={[styles.tag, styles.absentTag]}>Absent</Text>
            </View>
          ))
        )}

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

/* ---------------------- PREMIUM ADHAS UI ---------------------- */
const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: "#eef2ff",
  },

  /* TOAST */
  toast: {
    position: "absolute",
    top: 12,
    left: "50%",
    width: 330,
    marginLeft: -165,
    backgroundColor: "#ffffffea",
    padding: 12,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 6,
    zIndex: 9999,
  },
  toastText: { fontWeight: "700", color: "#0f172a" },

  /* HEADER */
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  header: {
    fontSize: 24,
    fontWeight: "900",
    color: "#1e3a8a",
  },

  refreshBtn: {
    backgroundColor: "#dbeafe",
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
  },
  refreshText: {
    fontWeight: "700",
    color: "#1d4ed8",
  },

  /* CALENDAR */
  calendarCard: {
    backgroundColor: "#fff",
    padding: 14,
    borderRadius: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#dbe4ff",
    shadowColor: "#1e3a8a",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 4,
  },
  calendar: {
    borderRadius: 10,
  },

  /* SUMMARY */
  summaryContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  summaryCard: {
    width: "48%",
    backgroundColor: "#fff",
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#dbe4ff",
    shadowColor: "#1e3a8a",
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
  },
  summaryLabel: {
    fontSize: 13,
    color: "#64748b",
  },
  summaryValue: {
    fontSize: 24,
    color: "#0f172a",
    fontWeight: "900",
    marginTop: 4,
  },

  /* SEARCH */
  search: {
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#dbe4ff",
    marginBottom: 12,
    fontSize: 15,
    color: "#0f172a",

    shadowColor: "#1e3a8a",
    shadowOpacity: 0.04,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },

  /* DATE HEADER */
  dateTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1e293b",
    marginBottom: 12,
  },

  /* SECTION */
  sectionTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#1e3a8a",
    marginTop: 10,
    marginBottom: 10,
  },

  /* STUDENT CARD */
  studentCard: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e0e7ff",

    shadowColor: "#1e3a8a",
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  studentName: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0f172a",
  },
  studentMeta: {
    marginTop: 4,
    color: "#64748b",
    fontSize: 13,
  },

  tag: {
    marginTop: 8,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 8,
    fontWeight: "800",
    fontSize: 12,
    alignSelf: "flex-start",
    color: "#fff",
  },
  presentTag: {
    backgroundColor: "#22c55e",
  },
  absentTag: {
    backgroundColor: "#ef4444",
  },

  empty: {
    color: "#94a3b8",
    fontStyle: "italic",
    marginBottom: 10,
  },

  /* BACK BUTTON */
  backBtn: {
    marginTop: 24,
    backgroundColor: "#1e3a8a",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    shadowColor: "#1e3a8a",
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 4,
  },
  backText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "800",
  },
});
