// frontend/app/student-dashboard.jsx
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Alert,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function StudentDashboard() {
  const router = useRouter();
  const [studentName, setStudentName] = useState("Student");
  const [studentEmail, setStudentEmail] = useState("");

  useEffect(() => {
    const loadStudentInfo = async () => {
      try {
        let storedEmail = "";
        let storedName = "";

        if (Platform.OS === "web") {
          storedEmail = localStorage.getItem("email") || "";
          storedName = localStorage.getItem("name") || "";
        } else {
          storedEmail = (await AsyncStorage.getItem("email")) || "";
          storedName = (await AsyncStorage.getItem("name")) || "";
        }

        setStudentEmail(storedEmail);
        setStudentName(storedName || storedEmail || "Student");
      } catch (err) {
        console.error("Error loading student info:", err);
      }
    };

    loadStudentInfo();
  }, []);

  const handleLogout = async () => {
    try {
      if (Platform.OS === "web") {
        localStorage.removeItem("token");
        localStorage.removeItem("user_id");
        localStorage.removeItem("email");
        localStorage.removeItem("name");
        localStorage.removeItem("role");
      } else {
        await AsyncStorage.multiRemove([
          "token",
          "user_id",
          "email",
          "name",
          "role",
        ]);
      }

      Alert.alert("Logged Out", "You have been logged out.");
      router.replace("/");
    } catch (err) {
      console.error("Logout error:", err);
      Alert.alert("Error", "Failed to logout.");
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#0b5cff" barStyle="light-content" />

      <Text style={styles.title}>🎓 Student Dashboard</Text>
      <Text style={styles.welcome}>Welcome back, {studentName}!</Text>
      <Text style={styles.email}>{studentEmail}</Text>

      <View style={styles.cardContainer}>
        {/* Profile */}
        <TouchableOpacity
          style={styles.card}
          onPress={() => router.push("/student/profile")}
        >
          <Text style={styles.icon}>👤</Text>
          <Text style={styles.cardText}>Profile</Text>
        </TouchableOpacity>

        {/* Complaints */}
        <TouchableOpacity
          style={styles.card}
          onPress={() => router.push("/student/complaints")}
        >
          <Text style={styles.icon}>📝</Text>
          <Text style={styles.cardText}>Complaint Portal</Text>
        </TouchableOpacity>

        {/* Attendance */}
        <TouchableOpacity
          style={styles.card}
          onPress={() => router.push("/student/attendance")}
        >
          <Text style={styles.icon}>📅</Text>
          <Text style={styles.cardText}>View Attendance</Text>
        </TouchableOpacity>

        {/* AI Assistant - MATCHING CARD */}
        <TouchableOpacity
          style={styles.card}
          onPress={() => router.push("/student/ai")}
        >
          <Text style={styles.icon}>🤖</Text>
          <Text style={styles.cardText}>AI Assistant</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
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
  welcome: { fontSize: 18, color: "#1e293b", marginBottom: 4 },
  email: { fontSize: 14, color: "#64748b", marginBottom: 25 },

  // Card grid
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

  icon: { fontSize: 30, marginBottom: 8 },
  cardText: { fontSize: 16, fontWeight: "600", color: "#0f172a" },

  // Logout
  logoutBtn: {
    backgroundColor: "#ff4d4f",
    width: "80%",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    position: "absolute",
    bottom: 40,
  },
  logoutText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
});
