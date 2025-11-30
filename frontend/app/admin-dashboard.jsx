// adhas/frontend/app/admin-dashboard.jsx

import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from "react-native";
import { useRouter } from "expo-router";

export default function AdminDashboard() {
  const router = useRouter();

  return (
    <ScrollView style={styles.page}>
      {/* HEADER */}
      <View style={styles.headerBox}>
        <Text style={styles.title}>🧑‍💼 Admin Dashboard</Text>
        <Text style={styles.subtitle}>Welcome, System Admin</Text>
        <Text style={styles.email}>sk_admin@cit_nc.edu.in</Text>
      </View>

      {/* GRID BOX */}
      <View style={styles.grid}>
        {/* Manage Users */}
        <TouchableOpacity
          style={styles.card}
          onPress={() => router.push("/admin/users")}
        >
          <Text style={styles.icon}>👥</Text>
          <Text style={styles.cardTitle}>Manage Users</Text>
          <Text style={styles.cardSub}>Add, view or edit users</Text>
        </TouchableOpacity>

        {/* Complaints */}
        <TouchableOpacity
          style={styles.card}
          onPress={() => router.push("/admin/complaints")}
        >
          <Text style={styles.icon}>📝</Text>
          <Text style={styles.cardTitle}>Complaints</Text>
          <Text style={styles.cardSub}>View and update complaint status</Text>
        </TouchableOpacity>

        {/* Attendance Logs */}
        <TouchableOpacity
          style={styles.card}
          onPress={() => router.push("/admin/attendance")}
        >
          <Text style={styles.icon}>📊</Text>
          <Text style={styles.cardTitle}>Attendance Logs</Text>
          <Text style={styles.cardSub}>Track student attendance</Text>
        </TouchableOpacity>

        {/* Student History */}
        <TouchableOpacity
          style={styles.card}
          onPress={() => router.push("/admin/student-history")}
        >
          <Text style={styles.icon}>📚</Text>
          <Text style={styles.cardTitle}>Student History</Text>
          <Text style={styles.cardSub}>View history of vacated students</Text>
        </TouchableOpacity>
      </View>

      {/* Logout */}
      <View style={styles.logoutBox}>
        <TouchableOpacity
          style={styles.logoutBtn}
          onPress={() => router.push("/")}
        >
          <Text style={styles.logoutText}>🚪 Logout</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

/* ------------------- STYLES ------------------- */

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: "#f1f5ff",
  },

  headerBox: {
    paddingTop: 40,
    paddingBottom: 20,
    alignItems: "center",
  },

  title: {
    fontSize: 26,
    fontWeight: "800",
    color: "#0b5cff",
  },

  subtitle: {
    fontSize: 16,
    marginTop: 4,
    color: "#334155",
    fontWeight: "600",
  },

  email: {
    fontSize: 13,
    color: "#64748b",
    marginTop: 2,
  },

  /* GRID */
  grid: {
    paddingHorizontal: 20,
    marginTop: 10,
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },

  /* CARD (Same as Warden Dashboard) */
  card: {
    width: "48%",
    backgroundColor: "#ffffff",
    borderRadius: 14,
    paddingVertical: 25,
    paddingHorizontal: 12,
    marginBottom: 18,

    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },

    elevation: 3,
  },

  icon: {
    fontSize: 38,
    marginBottom: 12,
  },

  cardTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0f172a",
  },

  cardSub: {
    fontSize: 12.5,
    color: "#64748b",
    marginTop: 4,
  },

  /* LOGOUT SECTION */
  logoutBox: {
    marginTop: 25,
    marginBottom: 40,
    alignItems: "center",
  },

  logoutBtn: {
    backgroundColor: "#ef4444",
    width: "90%",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
  },

  logoutText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 16,
  },
});
