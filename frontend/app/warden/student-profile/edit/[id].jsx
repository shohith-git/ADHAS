import React, { useEffect, useState } from "react";
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
import { ActivityIndicator } from "react-native";

export default function EditStudentProfile() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const BACKEND = "http://10.69.232.21:5000";
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;

  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);

  // Fetch student data
  useEffect(() => {
    const fetchStudent = async () => {
      try {
        const res = await axios.get(`${BACKEND}/api/students/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setForm(res.data);
      } catch (err) {
        console.error("Error fetching student:", err.message);
        Alert.alert("Error", "Failed to fetch student data");
      }
    };
    fetchStudent();
  }, [id]);

  const handleChange = (key, value) => {
    setForm({ ...form, [key]: value });
  };

  const handleUpdate = async () => {
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
      Alert.alert("✅ Success", "Student profile updated successfully");
      router.replace({
        pathname: "/warden/student-profile",
        params: { refresh: Date.now().toString() },
      });
    } catch (err) {
      console.error("Error updating profile:", err.message);
      Alert.alert("Error", "Failed to update student profile");
    } finally {
      setSaving(false);
    }
  };

  if (!form)
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text>Loading student data...</Text>
      </View>
    );

  return (
    <ScrollView style={styles.page} contentContainerStyle={{ padding: 20 }}>
      <Text style={styles.header}>
        Edit Profile of {form.name || "Student"}
      </Text>
      <Text style={styles.subHeader}>{form.name}</Text>

      {/* Main Form */}
      <View style={styles.formSection}>
        <LabeledInput
          label="Department *"
          value={form.dept_branch || ""}
          onChangeText={(text) => handleChange("dept_branch", text)}
        />
        <LabeledInput
          label="Year *"
          value={String(form.year || "")}
          onChangeText={(text) => handleChange("year", text)}
        />
        <LabeledInput
          label="Batch *"
          value={form.batch || ""}
          onChangeText={(text) => handleChange("batch", text)}
        />
        <LabeledInput
          label="Room No *"
          value={form.room_no || ""}
          onChangeText={(text) => handleChange("room_no", text)}
        />
        <LabeledInput
          label="Gender"
          value={form.gender || ""}
          onChangeText={(text) => handleChange("gender", text)}
        />
        <LabeledInput
          label="Date of Birth"
          value={form.dob ? form.dob.split("T")[0] : ""}
          onChangeText={(text) => handleChange("dob", text)}
          placeholder="YYYY-MM-DD"
        />
        <LabeledInput
          label="Phone Number"
          value={form.phone_number || ""}
          onChangeText={(text) => handleChange("phone_number", text)}
          keyboardType="numeric"
        />
        <LabeledInput
          label="Address"
          value={form.address || ""}
          onChangeText={(text) => handleChange("address", text)}
        />

        {/* Parent Info */}
        <Text style={styles.sectionHeader}>Parent Details</Text>
        <LabeledInput
          label="Father Name"
          value={form.father_name || ""}
          onChangeText={(text) => handleChange("father_name", text)}
        />
        <LabeledInput
          label="Father Number"
          value={form.father_number || ""}
          onChangeText={(text) => handleChange("father_number", text)}
          keyboardType="numeric"
        />
        <LabeledInput
          label="Mother Name"
          value={form.mother_name || ""}
          onChangeText={(text) => handleChange("mother_name", text)}
        />
        <LabeledInput
          label="Mother Number"
          value={form.mother_number || ""}
          onChangeText={(text) => handleChange("mother_number", text)}
          keyboardType="numeric"
        />
      </View>

      <TouchableOpacity
        style={[styles.saveBtn, saving && { backgroundColor: "#93c5fd" }]}
        disabled={saving}
        onPress={handleUpdate}
      >
        <Text style={styles.saveText}>
          {saving ? "Updating..." : "Update Profile"}
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
  header: {
    fontSize: 24,
    fontWeight: "700",
    color: "#0f172a",
  },
  subHeader: {
    fontSize: 16,
    color: "#475569",
    marginBottom: 15,
  },
  formSection: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 16,
    elevation: 2,
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    color: "#0f172a",
    fontWeight: "600",
    marginBottom: 4,
  },
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
  centered: { flex: 1, alignItems: "center", justifyContent: "center" },
});
