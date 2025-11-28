import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  TextInput,
  Alert,
} from "react-native";
import axios from "axios";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

const BACKEND = "http://10.49.102.21:5000";

export default function AdminUsers() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);

  const [wardens, setWardens] = useState([]);
  const [students, setStudents] = useState([]);

  const loadData = async () => {
    try {
      const usersRes = await axios.get(`${BACKEND}/api/admin/users`);
      const data = usersRes.data || [];

      const ward = data.filter((u) => u.role === "warden");
      const studs = data.filter((u) => u.role === "student");

      setWardens(ward);
      setStudents(studs);
    } catch (err) {
      Alert.alert("Error", "Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const createWarden = async () => {
    if (!name || !email || !password) {
      Alert.alert("Missing Fields", "All fields are required.");
      return;
    }

    try {
      await axios.post(`${BACKEND}/api/admin/register-warden`, {
        name,
        email,
        password,
      });

      Alert.alert("Success", "Warden Registered");
      setName("");
      setEmail("");
      setPassword("");
      loadData();
    } catch (err) {
      Alert.alert(
        "Error",
        err.response?.data?.message || "Failed to register warden"
      );
    }
  };

  return (
    <ScrollView style={styles.page} contentContainerStyle={{ padding: 20 }}>
      {/* Header + History Tab */}
      <View style={styles.headerRow}>
        <Text style={styles.header}>👥 Manage Wardens & Students</Text>

        <TouchableOpacity
          style={styles.tabBtn}
          onPress={() => router.push("/admin/warden-history")}
        >
          <Ionicons name="time-outline" size={18} color="#fff" />
          <Text style={styles.tabText}>Warden History</Text>
        </TouchableOpacity>
      </View>

      {/* CREATE NEW WARDEN */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>➕ Register New Warden</Text>

        <TextInput
          style={styles.input}
          placeholder="Full name"
          placeholderTextColor="#94a3b8"
          value={name}
          onChangeText={setName}
        />

        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor="#94a3b8"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
        />

        <View style={styles.passwordRow}>
          <TextInput
            style={[styles.input, { flex: 1 }]}
            placeholder="Password"
            placeholderTextColor="#94a3b8"
            secureTextEntry={!showPassword}
            value={password}
            onChangeText={setPassword}
          />

          <TouchableOpacity
            onPress={() => setShowPassword(!showPassword)}
            style={styles.eyeBtn}
          >
            <Ionicons
              name={showPassword ? "eye-off-outline" : "eye-outline"}
              size={20}
              color="#475569"
            />
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.registerBtn} onPress={createWarden}>
          <Text style={styles.registerText}>Create Warden</Text>
        </TouchableOpacity>
      </View>

      {/* ACTIVE WARDENS */}
      <Text style={styles.sectionTitle}>👨‍🏫 Active Wardens</Text>
      {loading ? (
        <ActivityIndicator size="large" color="#4f46e5" />
      ) : wardens.length === 0 ? (
        <Text style={styles.empty}>No wardens found.</Text>
      ) : (
        wardens.map((w) => (
          <TouchableOpacity
            key={w.id}
            style={styles.userCard}
            onPress={() => router.push(`/admin/warden-profile/${w.id}`)}
          >
            <View style={styles.rowBetween}>
              <View>
                <Text style={styles.name}>{w.name}</Text>
                <Text style={styles.email}>{w.email}</Text>
              </View>

              <Text style={[styles.role, styles.warden]}>WARDEN</Text>
            </View>
          </TouchableOpacity>
        ))
      )}

      {/* ACTIVE STUDENTS */}
      <Text style={styles.sectionTitle}>🎓 Active Students</Text>

      {students.length === 0 ? (
        <Text style={styles.empty}>No students found.</Text>
      ) : (
        students.map((s) => (
          <TouchableOpacity
            key={s.id}
            style={styles.userCard}
            onPress={() => router.push(`/admin/student-profile/${s.id}`)}
          >
            <Text style={styles.name}>{s.name}</Text>
            <Text style={styles.email}>{s.email}</Text>

            {/* Added USN + Room */}
            <Text style={styles.usnRoom}>USN: {s.usn || "—"}</Text>
            <Text style={styles.usnRoom}>
              Room: {s.room_no || "Unallocated"}
            </Text>

            <Text style={[styles.role, styles.student]}>STUDENT</Text>
          </TouchableOpacity>
        ))
      )}

      <TouchableOpacity
        style={styles.backBtn}
        onPress={() => router.push("/admin-dashboard")}
      >
        <Text style={styles.backBtnText}>← Back to Dashboard</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

/* ---------------- UI STYLES ---------------- */

const styles = StyleSheet.create({
  page: { backgroundColor: "#eef2ff", flex: 1 },

  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },

  header: {
    fontSize: 22,
    fontWeight: "800",
    color: "#1e293b",
  },

  /* Hard TAB Button */
  tabBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#4f46e5",
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    elevation: 3,
  },
  tabText: {
    marginLeft: 6,
    fontSize: 13,
    fontWeight: "700",
    color: "#fff",
  },

  sectionTitle: {
    fontSize: 19,
    fontWeight: "700",
    marginTop: 18,
    marginBottom: 8,
    color: "#1e293b",
  },

  card: {
    backgroundColor: "#fff",
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    elevation: 2,
    marginTop: 16,
  },

  input: {
    backgroundColor: "#f1f5f9",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 6,
    fontSize: 14,
    color: "#111827",
  },

  passwordRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
  },
  eyeBtn: { padding: 10, marginLeft: 6 },

  registerBtn: {
    marginTop: 12,
    backgroundColor: "#4f46e5",
    padding: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  registerText: { color: "#fff", fontWeight: "700" },

  userCard: {
    backgroundColor: "#fff",
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    marginBottom: 12,
    elevation: 2,
  },

  name: { fontSize: 16, fontWeight: "700", color: "#1e293b" },
  email: { fontSize: 13, color: "#475569", marginTop: 2 },

  usnRoom: {
    marginTop: 4,
    fontSize: 13,
    color: "#334155",
    fontWeight: "600",
  },

  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  role: {
    marginTop: 8,
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    fontWeight: "700",
    fontSize: 12.5,
  },

  warden: { backgroundColor: "#fef3c7", color: "#92400e" },
  student: { backgroundColor: "#dbeafe", color: "#1e3a8a" },

  empty: {
    color: "#94a3b8",
    fontStyle: "italic",
    marginBottom: 10,
    marginTop: 4,
  },

  backBtn: {
    marginTop: 26,
    backgroundColor: "#4f46e5",
    padding: 12,
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 30,
  },
  backBtnText: {
    color: "#fff",
    fontWeight: "700",
    letterSpacing: 0.3,
  },
});
