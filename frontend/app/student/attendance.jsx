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

/* ------------------------------
   SIMPLE JWT DECODE
------------------------------- */
function decodeJwtPayload(token) {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;

    const payload = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = payload + "=".repeat((4 - (payload.length % 4)) % 4);

    return JSON.parse(atob(padded));
  } catch {
    return null;
  }
}

export default function StudentAttendance() {
  const router = useRouter();
  const BACKEND = "http://10.49.102.21:5000";

  const [records, setRecords] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [loading, setLoading] = useState(false);

  const [currentMonth, setCurrentMonth] = useState(
    new Date().toISOString().slice(0, 7)
  );

  /* ------------------------------
     GET STUDENT ID
------------------------------- */
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const payload = token ? decodeJwtPayload(token) : null;
  const student_id = payload?.id || null;

  /* ------------------------------
     LOAD ATTENDANCE
------------------------------- */
  const loadAttendance = async () => {
    if (!student_id) return;

    try {
      setLoading(true);
      const res = await axios.get(
        `${BACKEND}/api/attendance/student/${student_id}`,
        { headers: token ? { Authorization: `Bearer ${token}` } : {} }
      );
      setRecords(res.data || []);
    } catch (err) {
      Alert.alert("Error", "Unable to load attendance.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAttendance();
  }, [currentMonth]);

  /* ------------------------------
     MARK DATES
------------------------------- */
  const markedDates = {};

  records.forEach((r) => {
    if (!r?.date) return;

    markedDates[r.date] = {
      selected: true,
      selectedColor: r.method === "Present" ? "#16a34a" : "#dc2626",
      selectedTextColor: "#ffffff",
    };
  });

  if (selectedDate) {
    markedDates[selectedDate] = {
      ...(markedDates[selectedDate] || {}),
      selected: true,
      selectedColor: "#2563eb",
      selectedTextColor: "#ffffff",
    };
  }

  /* ------------------------------
     SHOW RECORD FOR DATE
------------------------------- */
  const onPressDate = (day) => {
    const date = day.dateString;
    setSelectedDate(date);
    const rec = records.find((r) => r.date === date);
    setSelectedRecord(rec || null);
  };

  /* ------------------------------
     MONTH SUMMARY
------------------------------- */
  const monthly = records.filter((r) => r.date?.startsWith(currentMonth));
  const present = monthly.filter((r) => r.method === "Present").length;
  const absent = monthly.filter((r) => r.method === "Absent").length;
  const total = present + absent;

  const percent = total === 0 ? 0 : Math.round((present / total) * 100);

  /* ------------------------------
     UI
------------------------------- */
  return (
    <ScrollView style={styles.page} contentContainerStyle={{ padding: 18 }}>
      <Text style={styles.header}>📅 Attendance Overview</Text>

      {/* CALENDAR */}
      <View style={styles.card}>
        <Calendar
          onDayPress={onPressDate}
          onMonthChange={(m) =>
            setCurrentMonth(`${m.year}-${String(m.month).padStart(2, "0")}`)
          }
          markedDates={markedDates}
          theme={{
            todayTextColor: "#16a34a",
            arrowColor: "#2563eb",
            textDayFontSize: 15,
            textMonthFontSize: 17,
            textMonthFontWeight: "800",
          }}
          style={styles.calendar}
        />
      </View>

      {/* SELECTED DATE CARD */}
      <View style={styles.card}>
        {loading ? (
          <ActivityIndicator color="#2563eb" />
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
          <Text style={styles.empty}>Tap a date to view details</Text>
        )}
      </View>

      {/* MONTH SUMMARY */}
      <View style={styles.card}>
        <Text style={styles.summaryTitle}>📊 {currentMonth} Summary</Text>

        <View style={styles.summaryRow}>
          <View style={[styles.summaryBox, { backgroundColor: "#e7ffe7" }]}>
            <Text style={styles.sumLabel}>Present</Text>
            <Text style={styles.sumNum}>{present}</Text>
          </View>

          <View style={[styles.summaryBox, { backgroundColor: "#ffe7e7" }]}>
            <Text style={styles.sumLabel}>Absent</Text>
            <Text style={styles.sumNum}>{absent}</Text>
          </View>

          <View style={[styles.summaryBox, { backgroundColor: "#e7f0ff" }]}>
            <Text style={styles.sumLabel}>Percentage</Text>
            <Text style={styles.sumNum}>{percent}%</Text>
          </View>
        </View>
      </View>

      {/* BACK BUTTON */}
      <TouchableOpacity
        style={styles.backBtn}
        onPress={() => router.push("/student-dashboard")}
      >
        <Text style={styles.backText}>← Back to Dashboard</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

/* ------------------------------
   STYLES
------------------------------- */
const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: "#eef4ff",
  },

  header: {
    fontSize: 24,
    fontWeight: "800",
    color: "#0f172a",
    marginBottom: 16,
    textAlign: "center",
  },

  card: {
    backgroundColor: "#ffffff",
    padding: 18,
    borderRadius: 16,
    marginBottom: 20,
    elevation: 3,
    shadowColor: "#00000020",
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },

  calendar: {
    borderRadius: 12,
  },

  dateTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 8,
    color: "#0f172a",
  },

  meta: {
    fontSize: 15,
    color: "#475569",
    marginBottom: 12,
  },

  statusBadge: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 8,
    alignSelf: "flex-start",
  },

  statusText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 13,
  },

  present: { backgroundColor: "#16a34a" },
  absent: { backgroundColor: "#dc2626" },

  empty: {
    color: "#9ca3af",
    textAlign: "center",
    fontStyle: "italic",
  },

  summaryTitle: {
    fontSize: 18,
    fontWeight: "800",
    marginBottom: 14,
    color: "#0f172a",
  },

  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },

  summaryBox: {
    width: "32%",
    padding: 18,
    borderRadius: 12,
    alignItems: "center",
  },

  sumLabel: {
    fontSize: 13,
    color: "#64748b",
  },

  sumNum: {
    fontSize: 22,
    marginTop: 6,
    fontWeight: "800",
    color: "#0f172a",
  },

  backBtn: {
    backgroundColor: "#2563eb",
    padding: 14,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 18,
    marginBottom: 40,
  },

  backText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700",
  },
});
