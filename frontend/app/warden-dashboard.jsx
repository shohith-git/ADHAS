import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function WardenDashboard() {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem("token");
      if (typeof window !== "undefined") localStorage.removeItem("token");

      if (Platform.OS === "web") {
        const confirmLogout = window.confirm(
          "Are you sure you want to logout?"
        );
        if (confirmLogout) router.replace("/");
      } else {
        Alert.alert("Logout", "Are you sure you want to logout?", [
          { text: "Cancel", style: "cancel" },
          {
            text: "Logout",
            style: "destructive",
            onPress: () => router.replace("/"),
          },
        ]);
      }
    } catch (err) {
      console.error("Logout error:", err);
      Alert.alert("Error", "Failed to logout properly");
    }
  };

  return (
    <ScrollView style={styles.page} contentContainerStyle={{ padding: 20 }}>
      {/* HEADER */}
      <View style={styles.headerWrap}>
        <Text style={styles.header}>Warden Dashboard</Text>
        <Text style={styles.subHeader}>
          Manage daily hostel operations effortlessly
        </Text>
      </View>

      {/* GRID MENU */}
      <View style={styles.grid}>
        <TouchableOpacity
          style={styles.card}
          onPress={() => router.push("/warden/student-management")}
        >
          <Text style={styles.icon}>📘</Text>
          <Text style={styles.cardTitle}>Student Management</Text>
          <Text style={styles.cardDesc}>Register, view, remove students</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.card}
          onPress={() => router.push("/warden/student-profile")}
        >
          <Text style={styles.icon}>👤</Text>
          <Text style={styles.cardTitle}>Student Profile</Text>
          <Text style={styles.cardDesc}>View or edit profile details</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.card}
          onPress={() => router.push("/warden/rooms")}
        >
          <Text style={styles.icon}>🏢</Text>
          <Text style={styles.cardTitle}>Room Management</Text>
          <Text style={styles.cardDesc}>Add, edit or delete rooms</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.card}
          onPress={() => router.push("/warden/complaints")}
        >
          <Text style={styles.icon}>📄</Text>
          <Text style={styles.cardTitle}>Complaints</Text>
          <Text style={styles.cardDesc}>Review and update statuses</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.card}
          onPress={() => router.push("/warden/ai-assistant")}
        >
          <Text style={styles.icon}>🤖</Text>
          <Text style={styles.cardTitle}>AI Assistant</Text>
          <Text style={styles.cardDesc}>
            Analyze records with intelligent insights
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.card}
          onPress={() => router.push("/warden/students-history")}
        >
          <Text style={styles.icon}>⏳</Text>
          <Text style={styles.cardTitle}>Students History</Text>
          <Text style={styles.cardDesc}>View past student records</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.card}
          onPress={() => router.push("/warden/attendance")}
        >
          <Text style={styles.icon}>📅</Text>
          <Text style={styles.cardTitle}>Attendance</Text>
          <Text style={styles.cardDesc}>Track daily attendance</Text>
        </TouchableOpacity>
      </View>

      {/* LOGOUT */}
      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Text style={styles.logoutText}>🚪 Logout</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: "#eef2ff",
  },

  headerWrap: {
    marginBottom: 20,
  },

  header: {
    fontSize: 28,
    fontWeight: "900",
    color: "#1e3a8a",
    letterSpacing: 0.3,
  },

  subHeader: {
    fontSize: 15,
    color: "#475569",
    marginTop: 4,
  },

  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },

  card: {
    width: "47%",
    backgroundColor: "#fff",
    padding: 18,
    borderRadius: 16,
    marginBottom: 20,

    borderWidth: 1,
    borderColor: "#dbe4ff",

    shadowColor: "#1e3a8a",
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },

  icon: {
    fontSize: 40,
    marginBottom: 10,
  },

  cardTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0f172a",
  },

  cardDesc: {
    fontSize: 13,
    color: "#64748b",
    marginTop: 4,
  },

  logoutBtn: {
    backgroundColor: "#dc2626",
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 20,

    shadowColor: "#dc2626",
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 3,
  },

  logoutText: {
    textAlign: "center",
    color: "#fff",
    fontSize: 16,
    fontWeight: "800",
  },
});
