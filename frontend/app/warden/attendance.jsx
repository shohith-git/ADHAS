import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from "react-native";
import { useRouter } from "expo-router";

export default function AttendanceDashboard() {
  const router = useRouter();

  return (
    <ScrollView style={styles.page} contentContainerStyle={{ padding: 20 }}>
      <Text style={styles.header}>📋 Attendance Overview</Text>

      <View style={styles.cardContainer}>
        <TouchableOpacity
          style={[
            styles.card,
            { backgroundColor: "#dcfce7", borderColor: "#16a34a" },
          ]}
          onPress={() => router.push("/warden/attendance-present")}
        >
          <Text style={styles.icon}>✅</Text>
          <Text style={styles.title}>Present Students</Text>
          <Text style={styles.desc}>
            View all students marked present today
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.card,
            { backgroundColor: "#fee2e2", borderColor: "#dc2626" },
          ]}
          onPress={() => router.push("/warden/attendance-absent")}
        >
          <Text style={styles.icon}>❌</Text>
          <Text style={styles.title}>Absent Students</Text>
          <Text style={styles.desc}>
            View students who haven’t marked attendance
          </Text>
        </TouchableOpacity>
      </View>
      <TouchableOpacity
        style={styles.backDashboardBtn}
        onPress={() => router.push("/warden-dashboard")}
      >
        <Text style={styles.backDashboardText}>← Back to Dashboard</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { backgroundColor: "#f8fafc", flex: 1 },
  header: {
    fontSize: 24,
    fontWeight: "700",
    color: "#0b5cff",
    marginBottom: 20,
  },
  cardContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    flexWrap: "wrap",
  },
  card: {
    width: "48%",
    borderRadius: 12,
    padding: 20,
    borderWidth: 1.5,
    alignItems: "center",
    shadowColor: "#00000022",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    marginBottom: 16,
  },
  icon: { fontSize: 36, marginBottom: 10 },
  title: { fontSize: 17, fontWeight: "700", color: "#0f172a", marginBottom: 4 },
  desc: { color: "#475569", textAlign: "center", fontSize: 13 },
  backDashboardBtn: {
    marginTop: 25,
    backgroundColor: "#0b5cff",
    padding: 12,
    borderRadius: 10,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 3 },
  },
  backDashboardText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 15,
  },
});
