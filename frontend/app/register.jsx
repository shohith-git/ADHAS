import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from "react-native";
import axios from "axios";
import { router } from "expo-router";

export default function RegisterScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const getDomain = (email) => {
    const parts = email.split("@");
    return parts.length > 1 ? parts[1] : "";
  };

  const handleRegister = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please fill all fields");
      return;
    }

    const domain = getDomain(email);
    if (!domain.includes("cit_nc")) {
      Alert.alert(
        "Invalid Email",
        "Use your official college email (e.g. @cit_nc.edu.in)"
      );
      return;
    }

    try {
      const response = await axios.post(
        "http://10.196.39.21:5000/api/auth/register",
        {
          email,
          password,
          role: "student",
        }
      );
      Alert.alert("Success", "Account created successfully!");
      router.push("/login");
    } catch (error) {
      console.error(error);
      Alert.alert(
        "Registration failed",
        error.response?.data?.message || "Something went wrong"
      );
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>CIT_NC Registration</Text>

      <TextInput
        style={styles.input}
        placeholder="College Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
      />

      <TextInput
        style={styles.input}
        placeholder="Password"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      <TouchableOpacity style={styles.button} onPress={handleRegister}>
        <Text style={styles.buttonText}>Register</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.push("/login")}>
        <Text style={styles.link}>Already have an account? Login</Text>
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
    padding: 20,
  },
  title: { fontSize: 24, fontWeight: "bold", marginBottom: 30 },
  input: {
    width: "100%",
    padding: 12,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
  },
  button: {
    backgroundColor: "#4a90e2",
    padding: 12,
    borderRadius: 8,
    marginTop: 10,
    width: "100%",
    alignItems: "center",
  },
  buttonText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
  link: { color: "#4a90e2", marginTop: 15 },
});
