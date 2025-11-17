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
import {
  BookUser,
  Building2,
  FileText,
  History,
  CalendarCheck2,
  UserRound,
  Bot,
} from "lucide-react";

export default function WardenDashboard() {
  const router = useRouter();

  // 🔒 Logout handler
  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem("token");
      if (typeof window !== "undefined") localStorage.removeItem("token");

      if (Platform.OS === "web") {
        const confirmLogout = window.confirm(
          "Are you sure you want to logout?"
        );
        if (confirmLogout) router.replace("/login");
      } else {
        Alert.alert("Logout", "Are you sure you want to logout?", [
          { text: "Cancel", style: "cancel" },
          {
            text: "Logout",
            style: "destructive",
            onPress: () => router.replace("/login"),
          },
        ]);
      }
    } catch (err) {
      console.error("Logout error:", err);
      Alert.alert("Error", "Failed to logout properly");
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ padding: 20 }}
    >
      {/* Header */}
      <Text style={styles.header}>🏫 Warden Dashboard</Text>
      <Text style={styles.subHeader}>Manage hostel operations efficiently</Text>

      {/* Functional Cards */}
      <View style={styles.grid}>
        {/* 👨‍🎓 Student Management */}
        <TouchableOpacity
          style={styles.card}
          onPress={() => router.push("/warden/student-management")}
        >
          <BookUser size={36} color="#2563eb" />
          <Text style={styles.cardTitle}>Student Management</Text>
          <Text style={styles.cardDesc}>Register, view or remove students</Text>
        </TouchableOpacity>

        {/* 🧍‍♂️ Student Profile */}
        <TouchableOpacity
          style={styles.card}
          onPress={() => router.push("/warden/student-profile")}
        >
          <UserRound size={36} color="#0284c7" />
          <Text style={styles.cardTitle}>Student Profile</Text>
          <Text style={styles.cardDesc}>
            Add or edit student profile details
          </Text>
        </TouchableOpacity>

        {/* 🏢 Room Management */}
        <TouchableOpacity
          style={styles.card}
          onPress={() => router.push("/warden/rooms")}
        >
          <Building2 size={36} color="#059669" />
          <Text style={styles.cardTitle}>Room Management</Text>
          <Text style={styles.cardDesc}>Add, edit or delete rooms</Text>
        </TouchableOpacity>

        {/* 📄 Complaints */}
        <TouchableOpacity
          style={styles.card}
          onPress={() => router.push("/warden/complaints")}
        >
          <FileText size={36} color="#dc2626" />
          <Text style={styles.cardTitle}>Complaints</Text>
          <Text style={styles.cardDesc}>Review & update complaint status</Text>
        </TouchableOpacity>

        {/* 🤖 AI Assistant (Correct position inside grid) */}
        <TouchableOpacity
          style={styles.card}
          onPress={() => router.push("/warden/ai-assistant")}
        >
          <Bot size={36} color="#3b82f6" />
          <Text style={styles.cardTitle}>AI Assistant</Text>
          <Text style={styles.cardDesc}>
            Analyze attendance, rooms, complaints
          </Text>
        </TouchableOpacity>

        {/* 🕓 Past Students */}
        <TouchableOpacity
          style={styles.card}
          onPress={() => router.push("/warden/past-students")}
        >
          <History size={36} color="#f59e0b" />
          <Text style={styles.cardTitle}>Past Students</Text>
          <Text style={styles.cardDesc}>View student history</Text>
        </TouchableOpacity>

        {/* 📅 Attendance */}
        <TouchableOpacity
          style={styles.card}
          onPress={() => router.push("/warden/attendance")}
        >
          <CalendarCheck2 size={36} color="#7c3aed" />
          <Text style={styles.cardTitle}>Attendance</Text>
          <Text style={styles.cardDesc}>Track daily attendance</Text>
        </TouchableOpacity>
      </View>

      {/* 🚪 Logout Button */}
      <TouchableOpacity
        style={styles.logoutBtn}
        onPress={() => router.push("/")}
      >
        <Text style={styles.logoutText}>🚪 Logout</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: "#f8fafc", flex: 1 },
  header: {
    fontSize: 26,
    fontWeight: "800",
    color: "#0f172a",
    marginBottom: 6,
  },
  subHeader: {
    fontSize: 15,
    color: "#475569",
    marginBottom: 18,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  card: {
    width: "47%",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    shadowColor: "#00000015",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0f172a",
    marginTop: 8,
  },
  cardDesc: {
    fontSize: 12,
    color: "#64748b",
    marginTop: 4,
  },
  logoutBtn: {
    backgroundColor: "#dc2626",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 14,
    borderRadius: 12,
    marginTop: 15,
    marginBottom: 30,
  },
  logoutText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
    marginLeft: 8,
  },
});
