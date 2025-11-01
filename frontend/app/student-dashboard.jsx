import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { router } from "expo-router";

export default function StudentDashboard() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>🎓 Student Dashboard</Text>
      <Text style={styles.subtitle}>Welcome, CIT_NC Student!</Text>

      <TouchableOpacity style={styles.button} onPress={() => router.push("/")}>
        <Text style={styles.buttonText}>Logout</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8f8f8",
  },
  title: { fontSize: 26, fontWeight: "bold", marginBottom: 10 },
  subtitle: { fontSize: 16, marginBottom: 30 },
  button: { backgroundColor: "#ff5252", padding: 12, borderRadius: 8 },
  buttonText: { color: "#fff", fontWeight: "bold" },
});
