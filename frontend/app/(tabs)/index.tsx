// 📁 frontend/app/(tabs)/index.tsx
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
import { router } from "expo-router";

// ✅ Backend base URL (change if your IP changes)
const BACKEND = "http://10.69.232.21:5000";

// 🧠 Helper: unified alert for web & native
function showAlert(title: string, message: string) {
  if (Platform.OS === "web") window.alert(`${title}\n\n${message}`);
  else Alert.alert(title, message);
}

// 📧 Simple email validation
function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.toLowerCase());
}

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    console.log("[Login] button pressed", { email, password });

    // 🧾 Step 1: basic validation
    if (!email.trim() || !password.trim()) {
      showAlert("Login Failed", "Please enter both email and password.");
      return;
    }
    if (!isValidEmail(email.trim())) {
      showAlert(
        "Invalid Email",
        "Enter a valid college email (e.g. user@cit_nc.edu.in)"
      );
      return;
    }

    try {
      setLoading(true);
      console.log("[Login] sending request to", `${BACKEND}/api/auth/login`);

      // 📨 Step 2: Send login request
      const resp = await axios.post(
        `${BACKEND}/api/auth/login`,
        { email: email.trim(), password },
        { timeout: 8000 }
      );

      console.log("[Login] backend response", resp.data);

      const { token, user } = resp.data;

      // 🧠 Step 3: Save JWT token
      if (token) {
        if (Platform.OS === "web") {
          localStorage.setItem("token", token);
        } else {
          const AsyncStorage =
            require("@react-native-async-storage/async-storage").default;
          await AsyncStorage.setItem("token", token);
        }
        console.log("[Login] Token saved ✅");
      } else {
        console.warn("⚠️ No token received in response");
      }

      // 🧭 Step 4: Navigate by role
      showAlert("Login Success", `Welcome ${user?.role || ""}`);
      const role = user?.role;
      if (role === "admin") router.push("/admin-dashboard");
      else if (role === "warden") router.push("/warden-dashboard");
      else router.push("/student-dashboard");
    } catch (err: any) {
      console.error("[Login] error", err);

      if (err?.response) {
        const msg =
          err.response.data?.message || `Server error (${err.response.status})`;
        showAlert("Invalid Credentials", msg);
      } else if (err?.request) {
        showAlert("Connection Error", "Unable to reach backend server.");
      } else {
        showAlert("Error", err.message || "Unexpected error occurred.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.logo}>CIT_NC</Text>
      <Text style={styles.title}>Hostel Portal — Login</Text>

      <TextInput
        style={styles.input}
        placeholder="College Email"
        placeholderTextColor="#888"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
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

      <Text style={styles.hint}>
        Use college email (e.g. name@cit_nc.edu.in)
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 22,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#ffffff",
  },
  logo: {
    fontSize: 18,
    fontWeight: "700",
    color: "#2563eb",
    marginBottom: 6,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 22,
    color: "#0f172a",
  },
  input: {
    width: "100%",
    maxWidth: 520,
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 10,
    padding: 12,
    marginVertical: 8,
    backgroundColor: "#f8fafc",
  },
  button: {
    width: "100%",
    maxWidth: 520,
    marginTop: 14,
    backgroundColor: "#0b5cff",
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  buttonText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  hint: { marginTop: 16, color: "#64748b", fontSize: 13 },
});
