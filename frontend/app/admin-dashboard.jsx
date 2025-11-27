// adhas/frontend/app/admin/dashboard.jsx

import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
} from "react-native";
import { useRouter } from "expo-router";

export default function AdminDashboard() {
  const router = useRouter();

  const adminName = "System Admin";
  const adminEmail = "sk_admin@cit_nc.edu.in";

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#0b5cff" barStyle="light-content" />

      <Text style={styles.title}>🧑‍💼 Admin Dashboard</Text>
      <Text style={styles.welcome}>Welcome, {adminName}!</Text>
      <Text style={styles.email}>{adminEmail}</Text>

      <View style={styles.cardContainer}>
        {/* Manage Users */}
        <TouchableOpacity
          style={styles.card}
          onPress={() => router.push("/admin/users")}
        >
          <Text style={styles.icon}>👥</Text>
          <Text style={styles.cardText}>Manage Users</Text>
        </TouchableOpacity>

        {/* View Complaints */}
        <TouchableOpacity
          style={styles.card}
          onPress={() => router.push("/admin/complaints")}
        >
          <Text style={styles.icon}>📝</Text>
          <Text style={styles.cardText}>View Complaints</Text>
        </TouchableOpacity>

        {/* Attendance Logs */}
        <TouchableOpacity
          style={styles.card}
          onPress={() => router.push("/admin/attendance")}
        >
          <Text style={styles.icon}>📅</Text>
          <Text style={styles.cardText}>Attendance Logs</Text>
        </TouchableOpacity>

        {/* Student History */}
        <TouchableOpacity
          style={styles.card}
          onPress={() => router.push("/admin/student-history")}
        >
          <Text style={styles.icon}>📚</Text>
          <Text style={styles.cardText}>Student History</Text>
        </TouchableOpacity>
      </View>

      {/* Logout Button */}
      <TouchableOpacity
        style={styles.logoutBtn}
        onPress={() => router.push("/")}
      >
        <Text style={styles.logoutText}>🚪 Logout</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#0b5cff",
    marginBottom: 8,
  },
  welcome: {
    fontSize: 18,
    color: "#1e293b",
    marginBottom: 4,
  },
  email: {
    fontSize: 14,
    color: "#64748b",
    marginBottom: 25,
  },
  cardContainer: {
    width: "100%",
    alignItems: "center",
  },
  card: {
    backgroundColor: "#ffffff",
    width: "90%",
    borderRadius: 12,
    paddingVertical: 25,
    alignItems: "center",
    marginBottom: 20,
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
  },
  icon: {
    fontSize: 30,
    marginBottom: 8,
  },
  cardText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#0f172a",
  },
  logoutBtn: {
    backgroundColor: "#ff4d4f",
    width: "80%",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    position: "absolute",
    bottom: 40,
  },
  logoutText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
});
