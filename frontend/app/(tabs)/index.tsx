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
import { Ionicons } from "@expo/vector-icons"; // 🆕 Added for password toggle
import AsyncStorage from "@react-native-async-storage/async-storage"; // 🆕 Native storage

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
  const [showPassword, setShowPassword] = useState(false); // 🆕 Added
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

      // 📨 Step 2: Send login request
      const resp = await axios.post(
        `${BACKEND}/api/auth/login`,
        { email: email.trim(), password },
        { timeout: 8000 }
      );

      const { token, user } = resp.data;
      if (!token || !user) {
        showAlert("Error", "Invalid response from server");
        return;
      }

      // 🆙 Step 3: Save JWT + user info
      if (Platform.OS === "web") {
        localStorage.setItem("token", token);
        localStorage.setItem("user_id", user.id);
        localStorage.setItem("email", user.email);
        localStorage.setItem("role", user.role);
      } else {
        await AsyncStorage.setItem("token", token);
        await AsyncStorage.setItem("user_id", String(user.id));
        await AsyncStorage.setItem("email", user.email);
        await AsyncStorage.setItem("role", user.role);
      }

      // 🆕 Clear login inputs
      setEmail("");
      setPassword("");

      // 🧭 Step 4: Navigate by role
      showAlert("Login Success", `Welcome ${user?.email || ""}`);
      const role = user?.role;
      if (role === "admin") router.replace("/admin-dashboard");
      else if (role === "warden") router.replace("/warden-dashboard");
      else router.replace("/student-dashboard");
    } catch (err: any) {
      console.error("[Login] error", err);
      if (err?.response)
        showAlert(
          "Invalid Credentials",
          err.response.data?.message || `Server error (${err.response.status})`
        );
      else if (err?.request)
        showAlert("Connection Error", "Unable to reach backend server.");
      else showAlert("Error", err.message || "Unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.logo}>CIT_NC</Text>
      <Text style={styles.title}>Hostel Portal — Login</Text>

      {/* Email input */}
      <TextInput
        style={styles.input}
        placeholder="College Email"
        placeholderTextColor="#888"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />

      {/* 🆕 Password input with eye icon */}
      <View style={styles.passwordContainer}>
        <TextInput
          style={[styles.input, { flex: 1, borderWidth: 0 }]}
          placeholder="Password"
          placeholderTextColor="#888"
          secureTextEntry={!showPassword}
          value={password}
          onChangeText={setPassword}
        />
        <TouchableOpacity
          onPress={() => setShowPassword(!showPassword)}
          style={styles.eyeIcon}
        >
          <Ionicons
            name={showPassword ? "eye-off-outline" : "eye-outline"}
            size={22}
            color={showPassword ? "#2563eb" : "#64748b"}
          />
        </TouchableOpacity>
      </View>

      {/* Login Button */}
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
  passwordContainer: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    maxWidth: 520,
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 10,
    backgroundColor: "#f8fafc",
    marginVertical: 8,
    paddingHorizontal: 10,
  },
  eyeIcon: { padding: 6 },
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
