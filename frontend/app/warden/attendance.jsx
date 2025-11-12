import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  TextInput,
} from "react-native";
import axios from "axios";
import { useRouter } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";

/**
 * FINAL STABLE ATTENDANCE PANEL
 * ✅ Search bar (Name/USN/Room)
 * ✅ Cross-platform notification (works on web)
 * ✅ Instant status update
 * ✅ Buttons freeze after marking
 */

export default function AttendancePanel() {
  const router = useRouter();
  const [students, setStudents] = useState([]);
  const [attendanceList, setAttendanceList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [disabledButtons, setDisabledButtons] = useState({});
  const [searchText, setSearchText] = useState("");
  const [message, setMessage] = useState(null); // for success banner

  const BACKEND = "http://10.69.232.21:5000";
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;

  const fetchData = async () => {
    setLoading(true);
    try {
      const [studentsRes, attendanceRes] = await Promise.all([
        axios.get(`${BACKEND}/api/students`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get(`${BACKEND}/api/attendance`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);
      setStudents(studentsRes.data || []);
      setAttendanceList(attendanceRes.data || []);
    } catch (err) {
      console.error("❌ Error loading attendance data:", err);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [])
  );

  const normalizeDate = (dateStr) => {
    if (!dateStr) return "";
    return new Date(dateStr).toISOString().split("T")[0];
  };

  const today = new Date().toISOString().split("T")[0];
  const todaysAttendance = attendanceList
    .filter((a) => normalizeDate(a.date) === today)
    .reduce((acc, a) => {
      acc[a.student_id] = a;
      return acc;
    }, {});

  const markAttendance = async (studentId, studentName, status) => {
    try {
      setDisabledButtons((prev) => ({ ...prev, [studentId]: true }));

      const payload = {
        student_id: studentId,
        method: status,
        location: "",
      };

      await axios.post(`${BACKEND}/api/attendance`, payload, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      // ✅ Instant UI update
      setAttendanceList((prev) => {
        const filtered = prev.filter(
          (a) =>
            !(a.student_id === studentId && normalizeDate(a.date) === today)
        );
        const newRecord = {
          student_id: studentId,
          date: new Date().toISOString(),
          time: new Date().toISOString(),
          method: status,
        };
        return [newRecord, ...filtered];
      });

      // ✅ Temporary success message (non-blocking)
      setMessage(`✔ Marked ${studentName} as ${status}`);
      setTimeout(() => setMessage(null), 1800);
    } catch (err) {
      console.error("❌ Error marking attendance:", err);
      setMessage("⚠️ Error marking attendance. Try again.");
      setDisabledButtons((prev) => ({ ...prev, [studentId]: false }));
      setTimeout(() => setMessage(null), 2000);
    }
  };

  const filteredStudents = students.filter((s) => {
    const query = searchText.toLowerCase();
    return (
      s.name?.toLowerCase().includes(query) ||
      s.usn?.toLowerCase().includes(query) ||
      s.room_no?.toLowerCase().includes(query)
    );
  });

  if (loading)
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text>Loading students...</Text>
      </View>
    );

  return (
    <View style={styles.page}>
      <Text style={styles.header}>Warden Attendance Panel</Text>

      {/* ✅ Floating banner message */}
      {message && (
        <View style={styles.messageBanner}>
          <Text style={styles.messageText}>{message}</Text>
        </View>
      )}

      {/* ✅ Search bar */}
      <TextInput
        placeholder="🔍 Search by name, USN, or room..."
        style={styles.searchBar}
        value={searchText}
        onChangeText={setSearchText}
      />

      {/* ✅ Student table */}
      <ScrollView style={styles.scroll} contentContainerStyle={{ padding: 10 }}>
        <View style={styles.table}>
          <View style={[styles.row, styles.headerRow]}>
            <Text style={[styles.cell, { flex: 1 }]}>Hostel</Text>
            <Text style={[styles.cell, styles.colName]}>Name</Text>
            <Text style={[styles.cell, styles.colUSN]}>USN</Text>
            <Text style={[styles.cell, styles.colRoom]}>Room</Text>
            <Text style={[styles.cell, styles.colStatus]}>Status</Text>
            <Text style={[styles.cell, styles.colActions]}>Actions</Text>
          </View>

          {filteredStudents.length === 0 ? (
            <View style={styles.emptyRow}>
              <Text style={styles.emptyText}>No matching students found.</Text>
            </View>
          ) : (
            filteredStudents.map((s) => {
              const att = todaysAttendance[s.id];
              const status = att ? att.method : "Not marked";
              const isPresent =
                att && att.method && att.method.toLowerCase() === "present";
              const isAbsent =
                att && att.method && att.method.toLowerCase() === "absent";
              const isDisabled = disabledButtons[s.id] || isPresent || isAbsent;

              return (
                <View key={s.id} style={styles.row}>
                  <Text style={[styles.cell, styles.colName]}>{s.name}</Text>
                  <Text style={[styles.cell, styles.colUSN]}>
                    {s.usn || "—"}
                  </Text>
                  <Text style={[styles.cell, styles.colRoom]}>
                    {s.room_no || "—"}
                  </Text>
                  <Text style={[styles.cell, { flex: 1 }]}>
                    {s.hostel_id ? s.hostel_id.toString() : "—"}
                  </Text>

                  <Text
                    style={[
                      styles.cell,
                      styles.colStatus,
                      isPresent && { color: "#16a34a" },
                      isAbsent && { color: "#dc2626" },
                    ]}
                  >
                    {status}
                  </Text>

                  <View style={[styles.cell, styles.colActions]}>
                    <TouchableOpacity
                      style={[
                        styles.actionBtn,
                        styles.presentBtn,
                        isDisabled && styles.disabledBtn,
                      ]}
                      disabled={isDisabled}
                      onPress={() =>
                        markAttendance(s.id, s.name || "Student", "Present")
                      }
                    >
                      <Text style={styles.btnText}>Present</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.actionBtn,
                        styles.absentBtn,
                        isDisabled && styles.disabledBtn,
                      ]}
                      disabled={isDisabled}
                      onPress={() =>
                        markAttendance(s.id, s.name || "Student", "Absent")
                      }
                    >
                      <Text style={styles.btnText}>Absent</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })
          )}
        </View>
      </ScrollView>

      <TouchableOpacity
        style={styles.navBtn}
        onPress={() => router.push("/warden-dashboard")}
      >
        <Text style={styles.navBtnText}>← Back to Dashboard</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: "#f8fafc", padding: 16 },
  header: {
    fontSize: 22,
    fontWeight: "700",
    color: "#0b5cff",
    marginBottom: 10,
  },
  searchBar: {
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 8,
    padding: 10,
    fontSize: 15,
    marginBottom: 10,
    backgroundColor: "#fff",
  },
  messageBanner: {
    backgroundColor: "#dbeafe",
    borderRadius: 8,
    padding: 8,
    marginBottom: 8,
    borderLeftWidth: 5,
    borderLeftColor: "#2563eb",
  },
  messageText: { color: "#0f172a", fontWeight: "600" },
  table: {
    borderRadius: 8,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#e6eefb",
  },
  row: {
    flexDirection: "row",
    paddingVertical: 10,
    paddingHorizontal: 12,
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#eef2ff",
    backgroundColor: "#fff",
  },
  headerRow: { backgroundColor: "#f1f5f9" },
  cell: { paddingHorizontal: 6 },
  colName: { flex: 2, fontWeight: "600" },
  colUSN: { flex: 1 },
  colRoom: { flex: 1 },
  colStatus: { flex: 1 },
  colActions: {
    flex: 1.6,
    flexDirection: "row",
    justifyContent: "space-around",
  },
  actionBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: "center",
    minWidth: 80,
  },
  presentBtn: { backgroundColor: "#16a34a" },
  absentBtn: { backgroundColor: "#dc2626" },
  disabledBtn: { backgroundColor: "#94a3b8" },
  btnText: { color: "#fff", fontWeight: "700" },
  emptyRow: { padding: 20, alignItems: "center" },
  emptyText: { color: "#64748b" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  navBtn: {
    marginTop: 10,
    backgroundColor: "#0b5cff",
    padding: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  navBtnText: { color: "#fff", fontWeight: "700" },
});
