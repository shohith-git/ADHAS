import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  TextInput,
  Pressable,
  Animated,
} from "react-native";
import axios from "axios";
import { useRouter } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";

export default function AttendancePanel() {
  const router = useRouter();

  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Toast (same engine as attendance-dashboard)
  const [toastMessage, setToastMessage] = useState("");
  const toastAnim = React.useRef(new Animated.Value(0)).current;

  // Backend
  const BACKEND = "http://10.69.232.21:5000";
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;

  /* ---------------- LOAD DATA ---------------- */
  const loadData = async () => {
    setLoading(true);
    try {
      const [s, a] = await Promise.all([
        axios.get(`${BACKEND}/api/students`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get(`${BACKEND}/api/attendance`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      setStudents(s.data || []);
      setAttendance(a.data || []);
    } catch (err) {
      showToast("Error loading data");
    }
    setLoading(false);
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  /* ---------------- TODAY MAP ---------------- */
  const today = new Date().toISOString().split("T")[0];
  const normalize = (d) => (d ? d.split("T")[0] : "");

  const todaysMap = attendance
    .filter((a) => normalize(a.date) === today)
    .reduce((acc, a) => {
      acc[a.student_id] = a.method;
      return acc;
    }, {});

  /* ---------------- TOAST ---------------- */
  const showToast = (msg = "") => {
    if (!msg) return;
    setToastMessage(msg);

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
    }, 1500);
  };

  /* ---------------- MARK ---------------- */
  const mark = async (id, name, status) => {
    try {
      // Optimistic UI
      setAttendance((prev) => [
        ...prev,
        { student_id: id, date: today, method: status },
      ]);

      await axios.post(
        `${BACKEND}/api/attendance`,
        { student_id: id, method: status },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      showToast(`Marked ${name} ${status}`);

      // Delay loading to avoid remount → makes toast visible
      setTimeout(() => loadData(), 500);
    } catch (err) {
      showToast("Marking failed");
    }
  };

  /* ---------------- UNDO ---------------- */
  const undoAttendance = async (id, name) => {
    try {
      await axios.delete(`${BACKEND}/api/attendance/undo/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      showToast(`Undo done for ${name}`);

      setTimeout(() => loadData(), 500);
    } catch (err) {
      showToast("Undo failed");
    }
  };

  /* ---------------- SEARCH ---------------- */
  const filtered = students.filter((s) => {
    const q = search.toLowerCase();
    return (
      (s.name || "").toLowerCase().includes(q) ||
      (s.usn || "").toLowerCase().includes(q) ||
      (s.room_no || "").toString().toLowerCase().includes(q) ||
      (s.hostel_id || "").toString().toLowerCase().includes(q)
    );
  });

  /* ---------------- LOADING ---------------- */
  if (loading)
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text>Loading attendance...</Text>
      </View>
    );

  /* ---------------- UI ---------------- */
  return (
    <View style={{ flex: 1, backgroundColor: "#eef2ff" }}>
      {/* FLOATING TOAST (same as dashboard, on top of everything) */}
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
        <Text style={styles.toastText}>{toastMessage}</Text>
      </Animated.View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 120 }}>
        {/* HEADER */}
        <View style={styles.headerRow}>
          <Text style={styles.header}>Warden Attendance Panel</Text>

          <TouchableOpacity
            style={styles.logBtn}
            onPress={() => router.push("/warden/attendance-dashboard")}
          >
            <Text style={styles.logBtnText}>📁 Logs</Text>
          </TouchableOpacity>
        </View>

        {/* SEARCH */}
        <TextInput
          placeholder="Search by name, room, hostel..."
          style={styles.search}
          value={search}
          onChangeText={setSearch}
        />

        {/* TABLE */}
        <View style={styles.table}>
          <View style={[styles.row, styles.headerRowTable]}>
            <Text style={[styles.cell, { flex: 1 }]}>Hostel</Text>
            <Text style={[styles.cell, { flex: 2 }]}>Name</Text>
            <Text style={[styles.cell, { flex: 1 }]}>USN</Text>
            <Text style={[styles.cell, { flex: 1 }]}>Room</Text>
            <Text style={[styles.cell, { flex: 1 }]}>Status</Text>
            <Text style={[styles.cell, { flex: 1.3 }]}>Actions</Text>
          </View>

          {filtered.map((s) => {
            const marked = todaysMap[s.id];

            return (
              <View key={s.id} style={styles.row}>
                <Text style={[styles.cell, { flex: 1 }]}>{s.hostel_id}</Text>
                <Text style={[styles.cell, { flex: 2 }]}>{s.name}</Text>
                <Text style={[styles.cell, { flex: 1 }]}>{s.usn}</Text>
                <Text style={[styles.cell, { flex: 1 }]}>{s.room_no}</Text>

                {/* STATUS */}
                <View style={[styles.statusBox, { flex: 1 }]}>
                  <Text
                    style={[
                      styles.statusText,
                      marked === "Present" && styles.presentText,
                      marked === "Absent" && styles.absentText,
                    ]}
                  >
                    {marked || "Not Marked"}
                  </Text>

                  {marked && (
                    <Pressable
                      onPress={() => undoAttendance(s.id, s.name)}
                      style={styles.undoIcon}
                    >
                      <Text style={styles.undoText}>↺</Text>
                    </Pressable>
                  )}
                </View>

                {/* ACTION BUTTONS */}
                <View style={[styles.actions, { flex: 1.3 }]}>
                  <TouchableOpacity
                    disabled={!!marked}
                    style={[
                      styles.btn,
                      styles.presentBtn,
                      marked && styles.disabledBtn,
                    ]}
                    onPress={() => mark(s.id, s.name, "Present")}
                  >
                    <Text style={styles.btnText}>Present</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    disabled={!!marked}
                    style={[
                      styles.btn,
                      styles.absentBtn,
                      marked && styles.disabledBtn,
                    ]}
                    onPress={() => mark(s.id, s.name, "Absent")}
                  >
                    <Text style={styles.btnText}>Absent</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}
        </View>

        {/* BACK BUTTON */}
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.push("/warden-dashboard")}
        >
          <Text style={styles.backText}>← Back to Dashboard</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

/* ---------------- STYLES ---------------- */
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
  toastText: { fontWeight: "700", color: "#0f172a" },

  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  header: {
    fontSize: 22,
    fontWeight: "800",
    color: "#0b5cff",
  },

  logBtn: {
    backgroundColor: "#2563eb",
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
  },
  logBtnText: { color: "#fff", fontWeight: "700" },

  search: {
    backgroundColor: "#fff",
    padding: 10,
    borderRadius: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#cbd5e1",
  },

  table: {
    backgroundColor: "#fff",
    borderRadius: 10,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#e4e4e7",
  },

  row: {
    flexDirection: "row",
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderColor: "#e5e7eb",
  },

  headerRowTable: {
    backgroundColor: "#f4f4f5",
  },

  cell: {
    fontSize: 14,
    color: "#1e293b",
  },

  statusBox: {
    flexDirection: "row",
    alignItems: "center",
    columnGap: 6,
  },
  statusText: {
    fontWeight: "700",
  },
  presentText: { color: "#16a34a" },
  absentText: { color: "#dc2626" },

  undoIcon: {
    backgroundColor: "#e2e8f0",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  undoText: { fontWeight: "800", fontSize: 14 },

  actions: {
    flexDirection: "row",
    justifyContent: "space-between",
  },

  btn: {
    paddingVertical: 7,
    paddingHorizontal: 10,
    borderRadius: 8,
    minWidth: 85,
    alignItems: "center",
  },
  presentBtn: { backgroundColor: "#22c55e" },
  absentBtn: { backgroundColor: "#ef4444" },
  disabledBtn: { backgroundColor: "#94a3b8" },
  btnText: { color: "#fff", fontWeight: "700" },

  backBtn: {
    marginTop: 20,
    backgroundColor: "#1e3a8a",
    padding: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  backText: { color: "#fff", fontWeight: "700", fontSize: 15 },
});
