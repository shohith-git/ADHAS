import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from "react-native";
import axios from "axios";
import { useLocalSearchParams, useRouter } from "expo-router";

export default function AddStudentProfile() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const BACKEND = "http://10.69.232.21:5000";
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;

  const [form, setForm] = useState({
    dept_branch: "",
    year: "",
    batch: "",
    room_no: "",
    gender: "",
    dob: "",
    phone_number: "",
    address: "",
    father_name: "",
    father_number: "",
    mother_name: "",
    mother_number: "",
  });
  const [saving, setSaving] = useState(false);

  const handleChange = (key, value) => {
    setForm({ ...form, [key]: value });
  };

  const handleSubmit = async () => {
    if (!form.dept_branch || !form.year || !form.batch || !form.room_no) {
      return Alert.alert(
        "⚠️ Missing Info",
        "Please fill all required (*) fields."
      );
    }
    try {
      setSaving(true);
      await axios.put(`${BACKEND}/api/students/${id}/details`, form, {
        headers: { Authorization: `Bearer ${token}` },
      });
      Alert.alert("✅ Success", "Student details added successfully");
      router.push({
        pathname: "/warden/student-profile",
        params: { refresh: Date.now().toString() },
      });
    } catch (err) {
      console.error("Error saving profile:", err.message);
      Alert.alert("Error", "Failed to save student details");
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView style={styles.page} contentContainerStyle={{ padding: 20 }}>
      <Text style={styles.header}>Add Student Details</Text>
      <Text style={styles.subHeader}>Student ID: {id}</Text>

      <View style={styles.formSection}>
        <LabeledInput
          label="Department *"
          value={form.dept_branch}
          onChangeText={(t) => handleChange("dept_branch", t)}
        />
        <LabeledInput
          label="Year *"
          value={String(form.year)}
          onChangeText={(t) => handleChange("year", t)}
        />
        <LabeledInput
          label="Batch *"
          value={form.batch}
          onChangeText={(t) => handleChange("batch", t)}
        />
        <LabeledInput
          label="Room No *"
          value={form.room_no}
          onChangeText={(t) => handleChange("room_no", t)}
        />
        <LabeledInput
          label="Gender"
          value={form.gender}
          onChangeText={(t) => handleChange("gender", t)}
        />
        <LabeledInput
          label="Date of Birth"
          placeholder="YYYY-MM-DD"
          value={form.dob}
          onChangeText={(t) => handleChange("dob", t)}
        />
        <LabeledInput
          label="Phone Number"
          value={form.phone_number}
          onChangeText={(t) => handleChange("phone_number", t)}
          keyboardType="numeric"
        />
        <LabeledInput
          label="Address"
          value={form.address}
          onChangeText={(t) => handleChange("address", t)}
        />

        <Text style={styles.sectionHeader}>Parent Details</Text>
        <LabeledInput
          label="Father Name"
          value={form.father_name}
          onChangeText={(t) => handleChange("father_name", t)}
        />
        <LabeledInput
          label="Father Number"
          value={form.father_number}
          onChangeText={(t) => handleChange("father_number", t)}
          keyboardType="numeric"
        />
        <LabeledInput
          label="Mother Name"
          value={form.mother_name}
          onChangeText={(t) => handleChange("mother_name", t)}
        />
        <LabeledInput
          label="Mother Number"
          value={form.mother_number}
          onChangeText={(t) => handleChange("mother_number", t)}
          keyboardType="numeric"
        />
      </View>

      <TouchableOpacity
        style={[styles.saveBtn, saving && { backgroundColor: "#93c5fd" }]}
        disabled={saving}
        onPress={handleSubmit}
      >
        <Text style={styles.saveText}>
          {saving ? "Saving..." : "Save Details"}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.cancelBtn} onPress={() => router.back()}>
        <Text style={styles.cancelText}>← Back</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

/* ✅ Reusable Input Field */
const LabeledInput = ({ label, ...props }) => (
  <View style={{ marginBottom: 12 }}>
    <Text style={styles.label}>{label}</Text>
    <TextInput style={styles.input} {...props} />
  </View>
);

const styles = StyleSheet.create({
  page: { backgroundColor: "#f8fafc", flex: 1 },
  header: { fontSize: 24, fontWeight: "700", color: "#0f172a" },
  subHeader: { fontSize: 16, color: "#475569", marginBottom: 15 },
  formSection: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 16,
    elevation: 2,
    marginBottom: 20,
  },
  label: { fontSize: 14, color: "#0f172a", fontWeight: "600", marginBottom: 4 },
  input: {
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 8,
    padding: 10,
    backgroundColor: "#f9fafb",
  },
  sectionHeader: {
    fontSize: 16,
    fontWeight: "700",
    color: "#2563eb",
    marginTop: 12,
    marginBottom: 6,
  },
  saveBtn: {
    backgroundColor: "#2563eb",
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  saveText: { color: "#fff", fontWeight: "700" },
  cancelBtn: {
    backgroundColor: "#e2e8f0",
    padding: 12,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 10,
  },
  cancelText: { color: "#0f172a", fontWeight: "700" },
});
