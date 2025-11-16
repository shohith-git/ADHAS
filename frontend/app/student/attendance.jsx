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
import { jwtDecode } from "jwt-decode";
import { Calendar } from "react-native-calendars";
import { useRouter } from "expo-router";

export default function StudentAttendance() {
  const router = useRouter();

  const BACKEND = "http://10.69.232.21:5000";

  const [records, setRecords] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [loading, setLoading] = useState(false);

  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;

  let student_id = null;
  if (token) {
    try {
      const decoded = jwtDecode(token);
      student_id = decoded.id;
    } catch {}
  }

  const loadAttendance = async () => {
    if (!student_id) return;

    try {
      setLoading(true);
      const res = await axios.get(
        `${BACKEND}/api/attendance/student/${student_id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
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
  }, []);

  /* ------------------ Calendar Marking ------------------ */

  const markedDates = {};

  records.forEach((r) => {
    const isPresent = r.method === "Present";

    markedDates[r.date] = {
      selected: true,
      selectedColor: isPresent ? "#16a34a" : "#dc2626", // green/red fill
      selectedTextColor: "#ffffff",
    };
  });

  if (selectedDate) {
    markedDates[selectedDate] = {
      ...(markedDates[selectedDate] || {}),
      selected: true,
      selectedColor: "#0b5cff",
      selectedTextColor: "#fff",
    };
  }

  /* ------------------ When Student Selects Date ------------------ */

  const onPressDate = (day) => {
    const date = day.dateString;
    setSelectedDate(date);
    const rec = records.find((r) => r.date === date);
    setSelectedRecord(rec || null);
  };

  /* ------------------ Render UI ------------------ */

  return (
    <ScrollView style={styles.page} contentContainerStyle={{ padding: 18 }}>
      <Text style={styles.header}>📅 My Attendance</Text>

      {/* CALENDAR */}
      <View style={styles.card}>
        <Calendar
          onDayPress={onPressDate}
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

            <Text style={styles.meta}>
              🕒 Time: {selectedRecord.time || "—"}
            </Text>

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
          <Text style={styles.empty}>Tap a date to view attendance</Text>
        )}
      </View>

      <TouchableOpacity
        style={styles.backBtn}
        onPress={() => router.push("/student-dashboard")}
      >
        <Text style={styles.backText}>← Back to Dashboard</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

/* ------------------ STYLES ------------------ */

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
