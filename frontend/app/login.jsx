import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Platform,
} from "react-native";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";

// 💡 Change this IP whenever it updates
const BACKEND = "http://10.69.232.21:5000";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const showAlert = (title, message) => {
    if (Platform.OS === "web") window.alert(`${title}\n\n${message}`);
    else Alert.alert(title, message);
  };

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      showAlert("Login Failed", "Please enter both email and password.");
      return;
    }

    try {
      setLoading(true);

      const res = await axios.post(`${BACKEND}/api/auth/login`, {
        email: email.trim(),
        password,
      });

      const { token, user } = res.data;

      if (!token || !user) {
        showAlert("Error", "Invalid response from server");
        return;
      }

      // Save token in both storages
      if (Platform.OS === "web") localStorage.setItem("token", token);
      else await AsyncStorage.setItem("token", token);

      showAlert("Login Successful", `Welcome ${user.name || user.role}!`);

      // Navigate by role
      switch (user.role) {
        case "admin":
          router.replace("/admin-dashboard");
          break;
        case "warden":
          router.replace("/warden-dashboard");
          break;
        case "student":
          router.replace("/student-dashboard");
          break;
        default:
          showAlert("Error", "Unknown user role");
      }
    } catch (err) {
      console.error("Login error:", err);
      if (err.response)
        showAlert(
          "Invalid Credentials",
          err.response.data?.message || "Invalid login"
        );
      else if (err.request)
        showAlert("Connection Error", "Unable to reach backend server.");
      else showAlert("Error", err.message || "Unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.logo}>🏫 CIT_NC Hostel Portal</Text>
      <Text style={styles.title}>Login</Text>

      <TextInput
        style={styles.input}
        placeholder="College Email"
        placeholderTextColor="#888"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />

      <TextInput
        style={styles.input}
        placeholder="Password"
        placeholderTextColor="#888"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      <TouchableOpacity
        style={[styles.button, loading && { backgroundColor: "#9ca3af" }]}
        onPress={handleLogin}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? "Logging in..." : "Login"}
        </Text>
      </TouchableOpacity>

      <Text style={styles.footer}>
        Use your college email (e.g. name@cit_nc.edu.in)
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8fafc",
    padding: 22,
  },
  logo: {
    fontSize: 20,
    fontWeight: "800",
    color: "#2563eb",
    marginBottom: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#0f172a",
    marginBottom: 25,
  },
  input: {
    width: "100%",
    maxWidth: 500,
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 10,
    padding: 12,
    marginVertical: 8,
    backgroundColor: "#fff",
  },
  button: {
    width: "100%",
    maxWidth: 500,
    backgroundColor: "#0b5cff",
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 12,
  },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  footer: { color: "#64748b", fontSize: 13, marginTop: 16 },
});
