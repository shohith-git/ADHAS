// adhas/frontend/app/student/attendance.jsx

import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
} from "react-native";
import axios from "axios";
import { Calendar } from "react-native-calendars";
import { useRouter } from "expo-router";

/* ----------------------------------------------
   SIMPLE JWT PAYLOAD DECODER (no jwt-decode needed)
----------------------------------------------- */
function decodeJwtPayload(token) {
  try {
    if (!token) return null;
    const parts = token.split(".");
    if (parts.length !== 3) return null;

    const payload = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = payload + "=".repeat((4 - (payload.length % 4)) % 4);
    const decoded = atob(padded);

    return JSON.parse(decoded);
  } catch {
    return null;
  }
}

export default function StudentAttendance() {
  const router = useRouter();
  const BACKEND = "http://172.29.206.21:5000";

  const [records, setRecords] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [loading, setLoading] = useState(false);

  const [currentMonth, setCurrentMonth] = useState(
    new Date().toISOString().slice(0, 7)
  );

  /* ----------------------------------------------
     GET STUDENT ID FROM JWT
  ----------------------------------------------- */
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;

  let student_id = null;
  if (token) {
    const payload = decodeJwtPayload(token);
    if (payload && payload.id) student_id = payload.id;
  }

  /* ----------------------------------------------
     LOAD ATTENDANCE
  ----------------------------------------------- */
  const loadAttendance = async () => {
    if (!student_id) return;

    try {
      setLoading(true);
      setRecords([]);

      const res = await axios.get(
        `${BACKEND}/api/attendance/student/${student_id}`,
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        }
      );

      setRecords(res.data || []);
    } catch (err) {
      console.log("Attendance Error:", err?.response?.data || err);
      Alert.alert("Error", "Unable to load attendance records.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAttendance();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentMonth]);

  /* ----------------------------------------------
     CALENDAR MARKING (Present=Green, Absent=Red)
  ----------------------------------------------- */
  const markedDates = {};

  records.forEach((r) => {
    if (!r?.date) return;

    if (r.method === "Present") {
      markedDates[r.date] = {
        selected: true,
        selectedColor: "#16a34a",
        selectedTextColor: "#ffffff",
      };
    } else if (r.method === "Absent") {
      markedDates[r.date] = {
        selected: true,
        selectedColor: "#dc2626",
        selectedTextColor: "#ffffff",
      };
    }
  });

  if (selectedDate) {
    markedDates[selectedDate] = {
      ...(markedDates[selectedDate] || {}),
      selected: true,
      selectedColor: "#0b5cff",
      selectedTextColor: "#ffffff",
    };
  }

  /* ----------------------------------------------
     DATE SELECT
  ----------------------------------------------- */
  const onPressDate = (day) => {
    const date = day.dateString;
    setSelectedDate(date);
    const rec = records.find((r) => r.date === date);
    setSelectedRecord(rec || null);
  };

  /* ----------------------------------------------
     MONTH SUMMARY (Correct Logic)
  ----------------------------------------------- */
  const monthlyRecords = records.filter((r) =>
    r.date?.startsWith(currentMonth)
  );

  const presentCount = monthlyRecords.filter(
    (r) => r.method === "Present"
  ).length;

  const absentCount = monthlyRecords.filter(
    (r) => r.method === "Absent"
  ).length;

  const total = presentCount + absentCount;

  const percentage = total === 0 ? 0 : Math.round((presentCount / total) * 100);

  /* ----------------------------------------------
     UI
  ----------------------------------------------- */
  return (
    <ScrollView style={styles.page} contentContainerStyle={{ padding: 18 }}>
      <Text style={styles.header}>📅 My Attendance</Text>

      {/* CALENDAR */}
      <View style={styles.card}>
        <Calendar
          onDayPress={onPressDate}
          onMonthChange={(m) => {
            const newMonth = `${m.year}-${String(m.month).padStart(2, "0")}`;
            setCurrentMonth(newMonth);
          }}
          markedDates={markedDates}
          theme={{
            todayTextColor: "#16a34a",
            arrowColor: "#0b5cff",
          }}
          style={styles.calendar}
        />
      </View>

      {/* SELECTED DATE DETAILS */}
      <View style={styles.card}>
        {loading ? (
          <ActivityIndicator color="#0b5cff" />
        ) : selectedRecord ? (
          <>
            <Text style={styles.dateTitle}>
              {new Date(selectedRecord.date).toDateString()}
            </Text>

            <Text style={styles.meta}>🕒 Time: {selectedRecord.time}</Text>

            <View
              style={[
                styles.statusBadge,
                selectedRecord.method === "Present"
                  ? styles.present
                  : styles.absent,
              ]}
            >
              <Text style={styles.statusText}>
                {selectedRecord.method.toUpperCase()}
              </Text>
            </View>
          </>
        ) : (
          <Text style={styles.empty}>
            Tap a date on the calendar to see details
          </Text>
        )}
      </View>

      {/* MONTH SUMMARY */}
      <View style={styles.card}>
        <Text style={styles.summaryTitle}>📊 {currentMonth} Summary</Text>

        <View style={styles.summaryRow}>
          <View style={[styles.summaryBox, { backgroundColor: "#e6ffe6" }]}>
            <Text style={styles.sumLabel}>Present</Text>
            <Text style={styles.sumNum}>{presentCount}</Text>
          </View>

          <View style={[styles.summaryBox, { backgroundColor: "#ffe6e6" }]}>
            <Text style={styles.sumLabel}>Absent</Text>
            <Text style={styles.sumNum}>{absentCount}</Text>
          </View>

          <View style={[styles.summaryBox, { backgroundColor: "#e6f0ff" }]}>
            <Text style={styles.sumLabel}>Attendance %</Text>
            <Text style={styles.sumNum}>{percentage}%</Text>
          </View>
        </View>
      </View>

      {/* BACK */}
      <TouchableOpacity
        style={styles.backBtn}
        onPress={() => router.push("/student-dashboard")}
      >
        <Text style={styles.backText}>← Back to Dashboard</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

/* ----------------------------------------------
   STYLES
----------------------------------------------- */
const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: "#f8fafc" },

  header: {
    fontSize: 24,
    fontWeight: "800",
    color: "#0b5cff",
    marginBottom: 14,
    textAlign: "center",
  },

  card: {
    backgroundColor: "#ffffff",
    borderRadius: 14,
    padding: 16,
    marginBottom: 18,
    shadowColor: "#00000015",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 5,
  },

  calendar: { borderRadius: 12 },

  dateTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0f172a",
    marginBottom: 8,
  },

  meta: { fontSize: 15, color: "#4b5563", marginBottom: 10 },

  statusBadge: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignSelf: "flex-start",
  },

  statusText: { fontSize: 13, fontWeight: "700", color: "#fff" },

  present: { backgroundColor: "#16a34a" },
  absent: { backgroundColor: "#dc2626" },

  empty: {
    color: "#9ca3af",
    textAlign: "center",
    fontSize: 14,
  },

  summaryTitle: {
    fontSize: 18,
    fontWeight: "800",
    marginBottom: 12,
    color: "#0f172a",
  },

  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },

  summaryBox: {
    width: "32%",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },

  sumLabel: { fontSize: 14, color: "#6b7280" },
  sumNum: {
    fontSize: 22,
    fontWeight: "800",
    marginTop: 4,
    color: "#0f172a",
  },

  backBtn: {
    backgroundColor: "#0b5cff",
    padding: 12,
    borderRadius: 10,
    marginTop: 20,
    alignItems: "center",
  },

  backText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 15,
  },
});
